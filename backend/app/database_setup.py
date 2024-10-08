"""
This file is used for setup database from given excel data
"""
from .extensions import db
import pandas as pd
from .models import HDRStudent, CSEStaff, Users
from app.booking.models import RoomDetail, Space, HotDeskDetail
import numpy as np


def set_up_HDRstudent_db():
    # pre process data
    file_path = "data/CSE Active HDR candidates staff details 210624.xlsx"
    student_sheet = pd.read_excel(file_path, sheet_name='HDR students')
    staff_sheet = pd.read_excel(file_path, sheet_name='CSE staff')

    # replace NA letter and empty to np.nan
    student_sheet.replace({'NA': np.nan, '': np.nan}, inplace=True)
    staff_sheet.replace({'NA': np.nan, '': np.nan}, inplace=True)

    # drop useless column
    student_sheet = student_sheet.drop('No', axis=1)
    student_sheet = student_sheet.drop('Test', axis=1)
    staff_sheet = staff_sheet.drop('No', axis=1)
    staff_sheet = staff_sheet.drop('Test', axis=1)

    # rename columns
    student_sheet.rename(
        columns={
            'Candidate zID': 'zid',
            'Candidate Name': 'name',
            'Email ID': 'email',
            'Faculty Name': 'faculty_name',
            'School Name': 'school_name',
            'Degree (PhD/MRes)': 'degree',
            'Other roles within CSE': 'other_roles_within_cse',
            'Password': 'password'},
        inplace=True)

    staff_sheet.rename(columns={'Staff z ID': 'zid',
                                'Staff Name': 'name',
                                'Email ID': 'email',
                                'Faculty Name': 'faculty_name',
                                'School Name': 'school_name',
                                'Title': 'title',
                                'Role': 'role',
                                'Password': 'password'
                                }, inplace=True)

    # update data to users table and HDRStudent table
    for index, row in student_sheet.iterrows():
        # skip the exist users
        if not db.session.get(HDRStudent, row['zid']):
            student = HDRStudent(
                zid=row['zid'],
                name=row['name'],
                email=row['email'],
                faculty_name=row['faculty_name'],
                school_name=row['school_name'],
                degree=row['degree'],
                other_roles_within_cse=row.get('other_roles_within_cse', None),
                password=row['password']
            )
            db.session.add(student)
        if not db.session.get(Users, row['zid']):
            users = Users(
                zid=row['zid'],
                password=row['password'],
                user_type='HDR_student',
            )
            db.session.add(users)
    # update data to staff table and users table
    for index, row in staff_sheet.iterrows():
        if not db.session.get(CSEStaff, row['zid']):
            staff = CSEStaff(
                zid=row['zid'],
                name=row['name'],
                email=row['email'],
                faculty_name=row['faculty_name'],
                school_name=row['school_name'],
                title=row['title'],
                role=row.get('role', None),
                password=row['password']
            )

            db.session.add(staff)
        if not db.session.get(Users, row['zid']):
            users = Users(
                zid=row['zid'],
                password=row['password'],
                user_type='CSE_staff',
            )
            db.session.add(users)

    db.session.commit()


def set_up_space_db():
    # room information update, excel start from line 3
    meeting_room_path = "data/Meeting Rooms CSE K17 and J17 L5.xlsx"
    room_detail_sheet = pd.read_excel(meeting_room_path, header=2)

    # get the accessibility
    room_detail_sheet['HDR_student_permission'] = room_detail_sheet['Who can use it?'].str.contains(
        r'HDR students', case=False)
    room_detail_sheet['CSE_staff_permission'] = room_detail_sheet['Who can use it?'].str.contains(
        r'CSE staff', case=False)
    room_detail_sheet = room_detail_sheet.drop('Who can use it?', axis=1)

    # rename
    room_detail_sheet.rename(columns={'No': 'id',
                                      'Building': 'building',
                                      'Room No': 'name',
                                      'Level': 'level',
                                      'Capacity': 'capacity',
                                      }, inplace=True)

    # update data to db
    for index, row in room_detail_sheet.iterrows():
        exists = db.session.query(
            db.exists().where(
                RoomDetail.building == row['building'],
                RoomDetail.name == str(row['name'])
            )
        ).scalar()

        if exists:
            continue

        space = Space(
            space_type='room',
            is_available=True
        )
        db.session.add(space)
        db.session.commit()

        room_detail = RoomDetail(
            id=space.id,
            building=row['building'],
            name=row['name'],
            level=row['level'],
            capacity=row['capacity'],
            HDR_student_permission=row['HDR_student_permission'],
            CSE_staff_permission=row['CSE_staff_permission']
        )
        db.session.add(room_detail)
    db.session.commit()

    hot_desk_path = "data/hot_desk_data.xlsx"
    hot_desk_sheet = pd.read_excel(hot_desk_path)

    for index, row in hot_desk_sheet.iterrows():
        exists = db.session.query(
            db.exists().where(
                HotDeskDetail.building == row['building'],
                HotDeskDetail.number == int(row['number']),
                HotDeskDetail.room == str(row['room'])
            )
        ).scalar()

        if exists:
            continue

        space = Space(
            space_type='hot_desk',
            is_available=True
        )
        db.session.add(space)
        db.session.commit()

        if not exists:
            hot_desk_detail = HotDeskDetail(
                id=space.id,
                building=row['building'],
                room=row['room'],
                level=row['level'],
                number=row['number'],
                name=f'Room {row["room"]} table {row["number"]}',
                capacity=1,
                HDR_student_permission=True,
                CSE_staff_permission=True,
            )
            db.session.add(hot_desk_detail)
    db.session.commit()


# Read user data from given excel
def set_up_database():
    set_up_HDRstudent_db()
    set_up_space_db()
