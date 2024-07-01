from app.extensions import db
from app.booking.models import RoomDetail, Space, HotDeskDetail
from app.models import CSEStaff, HDRStudent, Users
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from jwt import exceptions
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

# check zid is CSE staff or not
def is_staff(zid: str) -> bool:
    user = db.session.get(Users, zid)
    user_type = user.user_type
    if user_type == "CSE staff":
        return True
    else:
        return False

def is_meeting_room(room_id: int) -> bool:
    space = db.session.get(Space, room_id)
    space_type = space.space_type
    if space_type == "room":
        return True
    else:
        return False


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



