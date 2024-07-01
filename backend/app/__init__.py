from .config import Config
from .extensions import db, migrate, jwt, app, api, scheduler
from .database_setup import set_up_database
import time
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
def create_app():
    CORS(app)
    app.config.from_object(Config)

    # in docker the web a faster than db just wait for db to set up
    time.sleep(3)

    db.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)
    jwt.init_app(app)

    from .auth.routes import auth_ns
    api.add_namespace(auth_ns, path='/auth')

    from .booking.routes import booking_ns
    api.add_namespace(booking_ns, path='/booking')

    from .history.routes import history_ns
    api.add_namespace(history_ns, path='/history')

    from .room.routes import room_ns
    api.add_namespace(room_ns, path='/room')

    with app.app_context():
        db.create_all()
        set_up_database()

    scheduler.start()

    return app
