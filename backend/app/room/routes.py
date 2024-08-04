"""
This file contain the api about room
"""
from flask_restx import Namespace, Resource
from app.extensions import db, api
from app.utils import verify_jwt, is_meeting_room, get_room_image
from app.booking.models import RoomDetail, HotDeskDetail
from flask import url_for

room_ns = Namespace('room', description='Room operations')

# get the room detail of certain room
@room_ns.route('/room-detail/<int:room_id>')
class Detail(Resource):
    @room_ns.doc(description="Get certain user's booking history, need jwt token")
    @room_ns.response(200, "Success")
    @room_ns.response(400, "Bad request")
    @room_ns.response(401, "Token is expired")
    @room_ns.response(422, "Token is invalid")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self, room_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        image_path = get_room_image(room_id)
        image_url = url_for('static', filename='images/' + image_path, _external=True)

        output = {
            "room_id": room_id,
            "room_type": None,
            "room_detail": None,
            "room_comment": None,
        }
        if is_meeting_room(room_id):
            output["room_type"] = "room"
            detail = db.session.get(RoomDetail, room_id)
            output["room_detail"] = {
                "name": detail.name,
                "building": detail.building,
                "level": detail.level,
                "capacity": detail.capacity,
                "image_url": image_url
            }
        else:
            output["room_type"] = "hot_desk"
            detail = db.session.get(HotDeskDetail, room_id)
            output["room_detail"] = {
                "name": detail.name,
                "building": detail.building,
                "level": detail.level,
                "capacity": detail.capacity,
                "image_url": image_url
            }
        return {"message": output}, 200




