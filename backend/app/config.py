"""
This file contain the config of current project
"""
from datetime import timedelta
import os


class Config:
    # db key
    SECRET_KEY = '12345678'
    # db config
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://bookadmin:qweasdzxc9@localhost/bookingsystem')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # key for generate token
    JWT_SECRET_KEY = '87654321'
    # token expire time
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=9999999)
    # config for outlook login
    OUTLOOK_CLIENT_ID = '67b39034-07bc-49f5-9104-9a1a274a36dc'
    OUTLOOK_CLIENT_SECRET = 'C9t8Q~PMtgidw7Xs~Yn3hv7OdioUBLWLuEfU-cLg'
    # gemini api key
    API_KEY = "AIzaSyCA3mK9wTCyiEWIU9aSADePL2DKFnxH1os"
