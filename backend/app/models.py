"""
This file contain the model about users and admin
"""
from .extensions import db
from datetime import datetime
import enum


# base model of users, child is HDR student and cse staff
class Users(db.Model):
    __tablename__ = 'users'
    zid = db.Column(db.String(128), primary_key=True, unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    user_type = db.Column(db.String(128), nullable=False)
    last_update = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


# model of HDR students
class HDRStudent(db.Model):
    __tablename__ = "HDR_students"
    zid = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False, unique=True)
    faculty_name = db.Column(db.String(256), nullable=False)
    school_name = db.Column(db.String(256), nullable=False)
    degree = db.Column(db.String(128), nullable=False)
    other_roles_within_cse = db.Column(db.String(256))
    password = db.Column(db.String(128), nullable=False)


# model of cse staff
class CSEStaff(db.Model):
    __tablename__ = "CSE_staff"
    zid = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), nullable=False, unique=True)
    faculty_name = db.Column(db.String(256), nullable=False)
    school_name = db.Column(db.String(256), nullable=False)
    title = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(128))
    password = db.Column(db.String(128), nullable=False)


class UserType(enum.Enum):
    CSEStaff = "CSE_staff"
    HDRStudent = "HDR_student"




