from flask import Flask
from .config import Config
from .database import db, migrate
from flask_restx import Api
from .database_setup import set_up_database

api = Api()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)


    @app.route('/')
    def index():
        return "Welcome to the API"

    from .auth.routes import auth_ns
    api.add_namespace(auth_ns, path='/auth')

    with app.app_context():
        db.create_all()
        set_up_database()

    return app
