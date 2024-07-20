from app.extensions import db
from datetime import datetime
import json
import enum

class Comment(db.Model):
    __tablename__ = "comment"
    id = db.Column(db.Integer, primary_key=True)
    # room or hot_desk
    room_id = db.Column(db.Integer, db.ForeignKey('space.id'), nullable=False)
    user_id = db.Column(db.String(128), db.ForeignKey('users.zid'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    content = db.Column(db.String(128), nullable=False)

    # set default=False 
    is_edited = db.Column(db.Boolean, nullable=False) 
    # set default=date
    edit_date = db.Column(db.Date, nullable=False)
    # set default=time
    edit_time = db.Column(db.Time, nullable=False)

    comment_to_id = db.Column(db.Integer, nullable=False)

class Like(db.Model):
    __tablename__ = "like"
    id = db.Column(db.Integer, primary_key=True)
    # room or hot_desk
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=False)
    who_like_id = db.Column(db.String(128), db.ForeignKey('users.zid'), nullable=False)
    like_who_id = db.Column(db.String(128), db.ForeignKey('users.zid'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)