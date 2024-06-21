from flask_restx import Namespace, Resource, fields
from flask import send_file, make_response,  request, Flask
from app.database import db
from app.models import User

auth_ns = Namespace('auth', description='Authentication operations')

user_model = auth_ns.model('User', {
    'zid': fields.String(required=True, description='The user zid'),
    'password': fields.String(required=True, description='The user password')
})

@auth_ns.route('/create')
class CreateUser(Resource):
    @auth_ns.expect(user_model)
    def post(self):
        data = request.json

        if not data['zid'].startswith('z') or not data['zid'][1:].isdigit():
            return {'error': 'Invalid zid'}, 400
        zid = int(data['zid'][1:])
        new_user = User(zid=zid, username=data['zid'], password=data['password'])
        db.session.add(new_user)
        db.session.commit()
        return {'message': "New user created"}


