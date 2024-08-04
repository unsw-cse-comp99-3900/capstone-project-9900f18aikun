"""
This file will init this project
"""
from .config import Config
from .extensions import db, migrate, jwt, app, api, scheduler, socketio
from .database_setup import set_up_database
from .models import Users
import time
from flask_cors import CORS


def create_app():
    # Enable CORS support for the Flask app
    CORS(app)
    # add config
    app.config.from_object(Config)

    # in docker the web a faster than db just wait for db to set up
    time.sleep(3)

    # init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins='*')

    # add namespace to api
    from .auth.routes import auth_ns
    api.add_namespace(auth_ns, path='/auth')

    from .booking.routes import booking_ns
    api.add_namespace(booking_ns, path='/booking')

    from .history.routes import history_ns
    api.add_namespace(history_ns, path='/history')

    from .room.routes import room_ns
    api.add_namespace(room_ns, path='/room')

    from .sign.routes import sign_in
    api.add_namespace(sign_in, path='/sign_in')

    from .admin.routes import admin_ns
    api.add_namespace(admin_ns, path='/admin')

    from .comment.routes import comment_ns
    api.add_namespace(comment_ns, path='/comment')

    from .chat.routes import chat_ns
    api.add_namespace(chat_ns, path='/chat')

    # add socket io
    from app.chat.routes import handle_connect, handle_disconnect, handle_send_message, handle_join, handle_leave

    socketio.on_event('connect', handle_connect)
    socketio.on_event('disconnect', handle_disconnect)
    socketio.on_event('send_message', handle_send_message)
    socketio.on_event('join', handle_join)
    socketio.on_event('leave', handle_leave)

    # init db
    with app.app_context():
        db.create_all()
        if not Users.query.first():
            set_up_database()

    scheduler.start()

    return app, socketio
