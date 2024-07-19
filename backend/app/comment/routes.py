from datetime import datetime, timedelta, timezone
from flask_restx import Namespace, Resource, fields
from flask import request, Flask
from app.extensions import db, api, scheduler, app
from app.models import Users, CSEStaff
from .models import Comment
from sqlalchemy.orm import joinedload
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from app.utils import check_valid_comment, check_valid_room, get_date, get_time, get_total_room, get_user_name, is_admin, is_block, is_meeting_room, is_room_available, start_end_time_convert, verify_jwt, get_room_name, is_student_permit, who_made_comment
from app.email import schedule_reminder, send_confirm_email_async
from jwt import exceptions
from sqlalchemy import and_, or_, not_
from app.config import Config
import re
from apscheduler.schedulers.background import BackgroundScheduler
import google.generativeai as genai
from datetime import datetime
import json
from sqlalchemy import func
import pytz
import random

comment_ns = Namespace('comment', description='Comment operations')

make_comment_model = comment_ns.model('Make comment', {
    'room_id': fields.Integer(required=True, description='The room id', default=1),
    'comment': fields.String(required=True, description='comment', default="WOW! Nice room!"),
})

@comment_ns.route('/make-comment')
class make_comment(Resource):
    # Get the
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.expect(make_comment_model)
    @comment_ns.doc(description="make comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        room_id = request.json["room_id"]
        comment = request.json["comment"]

        if not check_valid_room(room_id):
            return {
                "error": f"invalid roomid {room_id}"
            }, 400

        new_comment = Comment(
            room_id = room_id,
            user_id = user_zid,
            date = get_date(),
            time = get_time(),
            content = comment
        )

        db.session.add(new_comment)
        db.session.commit()
        return {
            "message": self.show_comment()
        }, 200

    def show_comment(self):
        comments = Comment.query.all()
        res = []
        for comment in comments:
            res.append({"id": comment.id,
                "room_id": comment.room_id,
                "user_id": comment.user_id,
                "user_name": get_user_name(comment.user_id),
                "date": comment.date.isoformat(),
                "time": comment.time.isoformat(),
                "content": comment.content})
        return res

delete_comment_model = comment_ns.model('Delete comment', {
    'comment_id': fields.Integer(required=True, description='The comment id', default=1),
})

@comment_ns.route('/delete-comment')
class delete_test(Resource):
    # Get the
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.expect(delete_comment_model)
    @comment_ns.doc(description="delete comment")
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
        
        if not who_made_comment(comment_id) == user_zid:
            return {
                "error": f"comment {comment_id} is not made by user {user_zid}. Permission denied."
            }, 403

        comment = Comment.query.filter_by(id=comment_id).first()

        db.session.delete(comment)
        db.session.commit()

        return {
            "message": f"Comment {comment_id} deleted successfully."
        }, 200
    
get_comment_query = comment_ns.parser()
get_comment_query.add_argument('room_id', type=int, required=True, help='The room id', default=1)

@comment_ns.route('/get-comment')
class get_comment(Resource):
    # Get the
    @comment_ns.response(200, "success")
    @comment_ns.response(204, "No Content")
    @comment_ns.response(400, "Bad request")
    @comment_ns.expect(get_comment_query)
    @comment_ns.doc(description="get comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        room_id = request.args.get('room_id')

        if not check_valid_room(room_id):
            return {
                "error": f"invalid roomid {room_id}"
            }, 400
        
        res = self.get_comment_by_roomid(room_id)
        if res:
            return {
                "room_id": room_id,
                "room_name": get_room_name(room_id),
                "comments": res
            }, 200
        else:
            return {
                "message": "No comment found for room {room_id}",
            }, 204

    def get_comment_by_roomid(self, room_id):
        comments = Comment.query.filter_by(room_id=room_id).all()
        res = []
        for comment in comments:
            res.append({"id": comment.id,
                "room_id": comment.room_id,
                "user_id": comment.user_id,
                "user_name": get_user_name(comment.user_id),
                "date": comment.date.isoformat(),
                "time": comment.time.isoformat(),
                "content": comment.content})
        return res

edit_comment_model = comment_ns.model('Edit comment', {
    'comment_id': fields.Integer(required=True, description='The comment id', default=1),
    'comment': fields.String(required=True, description='comment', default="AHHHH! Great room."),
})

@comment_ns.route('/edit-comment')
class edit_comment(Resource):
    # Get the
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.expect(edit_comment_model)
    @comment_ns.doc(description="edit comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        comment_id = request.json["comment_id"]
        comment = request.json["comment"]

        if not check_valid_comment(comment_id):
            return {
                "error": f"invalid comment {comment_id}"
            }, 400
        
        if not who_made_comment(comment_id) == user_zid:
            return {
                "error": f"comment {comment_id} is not made by user {user_zid}. Permission denied."
            }, 403
        
        return {
            "message": f"successfully edit comment {comment_id}",
            "comment": self.edit_comment(comment_id, comment)
        }, 200

    def edit_comment(self, comment_id, content):
        comment = Comment.query.filter_by(id=comment_id).first()
        previous_content = comment.content
        comment.content = content
        db.session.commit()
        return {
            "id": comment.id,
            "room_id": comment.room_id,
            "user_id": comment.user_id,
            "user_name": get_user_name(comment.user_id),
            "date": comment.date.isoformat(),
            "time": comment.time.isoformat(),
            "previous_content": previous_content,
            "content": comment.content
        }