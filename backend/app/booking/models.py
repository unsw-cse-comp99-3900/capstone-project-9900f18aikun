"""
This file contain models relate to booking
"""
from app.extensions import db
from datetime import datetime
import json
import enum


def default_time_slots():
    return json.dumps({str(i): {} for i in range(48)})


# This model is a base table, child is room detail and hot desk detail
class Space(db.Model):
    __tablename__ = "space"
    id = db.Column(db.Integer, primary_key=True)
    # room or hot_desk
    space_type = db.Column(db.String(128), nullable=False)
    is_available = db.Column(db.Boolean, nullable=False)


# this table contain the detail of meeting room
class RoomDetail(db.Model):
    __tablename__ = "room_detail"
    id = db.Column(
        db.Integer,
        db.ForeignKey('space.id'),
        primary_key=True,
        unique=True,
        nullable=False)
    building = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    level = db.Column(db.String(128), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    HDR_student_permission = db.Column(db.Boolean, nullable=False)
    CSE_staff_permission = db.Column(db.Boolean, nullable=False)


# this table contain the detail of hot desk
class HotDeskDetail(db.Model):
    __tablename__ = "hot_desk_detail"
    id = db.Column(
        db.Integer,
        db.ForeignKey('space.id'),
        primary_key=True,
        unique=True,
        nullable=False)
    building = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    level = db.Column(db.String(128), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    room = db.Column(db.String(128), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    HDR_student_permission = db.Column(db.Boolean, nullable=False)
    CSE_staff_permission = db.Column(db.Boolean, nullable=False)


# this table contain the detail of every book
class Booking(db.Model):
    __tablename__ = "booking"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('space.id'), nullable=False)
    room_name = db.Column(db.String(128), nullable=False)
    user_id = db.Column(
        db.String(128),
        db.ForeignKey('users.zid'),
        nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    booking_status = db.Column(db.String(128), nullable=False)
    is_request = db.Column(db.Boolean, nullable=False)


# enumerate of space type
class SpaceType(enum.Enum):
    meeting_room = "room"
    hot_desk = "hot_desk"


# enumerate of booking status
class BookingStatus(enum.Enum):
    requested = "requested"
    booked = "booked"
    cancelled = "cancelled"
    signed_in = "signed-in"
    absent = "absent"
    completed = "completed"
