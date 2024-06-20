from .db import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'
    zid = db.Column(db.Integer, primary_key=True)
    password = db.Column(db.String(128), nullable=False)
    last_update = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
