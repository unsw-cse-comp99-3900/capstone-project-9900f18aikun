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
from app.utils import is_admin, get_user_name

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
                       "user_name": get_user_name(booking.user_id),
                       "date": booking.date.isoformat() if booking.date else None,
                       "start_time": booking.start_time.isoformat() if booking.start_time else None,
                       "end_time": booking.end_time.isoformat() if booking.end_time else None,
                       "booking_status": booking.booking_status,
                       "is_request": booking.is_request} for booking in bookings]
        else:
            result = []

        return result, 200

date_query = history_ns.parser()
date_query.add_argument('date', type=str, required=True, help='Date to request')

@history_ns.route('/alluser-booking-history')
class alluser_booking_history(Resource):
    @history_ns.doc(description="Get all user's booking history, need jwt token")
    @history_ns.expect(date_query)
    @history_ns.response(200, "Success")
    @history_ns.response(400, "Bad request")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        
        date = request.args.get('date')
        if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400

        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 400

        bookings = Booking.query.filter(
            Booking.date == date,
            Booking.booking_status != 'deleted',
        ).order_by(Booking.start_time.desc()).all()
        
        if bookings:
            result = [{"booking_id": booking.id,
                       "room_id": booking.room_id,
                       "room_name": booking.room_name,
                       "user_id": booking.user_id,
                       "user_name": get_user_name(booking.user_id),
                       "date": booking.date.isoformat() if booking.date else None,
                       "start_time": booking.start_time.isoformat() if booking.start_time else None,
                       "end_time": booking.end_time.isoformat() if booking.end_time else None,
                       "booking_status": booking.booking_status,
                       "is_request": booking.is_request
                       } for booking in bookings]
        else:
            result = []

        return result, 200
