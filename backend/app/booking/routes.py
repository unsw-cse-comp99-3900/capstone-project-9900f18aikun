from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from .models import Booking, RoomDetail
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert
from jwt import exceptions

booking_ns = Namespace('booking', description='Booking operations')

# booking room model
booking_model = booking_ns.model('Booking request', {
    'room_id': fields.Integer(required=True, description='The room id'),
    'date': fields.Date(required=True, description='Date of the booking'),
    'start_time': fields.String(required=True, description='Start time of the booking (HH:MM)'),
    'end_time': fields.String(required=True, description='End time of the booking (HH:MM)')
})

# TODO: long term booking
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

        conflict_bookings = Booking.query.filter(
            Booking.date == date,
            Booking.room_id == room_id,
            Booking.end_time > start_time,
            Booking.start_time < end_time
        ).all()

        if conflict_bookings:
            return {'error': 'Booking conflict, please check other time'}, 400

        new_booking = Booking(
            room_id=room_id,
            user_id=zid,
            start_time=start_time,
            end_time=end_time,
            date=date,
            booking_status='confirmed'
        )
        db.session.add(new_booking)
        db.session.commit()

        return {'message': 'Booking confirmed'}, 200


date_query = booking_ns.parser()
date_query.add_argument('date', type=str, required=True, help='Date to request')


# Apis about meeting room
@booking_ns.route('/meetingroom')
class MeetingRoom(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Get meeting room time list")
    @booking_ns.expect(date_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    @jwt_required()
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
            print(e)
            return {"error": str(e)}, 500
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        date = request.args.get('date')

        # define output list
        output = {}

        rooms = RoomDetail.query.all()
        for room in rooms:
            output[room.id] = {
                "name": room.name,
                "building": room.building,
                "level": room.level,
                "capacity": room.capacity,
                "HDR_student_permission": room.HDR_student_permission,
                "CSE_staff_permission": room.CSE_staff_permission,
                "time_table":  [[] for _ in range(48)]
            }

        for key, value in output.items():
            bookings = Booking.query.filter(
                Booking.date == date,
                Booking.room_id == key,
            ).all()
            for booking in bookings:
                start_index, end_index = start_end_time_convert(booking.start_time,booking.end_time)
                print(f"{start_index}, {end_index}")
                for index in range(start_index, end_index):
                    value["time_table"][index] = {
                        "id": booking.id,
                        "current_user_booking": True if booking.user_id == user_zid else False
                    }

        return output, 200
