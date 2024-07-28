from datetime import datetime, timedelta, timezone
from flask_restx import Namespace, Resource, fields
from flask import request, Flask, jsonify
from app.extensions import db, api, scheduler, app
from .models import Booking, RoomDetail, Space, HotDeskDetail, BookingStatus
from app.models import Users, CSEStaff
from sqlalchemy.orm import joinedload
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import check_valid_room, get_total_room, get_user_name, is_admin, is_block, is_meeting_room, is_room_available, start_end_time_convert, verify_jwt, get_room_name, is_student_permit, is_student, is_booking_today, calculate_time_difference
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
from sqlalchemy import and_, or_, not_
from app.config import Config
from app.admin.models import NotificationView
from app.comment.routes import get_room_score
import re
from apscheduler.schedulers.background import BackgroundScheduler

import google.generativeai as genai
from datetime import datetime
import json
from sqlalchemy import func
from flask_socketio import emit
import pytz
import random


booking_ns = Namespace('booking', description='Booking operations')

# booking room model
booking_model = booking_ns.model('Booking request', {
    'room_id': fields.Integer(required=True, description='The room id', default=1),
    'date': fields.Date(required=True, description='Date of the booking', default="2024-07-16"),
    'start_time': fields.String(required=True, description='Start time of the booking (HH:MM)', default="12:00"),
    'end_time': fields.String(required=True, description='End time of the booking (HH:MM)', default="13:00"),
    'weeks_of_duration': fields.Integer(required=False, description='Number of weeks to repeat the booking', default=1)
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
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        data = request.json
        current_user = get_jwt_identity()
        zid = current_user['zid']

        room_id = data['room_id']
        start_time = data['start_time']
        end_time = data['end_time']
        date = data['date']
        weeks_of_duration = data.get('weeks_of_duration', 1)

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
        try:
            room_name = get_room_name(room_id)
        except:
            return {'error': 'Invalid room id'}, 400

        date = datetime.strptime(date, "%Y-%m-%d").date()

        if not is_room_available(room_id):
            return {'error': f"room {room_id} is unavailable"}, 400

        for week in range(weeks_of_duration):
            new_date = date + timedelta(weeks=week)
            error = book_or_request(new_date, room_id, start_time, end_time, zid, room_name)
            if error:
                return error

        send_confirm_email_async(zid, room_id, date, start_time, end_time, weeks_of_duration)

        return {'message': f"Booking confirmed\n"
                           f"room id: {room_id}\n"
                           f"start time: {start_time}\n"
                           f"end time: {end_time}\n"
                           f"date: {date}\n"
                }, 200


def check_conflict_booking(date, room_id, start_time, end_time):
    conflict_bookings = Booking.query.filter(
        Booking.date == date,
        Booking.room_id == room_id,
        Booking.booking_status != "requested",
        Booking.booking_status != "cancelled",
        Booking.booking_status != BookingStatus.absent.value,
        or_(
            and_(Booking.start_time >= start_time, Booking.start_time < end_time),
            and_(Booking.end_time > start_time, Booking.end_time <= end_time),
            and_(Booking.start_time <= start_time, Booking.end_time >= end_time),
            and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
        )
    ).all()
    return conflict_bookings


def book_or_request(date, room_id, start_time, end_time, zid, room_name):
    conflict_bookings = check_conflict_booking(date, room_id, start_time, end_time)

    if conflict_bookings:
        return {'error': 'Booking conflict, please check other time'}, 400

    # check the total book time
    user_books = Booking.query.filter(
        and_(
            Booking.user_id == zid,
            Booking.date == date,
            Booking.booking_status != BookingStatus.cancelled.value,
            Booking.booking_status != BookingStatus.requested.value
        )
    )

    total_duration = timedelta()
    for booking in user_books:
        total_duration += calculate_time_difference(date, booking.start_time, booking.end_time)
    # add this book time
    total_duration += calculate_time_difference(date, start_time + ":00", end_time + ":00")

    if total_duration > timedelta(hours=8):
        return {'error': 'Total booking time exceeds 8 hours, no further bookings allowed.'}, 400

    user = db.session.get(Users, zid)
    if not user:
        return {'error': 'Invalid zid'}, 400
    user_type = user.user_type
    is_request = False
    print(user_type)
    if user_type != "CSE_staff" and not is_student_permit(room_id):
        is_request = True
    if user_type == "CSE_staff" and db.session.get(CSEStaff, zid).school_name != "CSE":
        is_request = True
    status = 'booked'
    if is_request:
        status = 'requested'

    new_booking = Booking(
        room_id=room_id,
        room_name=room_name,
        user_id=zid,
        start_time=start_time,
        end_time=end_time,
        date=date,
        booking_status=status,
        is_request=is_request
    )
    statu = new_booking.booking_status
    db.session.add(new_booking)
    db.session.commit()
    if statu == BookingStatus.requested.value:
        emit('request_notification', {'user_id': zid, 'name': get_user_name(zid)}, room="notification", namespace='/')
        db.session.query(NotificationView).update({NotificationView.is_viewed: False}, synchronize_session='fetch')
        db.session.commit()

    bookingid = new_booking.id
    schedule_reminder(zid, room_id, start_time, date, end_time)
    dt_start_time = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
    check_time = dt_start_time + timedelta(minutes=15)
    scheduler.add_job(schedule_check_sign_in, 'date', run_date=check_time, args=[bookingid])


def schedule_check_sign_in(bookingid):
    from app.extensions import db, app
    with app.app_context():  
        booking = Booking.query.get(bookingid)
        if booking and (booking.booking_status == "booked" or booking.booking_status == "requested"):
            booking.booking_status = "absent"
            db.session.commit()


# booking room model
admin_booking_model = booking_ns.model('admin booking request', {
    'user_id': fields.String(required=True, description='Start time of the booking (HH:MM)', default="z1"),
    'room_id': fields.Integer(required=True, description='The room id', default=1),
    'date': fields.Date(required=True, description='Date of the booking', default="2024-07-19"),
    'start_time': fields.String(required=True, description='Start time of the booking (HH:MM)', default="12:00"),
    'end_time': fields.String(required=True, description='End time of the booking (HH:MM)', default="13:00")
})


# Apis about booking
@booking_ns.route('/admin_book')
class AdminBook(Resource):
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.doc(description="Admin book function")
    @booking_ns.expect(admin_booking_model)
    @booking_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    @jwt_required()
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        data = request.json
        current_user = get_jwt_identity()
        admin_id = current_user['zid']
        if not is_admin(admin_id):
            return {'error': "Sorry, you don't have admin permit"}, 403

        room_id = data['room_id']
        start_time = data['start_time']
        end_time = data['end_time']
        date = data['date']
        user_id = data['user_id']

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
        try:
            room_name = get_room_name(room_id)
        except:
            return {'error': 'Invalid room id'}, 400

        conflict_bookings = Booking.query.filter(
            Booking.date == date,
            Booking.room_id == room_id,
            Booking.booking_status != "requested",
            Booking.booking_status != "cancelled",
            or_(
                and_(Booking.start_time >= start_time, Booking.start_time < end_time),
                and_(Booking.end_time > start_time, Booking.end_time <= end_time),
                and_(Booking.start_time <= start_time, Booking.end_time >= end_time),
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        ).all()

        if not is_room_available(room_id):
            return {'error': f"room {room_id} is unavailable"}, 400

        for conflict_booking in conflict_bookings:
            conflict_booking.booking_status = "cancelled"
        db.session.commit()

        user = db.session.get(Users, user_id)
        if not user:
            return {'error': 'Invalid zid'}, 400
        user_type = user.user_type
        is_request = False
        status = 'booked'

        new_booking = Booking(
            room_id=room_id,
            room_name=room_name,
            user_id=user_id,
            start_time=start_time,
            end_time=end_time,
            date=date,
            booking_status=status,
            is_request=is_request
        )
        statu = new_booking.booking_status
        db.session.add(new_booking)
        db.session.commit()

        send_confirm_email_async(user_id, room_id, date, start_time, end_time, 1)
        schedule_reminder(user_id, room_id, start_time, date, end_time)
        dt_start_time = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
        reminder_time = dt_start_time - timedelta(hours=1)

        return {'message': f"Booking confirmed"}, 200


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

        if booking.booking_status != BookingStatus.booked.value and booking.booking_status != BookingStatus.requested.value:
            return {'error': "You are not in booked or requested status"}, 409

        booking.booking_status = 'cancelled'
        booking.is_request = False
        db.session.commit()

        return {'message': 'Booking cancelled successfully'}, 200


date_query = booking_ns.parser()
date_query.add_argument('date', type=str, required=True, help='Date to request', default="2024-07-19")
book_time_query = booking_ns.parser()
book_time_query.add_argument('date', type=str, required=True, help='Date to request', default="2024-07-19")
book_time_query.add_argument('is_ranked', type=bool, required=False, help='Flag to indicate if ranking is required', default=False, store_missing=True)

roomid_query = booking_ns.parser()
roomid_query.add_argument('roomid', type=int, required=True, help='roomid')


# TODO! permission
# Apis about meeting room
@booking_ns.route('/meetingroom')
class MeetingRoom(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Get meeting room time list")
    @booking_ns.expect(book_time_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        date = request.args.get('date')
        is_rank = request.args.get('is_ranked')

        user_type = db.session.get(Users, user_zid).user_type

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        # define output list
        output = []
        output = self.generate_space_output(output, "meeting_room", user_type)
        output = self.generate_space_output(output, "hot_desk", user_type)

        # add time content
        for value in output:
            bookings = Booking.query.filter(
                Booking.date == date,
                Booking.room_id == value["id"],
                Booking.booking_status != "cancelled",
                not_(and_(Booking.booking_status == "requested", Booking.user_id != user_zid)),
            ).all()
            for booking in bookings:
                start_index, end_index = start_end_time_convert(booking.start_time, booking.end_time)
                for index in range(start_index, end_index):
                    if value["time_table"][index]:
                        if not value["time_table"][index]["is_request"]:
                            continue
                    value["time_table"][index] = {
                        "id": booking.id,
                        "user_id": booking.user_id,
                        "booking_status": booking.booking_status,
                        "is_request": booking.is_request,
                        "current_user_booking": True if booking.user_id == user_zid else False
                    }
        if is_rank:
            output = sorted(output, key=lambda item: (item['rank'] is not None, item['rank']), reverse=True)


        return output, 200

    def generate_space_output(self, output, book_type, user_type):

        if book_type == "meeting_room":
            details = RoomDetail.query.all()
        else:
            details = HotDeskDetail.query.all()
        for detail in details:
            is_available = is_room_available(detail.id)
            output.append({
                "id": detail.id,
                "name": detail.name,
                "building": detail.building,
                "level": detail.level,
                "capacity": detail.capacity,
                "type": book_type,
                "permission": check_permission(detail, user_type),
                "is_available": is_available,
                "rank": get_room_score(detail.id),
                "time_table": [[] for _ in range(48)],
            })
        return output

def check_permission(detail, user_type):
    if user_type == "HDR_student":
        return detail.HDR_student_permission
    elif user_type == "CSE_staff":
        return detail.CSE_staff_permission
    else:
        return False


@booking_ns.route('/meetingroom-report')
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


express_booking_model = booking_ns.model('Express booking request', {
    'query': fields.String(required=True, description='The description of the room what user want'),
    'room_type': fields.String(required=True, description='The description of the room what user want'),
})


@booking_ns.route('/express-book')
class ExpressBook(Resource):
    # Book a room
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.doc(description="Express booking")
    @booking_ns.expect(express_booking_model)
    @booking_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        data = request.json
        current_user = get_jwt_identity()
        zid = current_user['zid']

        query = data['query']
        room_type = data['room_type']
        today = datetime.now()
        today = today.strftime('%Y-%m-%d')
        api_key = Config.API_KEY
        genai.configure(api_key=api_key)

        model = genai.GenerativeModel('gemini-1.5-flash',
                                      generation_config={"response_mime_type": "application/json"})

        prompt = f"""
          {query}

          Recipe = {{
                "level": string, chooe one from ("LG", "G", "1", "2", "3", "4", "5", "6", "7") or None if not provide
                "start_time": string "HH:NN", or None if not provide,
                "end_time": string "HH:NN", or None if not provide,
                 "date": string "YYYY-MM-DD" as type, or None if not provide,
                 “max_capacity”: int, or None if not provide,   
            }}
          if the data is not provide filled with  Null.
          today is {today}

          Return a `return recipe, a json format`
          """

        try:
            response = model.generate_content(prompt)
            response_json = json.loads(response.text)
            print(response_json)
        except Exception as e:
            print("Error generating content:", str(e))
            return {'error':  str(e)}, 500

        level = response_json.get('level')
        start_time = response_json.get('start_time')
        end_time = response_json.get('end_time')
        date = response_json.get('date')
        max_capacity = response_json.get('max_capacity')

        if not start_time or not end_time:
            return {'error': "Sorry, we can't get start time or end time, please try again"}, 400
        if not max_capacity:
            max_capacity = 1
        if not date:
            date = today

        if room_type == "hot_desk" and max_capacity > 1:
            return {'error': "Sorry, the max capacity of hot desk is 1."}, 400

        booked_rooms_subquery = db.session.query(Booking.room_id).filter(
            Booking.date == date,
            Booking.booking_status != "requested",
            Booking.booking_status != "cancelled",
            or_(
                and_(Booking.start_time >= start_time, Booking.start_time < end_time),
                and_(Booking.end_time > start_time, Booking.end_time <= end_time),
                and_(Booking.start_time <= start_time, Booking.end_time >= end_time),
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
            )
        ).distinct().subquery()

        if room_type == "meeting_room":
            query = db.session.query(RoomDetail).filter(
                RoomDetail.capacity >= max_capacity,
                RoomDetail.id.notin_(db.session.query(booked_rooms_subquery.c.room_id))
            )
        else:
            query = db.session.query(HotDeskDetail).filter(
                HotDeskDetail.capacity >= max_capacity,
                HotDeskDetail.id.notin_(db.session.query(booked_rooms_subquery.c.room_id))
            )

        if level:
            if room_type == "meeting_room":
                query = query.filter(RoomDetail.level == level)
            else:
                query = query.filter(HotDeskDetail.level == level)

        available_rooms = query.all()
        user_type = "staff"
        if is_student(zid):
            user_type = "student"
        elif db.session.get(CSEStaff, zid).school_name != "CSE":
            user_type = "non-cse_staff"


        unfiltered_available_room_details = [
            {"room_id": room.id,
             "name": room.name,
             "level": room.level,
             "capacity": room.capacity,
             "date": date,
             "start_time": start_time,
             "end_time": end_time,
             "permission": express_permission(user_type, room.HDR_student_permission)}
            for room in available_rooms
        ]
        available_room_details = []
        for room in unfiltered_available_room_details:
            if is_room_available(room["room_id"]):
                available_room_details.append(room)

        if len(available_room_details) == 0:
            return {'error': "Sorry, we couldn't find a location that meets your needs."}, 400

        rooms_with_permission = []
        rooms_without_permission = []

        for room in available_room_details:
            if room['permission']:
                rooms_with_permission.append(room)
            else:
                rooms_without_permission.append(room)
        permission_room_len = len(rooms_with_permission)
        all_room_len = len(available_room_details)

        if len(rooms_with_permission) >= 5:
            output = random.sample(rooms_with_permission, 5)
        else:
            without_permission_output = random.sample(rooms_without_permission, min((all_room_len - permission_room_len), (5 - permission_room_len)))
            output = rooms_with_permission + without_permission_output

        return output, 200
def express_permission(user_type, student_permission):
    if user_type == "student":
        return student_permission
    if user_type == "non-cse_staff":
        return False
    return True
#1. 改成当天时间 1 ------
# 2. admin是prof 1-------
# 3. admin给别人book ed 如果占着就强行取消 ----------
# 4.admin block房间 加一列 ed --------
# 5. admin给别人取消 ed -----------
# 6.admin编辑房间信息 ed  ----------
# 7.把request信息返回给admin ziwen -----------
# 8.express booking改成is_available jackson --------
# 9. 返回文字版报告
# 10. 超时15min自动取消 只用改canceled
# 11. 举报发给admin ed   ---------
@booking_ns.route('/meetingroom-usage')
class meetingroom_usage(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.expect(date_query)
    @booking_ns.doc(description="Get meeting room usage detail list to report edition")
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

        total_room = get_total_room()
        usage = self.get_booking_list(date)
        current_date = datetime.strptime(date, '%Y-%m-%d')
        temp_date = current_date + timedelta(days=7)
        end_date = temp_date.strftime('%Y-%m-%d')
        return {
            "total_number": total_room,
            "start_date": date,
            "end_date": end_date,
            "usage": usage
        }, 200

    def get_booking_list(self, date):
        usage = []
        sydney_date = date
        for i in range(7):
            current_date = datetime.strptime(sydney_date, '%Y-%m-%d')
            future_date = current_date + timedelta(days=i)
            temp_date = future_date.strftime('%Y-%m-%d')
            booking_number = Booking.query.filter(
                    Booking.date == temp_date,
                ).distinct(Booking.room_id).count()
            usage.append(booking_number)
        return usage
    
    def get_sydney_current_date(self):
        sydney_tz = pytz.timezone('Australia/Sydney')
        sydney_time = datetime.now(timezone.utc).astimezone(sydney_tz)
        formatted_date = sydney_time.strftime('%Y-%m-%d')
        return formatted_date

@booking_ns.route('/block-room')
class block_room(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.expect(roomid_query)
    @booking_ns.doc(description="admin block room")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        roomid = int(request.args.get('roomid'))
        if not roomid:
            return {"message": "Room ID is required"}, 400
        
        if is_block(roomid):
            return {"message": f"Room {roomid} is already blocked"}, 200
        
        space = Space.query.get(roomid)
        if space:
            space.is_available = False
            db.session.commit()
            self.clean_booking(roomid)
            return {
                "message": f"{user_zid} set room {roomid} unavailable"
            }, 200
        else:
            return {
                "error": "invalid roomid"
            }, 400
    
    def clean_booking(self, roomid):
        bookings = Booking.query.filter(
                    Booking.room_id == roomid,
                ).all()
        for booking in bookings:
            booking.booking_status = "cancelled"
        db.session.commit()

        
@booking_ns.route('/unblock-room')
class unblock_room(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.expect(roomid_query)
    @booking_ns.doc(description="admin unblock room")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        roomid = int(request.args.get('roomid'))
        if not roomid:
            return {"message": "Room ID is required"}, 400
        
        if not is_block(roomid):
            return {"message": f"Room {roomid} is already available"}, 200
        
        space = Space.query.get(roomid)
        if space:
            space.is_available = True
            db.session.commit()
            return {
                "message": f"{user_zid} set room {roomid} available"
            }, 200
        else:
            return {
                "error": "invalid roomid"
            }, 400
        
roomid_edit_model = booking_ns.model('roomid_edit_model', {
    'room_id': fields.Integer(required=True, description='edit room id', default=1),
    'name': fields.String(description='New name of the room', default="G01"),
    'building': fields.String(description='New level of the room', default="K17"),
    'capacity': fields.Integer(description='New capacity of the room', default=1),
    'level': fields.String(description='New level of the room', default="G"),
})

@booking_ns.route('/edit-room')
class edit_room(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.expect(roomid_edit_model)
    @booking_ns.doc(description="admin edit room")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def put(self):
        args = request.json
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        roomid = args['room_id']
        if not check_valid_room(roomid):
            return {
                "error": f"invalid roomid {roomid}"
            }, 400
        self.set_room(args)
        return self.show_room(args), 200
    
    def set_room(self, args):
        roomid = args["room_id"]
        if is_meeting_room(roomid):
            room = RoomDetail.query.get(roomid)
            room.name = args["name"]
            room.building = args["building"]
            room.capacity = args["capacity"]
            room.level = args["level"]
            db.session.commit()
        else:
            room = HotDeskDetail.query.get(roomid)
            room.name = args["name"]
            room.building = args["building"]
            room.capacity = args["capacity"]
            room.level = args["level"]
            db.session.commit()
    def show_room(self, args):
        roomid = args["room_id"]
        if is_meeting_room(roomid):
            detail = RoomDetail.query.get(roomid)
        else:
            detail = HotDeskDetail.query.get(roomid)
        return {
            "id": detail.id,
            "name": detail.name,
            "building": detail.building,
            "capacity": detail.capacity,
            "level": detail.level,
            "is_available": is_room_available(roomid)
        }


@booking_ns.route('/meetingroom-top10-byCount')
class meetingroom_top10(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.expect(date_query)
    @booking_ns.doc(description="Get meeting room top10 list")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        date = request.args.get('date')
        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        start_date = date
        temp_date = datetime.strptime(date, '%Y-%m-%d') + timedelta(days=7)
        end_date = temp_date.strftime('%Y-%m-%d')

        top_list = self.get_top_list(start_date, end_date)

        return {
            "start_date": date,
            "end_date": end_date,
            "top_list": top_list
        }, 200

    def get_top_list(self, start_date, end_date):
        rooms = db.session.query(
            Booking.room_id,
            Booking.room_name,
            func.count(Booking.id).label('booking_count')
        ).filter(
            Booking.date.between(start_date, end_date)
        ).group_by(
            Booking.room_id,
            Booking.room_name,
        ).order_by(
            func.count(Booking.id).desc()
        ).limit(10).all()

        top_list = [{
            'room_id': room_id, 
            "room_name": room_name,
            'booking_count': booking_count} for room_id, room_name, booking_count in rooms]
        return top_list


@booking_ns.route('/show-request')
class show_request(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.doc(description="show request for admin")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        return {
            "requests": self.get_request()
        }, 200
    
    def get_request(self):
        res = []
        sydney_tz = pytz.timezone('Australia/Sydney')
        sydney_time = datetime.now(timezone.utc).astimezone(sydney_tz)
        formatted_date = sydney_time.strftime('%Y-%m-%d')
        requests = Booking.query.filter(
                    Booking.booking_status == "requested",
                    Booking.date >= formatted_date
                ).all()
        for request in requests:
            temp = {
                "booking_id": request.id,
                "room_id": request.room_id,
                "room_name": request.room_name,
                "user_id": request.user_id,
                "user_name":get_user_name(request.user_id),
                "date": request.date.isoformat(),
                "start_time": request.start_time.isoformat(),
                "end_time": request.end_time.isoformat(),
                "booking_status": request.booking_status,
                "is_request": request.is_request
            }   
            res.append(temp)
        return res

request_model = booking_ns.model('request handling', {
    'booking_id': fields.Integer(required=True, description='The booking id', default=1),
    'confirmed': fields.Boolean(description='Confirmed status', default=True)
})


@booking_ns.route('/handle-request')
class handle_request(Resource):
    # Get the
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(403, "Forbidden")
    @booking_ns.expect(request_model)
    @booking_ns.doc(description="handle request for admin")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        data = request.json
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        booking_id = data['booking_id']
        confirmed = data['confirmed']
        if confirmed:
            my_request = Booking.query.get(booking_id)
            my_request.booking_status = "booked"
            my_request.is_request = False
            db.session.commit()
            return {
                "message": f"admin {user_zid} set booking id {booking_id} as booked"
            }, 200
        else:
            my_request = Booking.query.get(booking_id)
            my_request.booking_status = "cancelled"
            db.session.commit()
            return {
                "message": f"admin {user_zid} set booking id {booking_id} as cancelled"
            }, 200


@booking_ns.route("/is_book_today")
class CheckBookToday(Resource):
    @booking_ns.doc(description="Check user whether is admin")
    @booking_ns.response(200, "Success")
    @booking_ns.response(400, "Bad request")

    @booking_ns.expect(date_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        date = request.args.get('date')
        current_user = get_jwt_identity()
        zid = current_user['zid']

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        return {'is_booking_today': is_booking_today(date, zid)}, 200


@booking_ns.route('/extend_book/<int:booking_id>')
class ExtendBook(Resource):
    # Book a room
    @booking_ns.response(200, "success")
    @booking_ns.response(400, "Bad request")
    @booking_ns.response(404, "User not found")
    @booking_ns.response(409, "Booking conflict")
    @booking_ns.doc(description="Book a space")
    @booking_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self, booking_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        zid = current_user['zid']



        original_book = db.session.get(Booking, booking_id)
        date = original_book.date
        room_id = original_book.room_id
        start_time = original_book.end_time
        end_time = (datetime.combine(date, start_time) + timedelta(hours=1)).time()

        user = db.session.get(Users, zid)
        if not user:
            return {'error': 'Invalid zid'}, 404
        user_type = user.user_type

        if user_type != "CSE_staff" and not is_student_permit(room_id):
            return {
                'error': "Sorry, you don't have the permission to extend this booking, please request a new book"}, 400
        if user_type == "CSE_staff" and db.session.get(CSEStaff, zid).school_name != "CSE":
            return {
                'error': "Sorry, you don't have the permission to extend this booking, please request a new book"}, 400

        conflict_bookings = check_conflict_booking(date, room_id, start_time, end_time)

        if conflict_bookings:
            return {'error': 'Booking conflict, please check other time'}, 409

        new_booking = Booking(
            room_id=room_id,
            room_name=original_book.room_name,
            user_id=zid,
            start_time=start_time,
            end_time=end_time,
            date=date,
            booking_status=BookingStatus.booked.value,
            is_request=False
        )
        db.session.add(new_booking)
        db.session.commit()
        return {'message': 'Extend successful'}, 200