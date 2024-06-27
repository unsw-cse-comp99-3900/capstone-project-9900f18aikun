from datetime import datetime, timedelta
from email.mime.text import MIMEText
import smtplib
from app.extensions import db, scheduler
from app.models import CSEStaff, HDRStudent, Users
from threading import Thread
from app.utils import get_room_name, get_user_name, is_staff, is_student

# get user's email
def get_email(zid: str) -> str:
    if is_student(zid):
        student = db.session.get(HDRStudent, zid)
        return student.email
    elif is_staff(zid):
        staff = db.session.get(CSEStaff, zid)
        return staff.email
    
# send email
def send_confirm_email(user_name, room_name, date, start_time, end_time, to_addr):
    subject = "Confirmation of K17 Room Booking"
    message = f"""
    Hi {user_name},

    I am writing to confirm your booking at our system. Details of the booking are as follows:

    - Room: {room_name}
    - Date: {date}
    - Time: {start_time} -- {end_time}

    Please contact us if you need to make any changes or have any questions.

    Best regards,

    K17 Room Booking System
    """
    
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

# send email 
def send_confirm_email_async(zid, room_id, date, start_time, end_time):
    user_name = get_user_name(zid)
    room_name = get_room_name(room_id)
    to_addr = get_email(zid)
    thread1 = Thread(target=send_confirm_email, args=(user_name, room_name, date, start_time, end_time, to_addr))
    thread1.start()

# send email
def send_reminder_email(user_name, room_name, date, start_time, end_time, to_addr):
    subject = "Reminder of K17 Room Booking"
    message = f"""
    Hi {user_name},

    I am writing to remind your booking at our system. Details of the booking are as follows:

    - Room: {room_name}
    - Date: {date}
    - Time: {start_time} -- {end_time}

    It will start in 1h.

    Please contact us if you need to make any changes or have any questions.

    Best regards,

    K17 Room Booking System
    """
    
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

# reminder email booking     
def schedule_reminder(zid, room_id, start_time, date, end_time):
    dt_start_time = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
    reminder_time = dt_start_time - timedelta(hours=1)
    to_addr = get_email(zid)
    user_name = get_user_name(zid)
    room_name = get_room_name(room_id)
    scheduler.add_job(send_reminder_email, 'date', run_date=reminder_time, args=[user_name, room_name, date, start_time, end_time, to_addr])
