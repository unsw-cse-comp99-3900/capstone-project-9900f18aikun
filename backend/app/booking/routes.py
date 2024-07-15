from datetime import datetime, timedelta, timezone
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from .models import Booking, RoomDetail, Space, HotDeskDetail, BookingStatus
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert, verify_jwt, get_room_name, is_student_permit
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
from sqlalchemy import and_, or_, not_
from app.config import Config
import re
from apscheduler.schedulers.background import BackgroundScheduler
import google.generativeai as genai
from datetime import datetime
import json
from sqlalchemy import func
import pytz
import random


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

        if conflict_bookings:
            return {'error': 'Booking conflict, please check other time'}, 400

        user = db.session.get(Users, zid)
        if not user:
            return {'error': 'Invalid zid'}, 400
        user_type = user.user_type
        is_request = False
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

        send_confirm_email_async(zid, room_id, date, start_time, end_time)
        schedule_reminder(zid, room_id, start_time, date, end_time)
        dt_start_time = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
        reminder_time = dt_start_time - timedelta(hours=1)

        return {'message': f"Booking confirmed\n"
                           f"room id: {room_id}\n"
                           f"start time: {start_time}\n"
                           f"end time: {end_time}\n"
                           f"date: {date}\n"
                           f"statu: {statu}\n"
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

        if booking.booking_status != BookingStatus.booked.value:
            return {'error': "You are not in booked status"}, 409

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
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        date = request.args.get('date')
        user_type = db.session.get(Users, user_zid).user_type

        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        # define output list
        output = {}
        output = self.generate_space_output(output, "meeting_room", user_type)
        output = self.generate_space_output(output, "hot_desk", user_type)


        # add time content
        for key, value in output.items():
            bookings = Booking.query.filter(
                Booking.date == date,
                Booking.room_id == key,
                Booking.booking_status != "cancelled",
                not_(and_(Booking.booking_status == "requested", Booking.user_id != user_zid)),
            ).all()
            for booking in bookings:
                start_index, end_index = start_end_time_convert(booking.start_time, booking.end_time)
                for index in range(start_index, end_index):
                    value["time_table"][index] = {
                        "id": booking.id,
                        "current_user_booking": True if booking.user_id == user_zid else False
                    }
        return output, 200

    def generate_space_output(self, output, book_type, user_type):

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
                "permission": self.check_permission(detail, user_type),
                "time_table": [[] for _ in range(48)]
            }
        return output

    def check_permission(self, detail, user_type):
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
                RoomDetail.id.notin_(db.session.query(booked_rooms_subquery.c.room_id))  # 明确引用子查询的列
            )
        else:
            query = db.session.query(HotDeskDetail).filter(
                HotDeskDetail.capacity >= max_capacity,
                HotDeskDetail.id.notin_(db.session.query(booked_rooms_subquery.c.room_id))  # 明确引用子查询的列
            )

        if level:
            if room_type == "meeting_room":
                query = query.filter(RoomDetail.level == level)
            else:
                query = query.filter(HotDeskDetail.level == level)

        available_rooms = query.all()

        available_room_details = [
            {"room_id": room.id,
             "name": room.name,
             "level": room.level,
             "capacity": room.capacity,
             "date": date,
             "start_time": start_time,
             "end_time": end_time}
            for room in available_rooms
        ]

        if len(available_room_details) > 5:
            available_room_details = random.sample(available_room_details, 5)

        if len(available_room_details) == 0:
            return {'error': "Sorry, we couldn't find a location that meets your needs."}, 400

        return available_room_details, 200

#1. 改成当天时间 
# 2. admin是prof 
# 3. admin给别人book ed
# 4.admin block房间 加一列 ed
# 5. admin给别人取消 ed
# 6.admin编辑房间信息 ed
# 7.把request信息返回给admin ziwen
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

        total_room = self.get_total_room()
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

    def get_total_room(self):
        room_number = db.session.query(func.count(RoomDetail.id)).scalar()
        desk_number = db.session.query(func.count(HotDeskDetail.id)).scalar()
        return room_number + desk_number

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
        