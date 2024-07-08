from datetime import datetime, timedelta
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from .models import Booking, RoomDetail, Space, HotDeskDetail
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert, verify_jwt
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
import re
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

booking_ns = Namespace('booking', description='Booking operations')

# booking room model
booking_model = booking_ns.model('Booking request', {
    'room_id': fields.Integer(required=True, description='The room id'),
    'date': fields.Date(required=True, description='Date of the booking'),
    'start_time': fields.String(required=True, description='Start time of the booking (HH:MM)'),
    'end_time': fields.String(required=True, description='End time of the booking (HH:MM)')
})


# TODO!: long term booking request

# Apis about booking
@booking_ns.route('/book')
class BookSpace(Resource):
    # Book a room
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Book a space")
    @booking_ns.expect(booking_model)
    @booking_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    @jwt_required()
    def post(self):
        data = request.json
        current_user = get_jwt_identity()
        zid = current_user['zid']

        room_id = data['room_id']
        start_time = data['start_time']
        end_time = data['end_time']
        date = data['date']

        if not isinstance(data['room_id'], int):
            return {'error': 'room id must be integer'}, 400

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        if not re.match(r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', start_time) or not re.match(
                r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', end_time):
            return {'error': 'time must be in HH:MM format'}, 400

        if start_time > end_time:
            return {'error': 'Start time must earlier than end time'}, 400

        if start_time == end_time:
            return {'error': 'Start time and end time are same'}, 400

        conflict_bookings = Booking.query.filter(
            Booking.date == date,
            Booking.room_id == room_id,
            Booking.end_time > start_time,
            Booking.start_time < end_time
        ).all()

        if conflict_bookings:
            return {'error': 'Booking conflict, please check other time'}, 400

        user = db.session.get(Users, zid)
        if not user:
            return {'error': 'Invalid zid'}, 400
        user_type = user.user_type
        is_request = False
        if user_type != "CSE staff" and db.session.get(Space, room_id).space_type == "room":
            is_request = True
        if user_type == "CSE staff" and db.session.get(CSEStaff, zid).school_name != "CSE":
            is_request = True


        new_booking = Booking(
            room_id=room_id,
            user_id=zid,
            start_time=start_time,
            end_time=end_time,
            date=date,
            booking_status='confirmed',
            is_request=is_request
        )

        db.session.add(new_booking)
        db.session.commit()

        send_confirm_email_async(zid, room_id, date, start_time, end_time)
        schedule_reminder(zid, room_id, start_time, date, end_time)
        dt_start_time = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
        reminder_time = dt_start_time - timedelta(hours=1)

        return {'message': f'Booking confirmed'
                           f'room id: {room_id}'
                           f'start time: {start_time}'
                           f'end time: {end_time}'
                           f'date: {date}'
                }, 200


@booking_ns.route('/book/<int:booking_id>')
class BookSpace(Resource):
    @booking_ns.response(200, "Booking cancelled successfully")
    @booking_ns.response(404, "Booking not found")
    @booking_ns.response(401, "Unauthorized")
    @booking_ns.doc(description="Cancel a booking")
    @booking_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    def delete(self, booking_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        zid = current_user['zid']

        booking = Booking.query.filter_by(id=booking_id, user_id=zid).first()
        if not booking:
            return {'error': 'Booking not found'}, 404

        if booking.user_id != zid:
            return {'error': 'Unauthorized'}, 401

        booking.booking_status = 'cancelled'
        db.session.commit()

        return {'message': 'Booking cancelled successfully'}, 200


date_query = booking_ns.parser()
date_query.add_argument('date', type=str, required=True, help='Date to request')


# TODO! permission
# Apis about meeting room
@booking_ns.route('/meetingroom')
class MeetingRoom(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Get meeting room time list")
    @booking_ns.expect(date_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        try:
            verify_jwt_in_request()
        except exceptions.ExpiredSignatureError:
            return {"error": "Token is invalid"}, 401
        except exceptions.DecodeError:
            return {"error": "Token decode error"}, 422
        except exceptions.InvalidTokenError:
            return {"error": "Token is invalid"}, 422
        except Exception as e:
            return {"error": str(e)}, 500
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        date = request.args.get('date')
        user_type = db.session.get(Users, user_zid).user_type

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        # define output list
        output = {}
        output = generate_space_output(output, "meeting_room", user_type)
        output = generate_space_output(output, "hot_desk", user_type)


        # add time content
        for key, value in output.items():
            bookings = Booking.query.filter(
                Booking.date == date,
                Booking.room_id == key,
                Booking.booking_status != "cancelled"
            ).all()
            for booking in bookings:
                start_index, end_index = start_end_time_convert(booking.start_time, booking.end_time)
                for index in range(start_index, end_index):
                    value["time_table"][index] = {
                        "id": booking.id,
                        "current_user_booking": True if booking.user_id == user_zid else False
                    }
        return output, 200


def generate_space_output(output, book_type, user_type):

    if book_type == "meeting_room":
        details = RoomDetail.query.all()
    else:
        details = HotDeskDetail.query.all()
    for detail in details:
        output[detail.id] = {
            "id": detail.id,
            "name": detail.name,
            "building": detail.building,
            "level": detail.level,
            "capacity": detail.capacity,
            "type": book_type,
            "permission": check_permission(detail, user_type),
            "time_table": [[] for _ in range(48)]
        }
    return output


def check_permission(detail, user_type):
    if user_type == "HDR_student":
        return detail.HDR_student_permission
    elif user_type == "CSE_staff":
        return detail.CSE_staff_permission
    else:
        return False




@booking_ns.route('/meetingroom_report')
class meetingroom_report(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Get meeting room time list to report edition")
    @booking_ns.expect(date_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        try:
            verify_jwt_in_request()
        except exceptions.ExpiredSignatureError:
            return {"error": "Token is invalid"}, 401
        except exceptions.DecodeError:
            return {"error": "Token decode error"}, 422
        except exceptions.InvalidTokenError:
            return {"error": "Token is invalid"}, 422
        except Exception as e:
            return {"error": str(e)}, 500
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        date = request.args.get('date')

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        # define output list
        output = self.generate_report_output(date)
        # output["date"] = date
        return output, 200
    
    def generate_report_output(self, date):
        output = {}
        output["date"] = date
        bookings = Booking.query.filter(
                    Booking.date == date,
                ).all()
        res = [0 for _ in range(48)]
        for booking in bookings:
            start_slot, end_slot = start_end_time_convert(booking.start_time, booking.end_time)
            for i in range(start_slot, end_slot):
                res[i] += 1
        output["time_slot"] = res
        return output

    