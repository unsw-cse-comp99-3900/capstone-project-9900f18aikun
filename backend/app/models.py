from .database import db
from datetime import datetime


class Users(db.Model):
    __tablename__ = 'users'
    zid = db.Column(db.String(128), primary_key=True, unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    user_type = db.Column(db.String(128), nullable=False)
    last_update = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class HDRStudent(db.Model):
    __tablename__ = "HDR_students"
    zid = db.Column(db.String(128), primary_key=True, unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False, unique=True)
    faculty_name = db.Column(db.String(256), nullable=False)
    school_name = db.Column(db.String(256), nullable=False)
    degree = db.Column(db.String(128), nullable=False)
    other_roles_within_cse = db.Column(db.String(256))
    password = db.Column(db.String(128), nullable=False)


class CSEStaff(db.Model):
    __tablename__ = "CSE_staff"
    zid = db.Column(db.String(128), primary_key=True, unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False, unique=True)
    faculty_name = db.Column(db.String(256), nullable=False)
    school_name = db.Column(db.String(256), nullable=False)
    title = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(128))
    password = db.Column(db.String(128), nullable=False)


class RoomDetail(db.Model):
    __tablename__ = "RoomDetail"
    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)
    building = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    level = db.Column(db.String(128), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    HDR_student_permission = db.Column(db.Boolean, nullable=False)
    CSE_staff_permission = db.Column(db.Boolean, nullable=False)


