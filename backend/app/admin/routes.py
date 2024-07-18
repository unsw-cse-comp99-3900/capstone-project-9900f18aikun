from datetime import datetime, timedelta
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert
from app.email import get_email, schedule_reminder, send_confirm_email_async, send_report_email_async
from jwt import exceptions
from app.booking.models import Booking
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
    @admin_ns.expect(report_model)
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        msg = request.json["message"]
        current_user = get_jwt_identity()
        user_zid = current_user['zid']
        to_zid = "z1"
        to_name = get_user_name(to_zid)
        send_report_email_async(user_zid, to_zid, msg)
        return {
            "reporter": f"{user_zid}",
            "message": f"{msg}",
            "to_zid": f"{to_zid}",
            "to_name": f"{to_name}"
        }, 200
