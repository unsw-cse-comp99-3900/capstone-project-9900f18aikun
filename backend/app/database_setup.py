from .database import db
import pandas as pd
from .models import HDRStudent, CSEStaff, Users
import numpy as np


# Read user data from given excel
def set_up_database():
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
    student_sheet.rename(columns={'Candidate zID': 'zid',
                                  'Candidate Name': 'name',
                                  'Email ID': 'email',
                                  'Faculty Name': 'faculty_name',
                                  'School Name': 'school_name',
                                  'Degree (PhD/MRes)': 'degree',
                                  'Other roles within CSE': 'other_roles_within_cse',
                                  'Password': 'password'
                                  }, inplace=True)

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
                user_type='HDR_student',
            )
            db.session.add(users)

    db.session.commit()

    # room information update
    file_path = "data/Meeting Rooms CSE K17 and J17 L5.xlsx"
    room_detail_sheet = pd.read_excel(file_path)
    print(room_detail_sheet)

    # replace empty
    room_detail_sheet.replace({'NA': np.nan, '': np.nan}, inplace=True)




    # rename
    student_sheet.rename(columns={'No': 'id',
                                  'Building': 'building',
                                  'Room No': 'name',
                                  'Level': 'level',
                                  'Capacity': 'capacity',
                                  }, inplace=True)

