from flask import Blueprint

support = Blueprint('support', __name__)

from . import routes
