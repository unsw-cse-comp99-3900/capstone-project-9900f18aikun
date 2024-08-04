"""
This file contain the model for admin
"""
from app.extensions import db


# a model contain whether admin have seen notification
class NotificationView(db.Model):
    __tablename__ = "notification_view"
    user_id = db.Column(
        db.String(128),
        db.ForeignKey('users.zid'),
        primary_key=True)
    is_viewed = db.Column(db.Boolean, nullable=False)
