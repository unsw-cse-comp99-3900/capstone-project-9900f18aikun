from flask import Blueprint

auth = Blueprint('booking', __name__)

from . import routes
