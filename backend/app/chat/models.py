"""
This file contain the model use for chat
"""
from app.extensions import db
from datetime import datetime


# model contain the chat
class Chat(db.Model):
    __tablename__ = "chat"
    chat_id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(
        db.String(128),
        db.ForeignKey('users.zid'),
        nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_message_time = db.Column(db.DateTime, default=datetime.now)


# model contain the message in the chat
class Message(db.Model):
    __tablename__ = "message"
    message_id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(
        db.String(128),
        db.ForeignKey('users.zid'),
        nullable=False)
    message = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    chat_id = db.Column(
        db.String,
        db.ForeignKey('chat.chat_id'),
        nullable=False)


# model contain whether user viewed chat
class ChatView(db.Model):
    __tablename__ = 'chat_view'
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(
        db.String(128),
        db.ForeignKey('chat.chat_id'),
        nullable=False)
    user_id = db.Column(
        db.String(128),
        db.ForeignKey('users.zid'),
        nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
