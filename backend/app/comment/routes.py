"""
This file contain the api used for comment
"""
from flask_restx import Namespace, Resource, fields
from flask import request
from app.extensions import db, api
from .models import Comment, Like, Rank
from flask_jwt_extended import  get_jwt_identity
from app.utils import check_valid_comment, check_valid_room, get_date, get_like_count, get_time, get_user_name, is_who_like_comment, verify_jwt, get_room_name, who_made_comment


comment_ns = Namespace('comment', description='Comment operations')

make_comment_model = comment_ns.model(
    'Make comment', {
        'room_id': fields.Integer(
            required=True, description='The room id', default=1), 'comment': fields.String(
                required=True, description='comment', default="WOW! Nice room!"), 'comment_to_id': fields.Integer(
                    required=True, description='If it is an original, set =0. Else get comment_to_id', default=0), })

# api used for make a comment
@comment_ns.route('/make-comment')
class make_comment(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
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
        comment_to_id = request.json["comment_to_id"]

        if not check_valid_room(room_id):
            return {
                "error": f"invalid roomid {room_id}"
            }, 400

        if comment_to_id != 0 and not check_valid_comment(comment_to_id):
            return {
                "error": f"invalid commentid {comment_to_id}"
            }, 400

        new_comment = Comment(
            room_id=room_id,
            user_id=user_zid,
            date=get_date(),
            time=get_time(),
            content=comment,
            is_edited=False,
            edit_date=get_date(),
            edit_time=get_time(),
            comment_to_id=comment_to_id
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
                        "content": comment.content,
                        "is_edited": comment.is_edited,
                        "edit_date": comment.edit_date.isoformat(),
                        "edit_time": comment.edit_time.isoformat(),
                        "comment_to_id": comment.comment_to_id
                        })
        return res


delete_comment_model = comment_ns.model(
    'Delete comment', {
        'comment_id': fields.Integer(
            required=True, description='The comment id', default=1), })


