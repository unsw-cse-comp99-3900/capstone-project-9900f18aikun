from datetime import timedelta
import os

class Config:
    SECRET_KEY = '12345678'
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://bookadmin:qweasdzxc9@localhost/bookingsystem')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = '87654321'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=99999999)
    OUTLOOK_CLIENT_ID = 'd469cbe5-2f16-4625-98e2-643682b4af32'
    OUTLOOK_CLIENT_SECRET = 'krL8Q~aBO3iHRKTLRBlxMTV4Kb0loiSil7QvRdpe'
