from datetime import timezone
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask import Flask
from flask_restx import Api, fields
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone
from authlib.integrations.flask_client import OAuth
from app.config import Config
from flask_socketio import SocketIO

authorizations = {
    'Bearer Auth': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization'
    }
}


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
app = Flask(__name__, static_folder='static', static_url_path='/static')
socketio = SocketIO()
api = Api(authorizations=authorizations, security='Bearer Auth', version='1.0', title='UNSW CSE booking system',
          description='An api helping you book space in j17 and k17')

sydney_tz = timezone('Australia/Sydney')
scheduler = BackgroundScheduler(timezone=sydney_tz)
app.secret_key = 'random'
oauth = OAuth(app)
microsoft = oauth.register(
    name='microsoft',
    client_id=Config.OUTLOOK_CLIENT_ID,
    client_secret=Config.OUTLOOK_CLIENT_SECRET,
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    authorize_params=None,
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    access_token_params=None,
    refresh_token_url=None,
    redirect_uri='http://localhost:5001/auth/outlook-login/callback',
    client_kwargs={'scope': 'User.Read'},
)


