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
        return {"is_admin": whether_admin} , 200

