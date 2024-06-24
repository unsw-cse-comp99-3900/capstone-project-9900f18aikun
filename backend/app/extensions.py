from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask import Flask
from flask_restx import Api, fields




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
app = Flask(__name__)
api = Api(authorizations=authorizations, security='Bearer Auth', version='1.0', title='UNSW CSE booking system',
          description='An api helping you book space in j17 and k17')


