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
