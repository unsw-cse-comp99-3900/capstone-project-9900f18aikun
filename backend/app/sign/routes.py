from datetime import datetime, timedelta, timezone
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from app.booking.models import Booking, BookingStatus
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
from datetime import datetime, timedelta, date
import json
from sqlalchemy import func
import pytz

sign_in = Namespace('sign in', description='sign in name space')


@sign_in.route('/sign-in/<int:room_id>')
class Detail(Resource):
    @sign_in.doc(description="Sign in function")
    @sign_in.response(200, "Success")
    @sign_in.response(400, "Bad request")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self, room_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        zid = current_user['zid']

        today_date = date.today()
        now = datetime.now()

        bookings_on_date = Booking.query.filter(
            Booking.date == today_date,
            Booking.user_id == zid,
            Booking.room_id == room_id
        ).all()

        if not bookings_on_date:
            return {"message": "There is no reservation found for your room now."}, 400

        bookings = []
        for booking in bookings_on_date:
            start_datetime = datetime.combine(today_date, booking.start_time)
            print(start_datetime - timedelta(minutes=10))
            end_datetime = datetime.combine(today_date, booking.start_time)
            print(end_datetime + timedelta(minutes=15))
            print(now)
            if start_datetime - timedelta(minutes=10) < now <= end_datetime + timedelta(minutes=15):
                bookings.append(booking)

        if not bookings:
            return {"message": "No valid reservations within the time range."}, 400

        if len(bookings) == 0:
            return {"message": "There is no reservation found for your room now."}, 400

        if len(bookings) > 1:
            return {"error": "Booking crash"}, 400

        booking = bookings[0]

        match booking.booking_status:
            case BookingStatus.cancelled.value:
                return {"error": "your booking has canceled"}, 400
            case BookingStatus.signed_in.value:
                return {"error": "Your book already signed in"}, 400
            case BookingStatus.requested.value:
                return {"error": "Your request are not be confirmed"}, 400
            case BookingStatus.booked.value:
                booking.booking_status = BookingStatus.signed_in.value
                db.session.add(booking)
                db.session.commit()
                return {"message": "You have signed in"}, 200
            case _:
                return {"message": "Unknown status"}, 400







