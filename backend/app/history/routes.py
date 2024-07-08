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
import re
from apscheduler.schedulers.background import BackgroundScheduler

history_ns = Namespace('history', description='History operations')

history_response_model = history_ns.model('Booking', {
    'id': fields.Integer(description='The booking unique identifier'),
    'room_id': fields.Integer(description='The room unique identifier'),
    'user_id': fields.String(description='The user unique identifier'),
    'date': fields.String(description='The booking date'),
    'start_time': fields.String(description='The booking start time'),
    'end_time': fields.String(description='The booking end time'),
    'booking_status': fields.String(description='The status of the booking'),
    'is_request': fields.Boolean(description='Whether it is a booking request')
})

booking_response_model = history_ns.model('BookingResponse', {
    'data': fields.List(fields.Nested(history_response_model), example=[
        {
            "id": 2,  # booking id
            "room_id": 2,
            "user_id": "z5405325",
            "date": "2024-07-01",
            "start_time": "02:00:00",
            "end_time": "03:00:00",
            "booking_status": "confirmed",
            "is_request": True
        },
        {
            "id": 1,
            "room_id": 1,
            "user_id": "z5405325",
            "date": "2024-07-01",
            "start_time": "01:00:00",
            "end_time": "02:00:00",
            "booking_status": "confirmed",
            "is_request": True
        }
    ])
})


@history_ns.route('/booking-history')
class BookingHistory(Resource):
    @history_ns.doc(description="Get certain user's booking history, need jwt token")
    @history_ns.response(200, "Success", booking_response_model)
    @history_ns.response(400, "Bad request")
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

        bookings = Booking.query.filter(
            Booking.user_id == user_zid,
            Booking.booking_status != 'deleted',
        ).order_by(Booking.start_time.desc()).all()
        if bookings:
            result = [{"booking_id": booking.id,
                       "room_id": booking.room_id,
                       "user_id": booking.user_id,
                       "date": booking.date.isoformat() if booking.date else None,
                       "start_time": booking.start_time.isoformat() if booking.start_time else None,
                       "end_time": booking.end_time.isoformat() if booking.end_time else None,
                       "booking_status": booking.booking_status,
                       "is_request": booking.is_request} for booking in bookings]
        else:
            result = []

        return result, 200
