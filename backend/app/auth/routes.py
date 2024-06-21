from flask_restx import Namespace, Resource, fields
from flask import send_file, make_response,  request, Flask, jsonify, current_app
from app.database import db
from app.models import Users
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity


auth_ns = Namespace('auth', description='Authentication operations')

user_model = auth_ns.model('User', {
    'zid': fields.String(required=True, description='The user zid'),
    'password': fields.String(required=True, description='The user password')
})


@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.expect(user_model)
    def post(self):
        data = request.json

        if not data['zid'].startswith('z') or not data['zid'][1:].isdigit():
            return {'error': 'Invalid zid or password'}, 400
        zid = data['zid']
        password = data['password']
        user_data = db.session.get(Users, zid)
        if not user_data or user_data.password != password:
            return {'error': 'Invalid zid or password'}, 400

        access_token = create_access_token(identity={'zid': user_data.zid})
        return {'access_token': access_token}, 200



