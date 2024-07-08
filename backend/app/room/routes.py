from datetime import datetime, timedelta
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api
from app.utils import verify_jwt, is_meeting_room
from app.booking.models import Space, RoomDetail, HotDeskDetail
from app.models import Users, CSEStaff
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import start_end_time_convert
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
from app.booking.models import Booking
import re
from apscheduler.schedulers.background import BackgroundScheduler

room_ns = Namespace('room', description='Room operations')
room_detail_model = room_ns.model('RoomDetail', {
    'name': fields.String(description='Room name'),
    'building': fields.String(description='Building name'),
    'level': fields.String(description='Building level'),
    'capacity': fields.Integer(description='Room capacity'),
})

room_model = room_ns.model('Room', {
    'room_id': fields.Integer(description='Room ID'),
    'room_type': fields.String(description='Room type'),
    'room_detail': fields.Nested(room_detail_model),
    'room_comment': fields.String(description='Room comment', allow_null=True)
})

example_response = {
    "room_id": 1,
    "room_type": "room",
    "room_detail": {
        "name": "CSE Basement",
        "building": "K17",
        "level": "LG",
        "capacity": 100
    },
    "room_comment": None
}

room_response_model = room_ns.model('RoomResponse', {
    'data': fields.Nested(room_model, example=example_response)
})

@room_ns.route('/room-detail/<int:room_id>')
class Detail(Resource):
    @room_ns.doc(description="Get certain user's booking history, need jwt token")
    @room_ns.response(200, "Success", room_response_model)
    @room_ns.response(400, "Bad request")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self, room_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        output = {
            "room_id": room_id,
            "room_type": None,
            "room_detail": None,
            "room_comment": None
        }
        if is_meeting_room(room_id):
            output["room_type"] = "room"
            detail = db.session.get(RoomDetail, room_id)
            output["room_detail"] = {
                "name": detail.name,
                "building": detail.building,
                "level": detail.level,
                "capacity": detail.capacity,
            }
        else:
            output["room_type"] = "hot_desk"
            detail = db.session.get(HotDeskDetail, room_id)
            output["room_detail"] = {
                "name": detail.name,
                "building": detail.building,
                "level": detail.level,
                "capacity": detail.capacity,
            }
        return {"message": output}, 200