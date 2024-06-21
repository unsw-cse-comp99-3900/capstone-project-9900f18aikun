from datetime import timedelta


class Config:
    SECRET_KEY = '12345678'
    SQLALCHEMY_DATABASE_URI = 'postgresql://bookadmin:qweasdzxc9@localhost/bookingsystem'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = '87654321'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
