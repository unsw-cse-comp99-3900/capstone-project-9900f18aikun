from flask_restx import Namespace, Resource, fields
from flask import redirect, send_file, make_response,  request, Flask, jsonify, current_app, url_for
import requests
from app.extensions import db, jwt, microsoft
from app.models import Users
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request



auth_ns = Namespace('auth', description='Authentication operations')

user_model = auth_ns.model('User', {
    'zid': fields.String(required=True, description='The user zid'),
    'password': fields.String(required=True, description='The user password')
})


@jwt.invalid_token_loader
def custom_invalid_token_callback(error_string):
    return jsonify({
        'error': 'Invalid Token',
        'message': error_string
    }), 401


@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.response(200, "success")
    @auth_ns.response(400, "Bad request")
    @auth_ns.doc(description="Login in by zid and password")
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


@auth_ns.route('/auto-login')
class AutoLogin(Resource):
    @auth_ns.doc(security='Bearer Auth')
    @auth_ns.response(200, "Success")
    @auth_ns.response(400, "Bad Request")
    @auth_ns.response(404, "Not Found")
    @auth_ns.doc(description="Auto login by token")
    @jwt_required()
    def get(self):
        try:
            verify_jwt_in_request()
            current_user = get_jwt_identity()
            user_data = db.session.get(Users, current_user['zid'])
            if user_data:
                return {'zid': user_data.zid, 'message': 'User verified'}, 200
            else:
                return {'message': 'User not found'}, 404
        except Exception as e:
            return {'error': str(e)}, 401
        
@auth_ns.route('/outlook-login')
class OutlookLogin(Resource):
    def get(self):
        redirect_uri = url_for('auth_outlook_login_callback', _external=True)
        return microsoft.authorize_redirect(redirect_uri)

@auth_ns.route('/outlook-login/callback')
class OutlookLoginCallback(Resource):
    def get(self):
        token = microsoft.authorize_access_token()
        resp = microsoft.get('https://graph.microsoft.com/v1.0/me')
        user_info = resp.json()
        # {"info": {"@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users/$entity", "userPrincipalName": "wangweiyi6191@outlook.com", "id": "fc04e2dba170b844", "displayName": "Escalade Wang", "surname": "Wang", "givenName": "Escalade", "preferredLanguage": "zh-CN", "mail": "wangweiyi6191@outlook.com", "mobilePhone": null, "jobTitle": null, "officeLocation": null, "businessPhones": []}}
        return redirect('http://localhost:5001')