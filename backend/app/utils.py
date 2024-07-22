from app.extensions import db
from app.booking.models import RoomDetail, Space, HotDeskDetail, Booking
from app.comment.models import Comment, Like
from app.models import CSEStaff, HDRStudent, Users
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from jwt import exceptions
from datetime import datetime, timedelta
import os
import re
from sqlalchemy import func
import pytz
# convert time HH:MM to index for every half hour


def time_convert(time):
    index = time.hour * 2 + time.minute / 30
    return index


# convert HH:HH to time index
def start_end_time_convert(start, end):
    return int(time_convert(start)), int(time_convert(end))


# check zid is HDR student or not
def is_student(zid: str) -> bool:
    user = db.session.get(Users, zid)
    user_type = user.user_type
    if user_type == "HDR_student":
        return True
    else:
        return False


# check zid is HDR student or not
def is_room_available(roomid: int) -> bool:
    space = db.session.get(Space, roomid)
    return space.is_available


# check zid is CSE staff or not
def is_staff(zid: str) -> bool:
    user = db.session.get(Users, zid)
    user_type = user.user_type
    if user_type == "CSE_staff":
        return True
    else:
        return False


def is_admin(zid: str) -> bool:
    admin = db.session.get(CSEStaff, zid)
    if admin is None:
        return False
    admin_title = admin.role
    return admin_title == "Professional"


def is_meeting_room(room_id: int) -> bool:
    space = db.session.get(Space, room_id)
    space_type = space.space_type
    if space_type == "room":
        return True
    else:
        return False

def is_block(room_id: int) -> bool:
    space = db.session.get(Space, room_id)
    return not space.is_available

def is_student_permit(room_id: int) -> bool:
    if is_meeting_room(room_id):
        meeting_room = db.session.get(RoomDetail, room_id)
        if meeting_room.HDR_student_permission:
            return True
        else:
            return False
    else:
        return True


# get usr's name
def get_user_name(zid: str) -> str:
    if is_student(zid):
        student = db.session.get(HDRStudent, zid)
        return student.name
    elif is_staff(zid):
        staff = db.session.get(CSEStaff, zid)
        return staff.name


# get room's name
def get_room_name(room_id: int) -> str:
    if is_meeting_room(room_id):
        meeting_room = db.session.get(RoomDetail, room_id)
        return meeting_room.name
    else:
        hot_desk = db.session.get(HotDeskDetail, room_id)
        return hot_desk.name


def verify_jwt():
    try:
        verify_jwt_in_request()
    except exceptions.ExpiredSignatureError:
        return {"error": "Token is invalid"}, 401
    except exceptions.DecodeError:
        return {"error": "Token decode error"}, 422
    except exceptions.InvalidTokenError:
        return {"error": "Token is invalid"}, 422
    except Exception as e:
        return {"error": str(e)}, 500
    return None


def calculate_time_difference(date, start_time_str, end_time_str):
    datetime_format = "%Y-%m-%d %H:%M:%S"
    try:
        start_datetime = datetime.strptime(f"{date} {start_time_str}", datetime_format)
        end_datetime = datetime.strptime(f"{date} {end_time_str}", datetime_format)
        return end_datetime - start_datetime
    except ValueError as e:
        return None, str(e)


def check_valid_room(roomid: int ) -> bool:
    room = Space.query.get(roomid)
    return room != None

def check_valid_comment(comment_id: int ) -> bool:
    comment = Comment.query.get(comment_id)
    return comment != None

def get_room_image(room_id: int):
    image_directory = 'app/static/images'
    file_name = f'{room_id}.jpg'
    if is_meeting_room(room_id):
        image_path = os.path.join(image_directory, file_name)
        if os.path.exists(image_path):
            return file_name
        else:
            return "no_image.jpg"
    else:
        return "hotdesk.jpg"

def is_valid_date(date: str) -> bool:
    if not re.match(r'^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$', date):
        return False
    else:
        return True

# get total number of rooms
def get_total_room() -> int:
    room_number = db.session.query(func.count(RoomDetail.id)).scalar()
    desk_number = db.session.query(func.count(HotDeskDetail.id)).scalar()
    return room_number + desk_number

def get_date():
    sydney_tz = pytz.timezone('Australia/Sydney')
    sydney_now = datetime.now(sydney_tz)
    return sydney_now.date()

def get_time():
    sydney_tz = pytz.timezone('Australia/Sydney')
    sydney_now = datetime.now(sydney_tz)
    return sydney_now.strftime('%H:%M:%S')

def who_made_comment(comment_id: int ) -> str:
    comment = Comment.query.get(comment_id)
    return comment.user_id

def get_like_count(comment_id: int ) -> int:
    return Like.query.filter_by(comment_id=comment_id).count()

def is_booking_today(date):
    booking = db.session.query(Booking).filter(Booking.date == date).first()
    if booking:
        return True
    else:
        return False
