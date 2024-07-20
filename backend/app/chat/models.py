from app.extensions import db
from datetime import datetime


class Chat(db.Model):
    __tablename__ = "chat"
    chat_id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.String(128), db.ForeignKey('users.zid'), nullable=False)
    is_handled = db.Column(db.Boolean, nullable=False)
    is_viewed = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_message_time = db.Column(db.DateTime, default=datetime.now)


class Message(db.Model):
    __tablename__ = "message"
    message_id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.String(128), db.ForeignKey('users.zid'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    chat_id = db.Column(db.String, db.ForeignKey('chat.chat_id'), nullable=False)




