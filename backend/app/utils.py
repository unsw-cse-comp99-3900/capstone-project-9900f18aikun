from email.mime.text import MIMEText
import smtplib
from app.extensions import db
from app.booking.models import RoomDetail
from app.models import CSEStaff, HDRStudent, Users
from threading import Thread

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

# get user's email
def get_email(zid: str) -> str:
    if is_student(zid):
        student = db.session.get(HDRStudent, zid)
        return student.email
    elif is_staff(zid):
        staff = db.session.get(CSEStaff, zid)
        return staff.email
    
# send email
def send_email(to_addr, subject, message):
    from_addr = "wangweiyi6191@outlook.com"
    smtp_server = 'smtp.office365.com'
    smtp_port = 587
    password = "wangfei20006161"

    msg = MIMEText(message)
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg['Subject'] = subject

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(from_addr, password)
        server.sendmail(from_addr, to_addr, msg.as_string())

def send_email_async(zid, subject, message):
    email = get_email(zid)
    thread = Thread(target=send_email, args=(email, subject, message))
    thread.start()

# get use's name
def get_user_name(zid: str) -> str:
    if is_student(zid):
        student = db.session.get(HDRStudent, zid)
        return student.name
    elif is_staff(zid):
        staff = db.session.get(CSEStaff, zid)
        return staff.name

# get use's name
def get_room_name(room_id: str) -> str:
    room = db.session.get(RoomDetail, room_id)
    return room.name
    