# api used for delete a comment
@comment_ns.route('/delete-comment')
class delete_test(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
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

        self.delete_comment_and_children(comment_id)

        return {
            "message": f"Comment {comment_id} deleted successfully."
        }, 200

    def delete_comment_and_children(self, comment_id):
        def delete_likes(comment_id):
            likes = Like.query.filter_by(comment_id=comment_id).all()
            for like in likes:
                db.session.delete(like)
            db.session.commit()

        def delete_children(c_id):
            children = Comment.query.filter_by(comment_to_id=c_id).all()
            for child in children:
                delete_children(child.id)
                delete_likes(child.id)
                db.session.delete(child)
            db.session.commit()

        comment = Comment.query.filter_by(id=comment_id).first()
        if comment:
            delete_children(comment_id)
            delete_likes(comment_id)
            db.session.delete(comment)
            db.session.commit()


get_comment_query = comment_ns.parser()
get_comment_query.add_argument(
    'room_id',
    type=int,
    required=True,
    help='The room id',
    default=1)


# api used for get comments
@comment_ns.route('/get-comment')
class get_comment(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(204, "No Content")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
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

        res = self.get_comment_by_roomid(room_id, user_zid)
        if res:
            return {
                "room_id": room_id,
                "current_zid": user_zid,
                "room_name": get_room_name(room_id),
                "comments": res
            }, 200
        else:
            return {
                "message": "No comment found for room {room_id}",
            }, 204

    def get_comment_by_roomid(self, room_id, user_zid):
        root_comments = Comment.query.filter_by(
            room_id=room_id, comment_to_id=0).order_by(
            Comment.edit_date.desc(), Comment.edit_time.desc()).all()
        res = []
        for comment in root_comments:
            res.append(self.build_comment_tree(comment, user_zid, level=1))
        return res

    def build_comment_tree(self, comment, user_zid, level):

        comment_dict = {
            "id": comment.id,
            "room_id": comment.room_id,
            "user_id": comment.user_id,
            "user_name": get_user_name(
                comment.user_id),
            "date": comment.date.isoformat(),
            "time": comment.time.isoformat(),
            "content": comment.content,
            "is_edited": comment.is_edited,
            "edit_date": comment.edit_date.isoformat() if comment.edit_date else None,
            "edit_time": comment.edit_time.isoformat() if comment.edit_time else None,
            "like_count": get_like_count(
                comment.id),
            "level": level,
            "current_user_liked": is_who_like_comment(
                user_zid,
                comment.id)}

        child_comments = Comment.query.filter_by(
            comment_to_id=comment.id).all()
        if child_comments:
            comment_dict['child_comment'] = [
                self.build_comment_tree(
                    child,
                    user_zid,
                    level +
                    1) for child in child_comments]  # 递归时层级加 1
        else:
            comment_dict['child_comment'] = None

        return comment_dict


edit_comment_model = comment_ns.model(
    'Edit comment', {
        'comment_id': fields.Integer(
            required=True, description='The comment id', default=1), 'comment': fields.String(
                required=True, description='comment', default="AHHHH! Great room."), })


# api used for edit comment
@comment_ns.route('/edit-comment')
class edit_comment(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
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
        comment.is_edited = True
        comment.edit_date = get_date()
        comment.edit_time = get_time()
        db.session.commit()
        return {
            "id": comment.id,
            "room_id": comment.room_id,
            "user_id": comment.user_id,
            "user_name": get_user_name(comment.user_id),
            "date": comment.date.isoformat(),
            "time": comment.time.isoformat(),
            "previous_content": previous_content,
            "content": comment.content,
            "is_edited": comment.is_edited,
            "edit_date": comment.edit_date.isoformat(),
            "edit_time": comment.edit_time.isoformat(),
            "like_count": get_like_count(comment.id),
            "comment_to_id": comment.comment_to_id
        }


like_comment_model = comment_ns.model(
    'Like comment', {
        'comment_id': fields.Integer(
            required=True, description='The comment id', default=1), })


# api used for like a comment
@comment_ns.route('/like-comment')
class like_comment(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
    @comment_ns.expect(like_comment_model)
    @comment_ns.doc(description="like comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def put(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        comment_id = request.json["comment_id"]

        if not check_valid_comment(comment_id):
            return {
                "error": f"invalid comment {comment_id}"
            }, 400

        if self.check_double_like(comment_id, user_zid):
            return {
                "error": f"user {user_zid} has already liked commentid {comment_id}"}, 400

        new_like = Like(
            comment_id=comment_id,
            who_like_id=user_zid,
            like_who_id=who_made_comment(comment_id),
            date=get_date(),
            time=get_time(),
        )

        db.session.add(new_like)
        db.session.commit()

        return {
            "message": f"successfully like comment {comment_id}",
            "like_list": self.show_like(),
            "current_zid": user_zid,
            "like_count": get_like_count(comment_id)
        }, 200

    def show_like(self):
        likes = Like.query.all()
        res = []
        for like in likes:
            res.append({"id": like.id,
                        "comment_id": like.comment_id,
                        "who_like_id": like.who_like_id,
                        "like_who_id": like.like_who_id,
                        "date": like.date.isoformat(),
                        "time": like.time.isoformat(),
                        })
        return res

    def check_double_like(self, comment_id, user_zid) -> bool:
        like = Like.query.filter_by(
            comment_id=comment_id,
            who_like_id=user_zid).first()
        return like is not None


# api used for unlike a comment
@comment_ns.route('/unlike-comment')
class unlike_comment(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(403, "Forbidden")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
    @comment_ns.expect(like_comment_model)
    @comment_ns.doc(description="unlike comment")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def put(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        comment_id = request.json["comment_id"]

        if not check_valid_comment(comment_id):
            return {
                "error": f"invalid comment {comment_id}"
            }, 400

        if not self.check_already_like(comment_id, user_zid):
            return {
                "error": f"user {user_zid} has not liked commentid {comment_id}"}, 400

        self.set_unlike(comment_id, user_zid)

        return {
            "message": f"successfully like comment {comment_id}",
            "like_count": get_like_count(comment_id)
        }, 200

    def check_already_like(self, comment_id, user_zid) -> bool:
        like = Like.query.filter_by(
            comment_id=comment_id,
            who_like_id=user_zid).first()
        return like is not None

    def set_unlike(self, comment_id, user_zid):
        like = Like.query.filter_by(
            comment_id=comment_id,
            who_like_id=user_zid).first()
        db.session.delete(like)
        db.session.commit()


make_rate_model = comment_ns.model('Make rate', {
    'room_id': fields.Integer(required=True, description='The room id', default=1),
    'rate': fields.Integer(required=True, description='room rate', default=5),
})


# api used for make a rate
@comment_ns.route('/make-rate')
class make_rate(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
    @comment_ns.expect(make_rate_model)
    @comment_ns.doc(description="make rate to room")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def put(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        room_id = request.json["room_id"]
        rate = request.json["rate"]

        check_delete_already_rate(user_zid, room_id)

        new_rank = Rank(
            room_id=room_id,
            who_rank_id=user_zid,
            rate=rate
        )

        db.session.add(new_rank)
        db.session.commit()

        new_score = get_room_score(room_id)

        return {
            "message": f"user {user_zid} successfully rate room_id {room_id}",
            "new_score": new_score
        }, 200


def check_delete_already_rate(user_zid, room_id):
    rate = Rank.query.filter_by(who_rank_id=user_zid, room_id=room_id).first()
    if rate:
        db.session.delete(rate)
        db.session.commit()


def check_already_rate(user_zid, room_id):
    rate = Rank.query.filter_by(who_rank_id=user_zid, room_id=room_id).first()
    return rate is not None


def get_room_score(room_id):
    ranks = Rank.query.filter_by(room_id=room_id).all()
    if ranks:
        total_score = sum(rank.rate for rank in ranks)
        average_score = total_score / len(ranks)
        return average_score
    else:
        return None


def get_zid_room_score(user_zid, room_id):
    rank = Rank.query.filter_by(who_rank_id=user_zid, room_id=room_id).first()
    if rank:
        return rank.rate
    else:
        return None


get_rate_query = comment_ns.parser()
get_rate_query.add_argument(
    'room_id',
    type=int,
    required=True,
    help='The room id',
    default=1)

# api used for get rate
@comment_ns.route('/get-rate')
class get_rate(Resource):
    @comment_ns.response(200, "success")
    @comment_ns.response(400, "Bad request")
    @comment_ns.response(401, "Token is expired")
    @comment_ns.response(422, "Token is invalid")
    @comment_ns.expect(get_rate_query)
    @comment_ns.doc(description="get room rate")
    @api.header('Authorization', 'Bearer <your_access_token>', required=True)
    def get(self):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        user_zid = current_user['zid']

        room_id = request.args.get('room_id')

        score = get_room_score(room_id)
        return {
            "is_rated": check_already_rate(user_zid, room_id),
            "my_rate": get_zid_room_score(user_zid, room_id),
            "room_score": score
        }, 200
