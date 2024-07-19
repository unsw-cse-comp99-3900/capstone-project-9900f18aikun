from datetime import datetime, timedelta
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import check_valid_comment, get_total_room, is_valid_date, start_end_time_convert
from app.email import get_email, schedule_reminder, send_confirm_email_async, send_report_email_async
from jwt import exceptions
from app.booking.models import Booking
from app.comment.models import Comment
from app.utils import verify_jwt, is_admin
import re
from apscheduler.schedulers.background import BackgroundScheduler
from app.utils import is_admin, get_user_name

admin_ns = Namespace('admin', description='Admin operations')

@admin_ns.route("/check_admin")
class CheckAdmin(Resource):
    @admin_ns.doc(description="Check user whether is admin")
    @admin_ns.response(200, "Success")
    @admin_ns.response(400, "Bad request")
    @admin_ns.response(403, "Forbidden")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        try:
            whether_admin = is_admin(user_zid)
        except:
            return {'error': "can't get admin"}, 403
        return {"is_admin": whether_admin}, 200


report_model = admin_ns.model('send report', {
    'message': fields.String(required=True, description='report content', default="G01 table missing")
})

@admin_ns.route("/report")
class report(Resource):
    @admin_ns.doc(description="send report to admin")
    @admin_ns.response(200, "Success")
    @admin_ns.response(400, "Bad request")
    @admin_ns.response(403, "Forbidden")
    @admin_ns.expect(report_model)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        msg = request.json["message"]
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        to_zid = "z5"
        to_name = get_user_name(to_zid)
        send_report_email_async(user_zid, to_zid, msg)
        return {
            "reporter": f"{user_zid}",
            "message": f"{msg}",
            "to_zid": f"{to_zid}",
            "to_name": f"{to_name}"
        }, 200

date_query = admin_ns.parser()
date_query.add_argument('date', type=str, required=True, help='Date to request', default="2024-07-18")

@admin_ns.route("/get-usage-report-txt")
class get_usage_report_txt(Resource):
    @admin_ns.doc(description="admin get text usage report")
    @admin_ns.response(200, "Success")
    @admin_ns.response(400, "Bad request")
    @admin_ns.response(403, "Forbidden")
    @admin_ns.expect(date_query)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        
        date = request.args.get('date')
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        if not is_valid_date(date):
            return {'error': 'Date must be in YYYY-MM-DD format'}, 400
        if not is_admin(user_zid):
            return {
                "error": f"user {user_zid} is not admin"
            }, 403
        top_room, room_times = self.most_booked_room(date)
        top_user, user_times = self.most_booked_user_name(date)
        if user_times > 0 :
            user_name = get_user_name(top_user)
        else:
            user_name = "No user"
        
        res = f"""The total number of rooms, including hot desks and meeting rooms, is {get_total_room()}. \
On {date}, there were {self.get_booking_count_by_date(date)} reservations made, covering {self.get_booking_room_count_by_date(date)} different rooms, booked by {self.get_booking_user_count_by_date(date)} users.\
The most frequently booked room was {top_room}, which had {room_times} reservations on that day. \
The user with the most bookings was {user_name}({top_user}), who made {user_times} reservations."""
        return {
            "msg":res
        }, 200
        
    def get_booking_count_by_date(self, date) -> int:
        return Booking.query.filter(Booking.date == date).count()
    
    def get_booking_room_count_by_date(self, date) -> int:
        return Booking.query.with_entities(Booking.room_id).filter(Booking.date == date).distinct().count()

    def get_booking_user_count_by_date(self, date) -> int:
        return Booking.query.with_entities(Booking.user_id).filter(Booking.date == date).distinct().count()

    def most_booked_room(self, date):
        most_booked_room_name = Booking.query \
    .with_entities(Booking.room_id, Booking.room_name, db.func.count(Booking.room_id).label('count')) \
    .filter(Booking.date == date) \
    .group_by(Booking.room_id, Booking.room_name) \
    .order_by(db.desc('count')) \
    .first()
        if most_booked_room_name:
            return (most_booked_room_name.room_name, most_booked_room_name.count)
        else:
            return ("No room", 0)
        
    def most_booked_user_name(self, date):
        most_booked_user_name = Booking.query \
    .with_entities(Booking.user_id, db.func.count(Booking.user_id).label('count')) \
    .filter(Booking.date == date) \
    .group_by(Booking.user_id) \
    .order_by(db.desc('count')) \
    .first()
        if most_booked_user_name:
            return (most_booked_user_name.user_id, most_booked_user_name.count)
        else:
            return ("_", 0)

delete_comment_model = admin_ns.model('admin Delete comment', {
    'comment_id': fields.Integer(required=True, description='The comment id', default=1),
})

@admin_ns.route('/delete-comment')
class delete_test(Resource):
    # Get the
    @admin_ns.response(200, "success")
    @admin_ns.response(400, "Bad request")
    @admin_ns.response(403, "Forbidden")
    @admin_ns.expect(delete_comment_model)
    @admin_ns.doc(description="admin delete comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def delete(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        comment_id = request.json["comment_id"]

        if not check_valid_comment(comment_id):
            return {
                "error": f"invalid comment_id {comment_id}"
            }, 400
        
        comment = Comment.query.filter_by(id=comment_id).first()

        db.session.delete(comment)
        db.session.commit()

        return {
            "message": f"admin({user_zid}) delete Comment {comment_id} successfully."
        }, 200