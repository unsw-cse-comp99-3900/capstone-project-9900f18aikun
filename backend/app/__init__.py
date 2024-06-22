from flask import Flask
from .config import Config
from .database import db, migrate
from .database_setup import set_up_database
from flask_jwt_extended import JWTManager
import time
from flask_restx import Api, fields

authorizations = {
    'Bearer Auth': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization'
    }
}

api = Api(authorizations=authorizations, security='Bearer Auth', version='1.0', title='My API', description='A simple API')

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # in docker the web a faster than db just wait for db to set up
    time.sleep(3)

    db.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)

    jwt = JWTManager(app)


    @app.route('/')
    def index():
        return "Welcome to the API"

    from .auth.routes import auth_ns
    api.add_namespace(auth_ns, path='/auth')

    from .booking.routes import booking_ns
    api.add_namespace(booking_ns, path='/booking')



    with app.app_context():
        db.create_all()
        set_up_database()

    return app
