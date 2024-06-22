from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.database import db
from .models import Booking
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request

booking_ns = Namespace('booking', description='Booking operations')

booking_model = booking_ns.model('Booking request', {
    'room_id': fields.Integer(required=True, description='The room id'),
    'date': fields.Date(required=True, description='Date of the booking'),
    'start_time': fields.String(required=True, description='Start time of the booking (HH:MM)'),
    'end_time': fields.String(required=True, description='End time of the booking (HH:MM)')
})

@booking_ns.route('/book')
class BookSpace(Resource):
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
