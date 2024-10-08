"""
This file contain the api for sign in
"""
from flask_restx import Namespace, Resource
from app.extensions import db, api, scheduler
from app.booking.models import Booking, BookingStatus
from flask_jwt_extended import get_jwt_identity
from app.utils import verify_jwt
from datetime import datetime, timedelta, date

sign_in = Namespace('sign in', description='sign in name space')


# sign in function
# currently allow user to sign in the range of before start time 10 min to after start time 15 min
@sign_in.route('/sign-in/<int:room_id>')
class Detail(Resource):
    @sign_in.doc(description="Sign in function")
    @sign_in.response(200, "Success")
    @sign_in.response(400, "Bad request")
    @sign_in.response(401, "Token is expired")
    @sign_in.response(422, "Token is invalid")
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
            Booking.room_id == room_id,
            Booking.booking_status == BookingStatus.booked.value,
        ).all()

        if not bookings_on_date:
            return {"message": "There is no reservation found for your room now."}, 400

        bookings = []
        for booking in bookings_on_date:
            start_datetime = datetime.combine(today_date, booking.start_time)
            end_datetime = datetime.combine(today_date, booking.start_time)
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
                end_time = booking.end_time
                book_date = booking.date
                booking_end_time = datetime.strptime(f"{book_date} {end_time}", "%Y-%m-%d %H:%M:%S")
                scheduler.add_job(schedule_set_completed, 'date', run_date=booking_end_time, args=[booking.id])
                return {"message": "You have signed in"}, 200
            case _:
                return {"message": "Unknown status"}, 400

def schedule_set_completed(bookingid):
    from app.extensions import db, app
    with app.app_context():  
        booking = Booking.query.get(bookingid)
        booking.booking_status = "completed"
        db.session.commit()
