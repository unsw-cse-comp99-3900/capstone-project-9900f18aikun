from datetime import datetime, timedelta
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
from app.booking.models import Booking
from app.utils import verify_jwt
import re
from apscheduler.schedulers.background import BackgroundScheduler

history_ns = Namespace('history', description='History operations')


@history_ns.route('/booking-history')
class BookingHistory(Resource):
    @history_ns.doc(description="Get certain user's booking history, need jwt token")
    @history_ns.response(200, "Success")
    @history_ns.response(400, "Bad request")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        bookings = Booking.query.filter(
            Booking.user_id == user_zid,
            Booking.booking_status != 'deleted',
        ).order_by(Booking.start_time.desc()).all()
        if bookings:
            result = [{"booking_id": booking.id,
                       "room_id": booking.room_id,
                       "room_name": booking.room_name,
                       "user_id": booking.user_id,
                       "date": booking.date.isoformat() if booking.date else None,
                       "start_time": booking.start_time.isoformat() if booking.start_time else None,
                       "end_time": booking.end_time.isoformat() if booking.end_time else None,
                       "booking_status": booking.booking_status,
                       "is_request": booking.is_request} for booking in bookings]
        else:
            result = []

        return result, 200
