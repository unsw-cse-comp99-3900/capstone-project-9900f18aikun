from datetime import timedelta
import os

class Config:
    SECRET_KEY = '12345678'
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://bookadmin:qweasdzxc9@localhost/bookingsystem')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = '87654321'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=999999)
    OUTLOOK_CLIENT_ID = '67b39034-07bc-49f5-9104-9a1a274a36dc'
    OUTLOOK_CLIENT_SECRET = 'C9t8Q~PMtgidw7Xs~Yn3hv7OdioUBLWLuEfU-cLg'
