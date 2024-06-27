from flask_restx import Namespace, Resource, fields
from flask import redirect, send_file, make_response,  request, Flask, jsonify, current_app, url_for
import requests
from app.extensions import db, jwt, api
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
    @auth_ns.doc(description="Redirect to Outlook login")
    def get(self):
        client_id = current_app.config['OUTLOOK_CLIENT_ID']
        redirect_uri = url_for('auth_outlook_callback', _external=True)
        auth_url = (
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
            '?response_type=code'
            f'&client_id={client_id}'
            f'&redirect_uri={redirect_uri}'
            '&response_mode=query'
            '&scope=openid%20profile%20email'
            '&state=12345'
        )
        return redirect(auth_url)

@auth_ns.route('/outlook-callback')
class OutlookCallback(Resource):
    @auth_ns.doc(description="Handle Outlook login callback")
    def get(self):
        code = request.args.get('code')
        client_id = current_app.config['OUTLOOK_CLIENT_ID']
        client_secret = current_app.config['OUTLOOK_CLIENT_SECRET']
        redirect_uri = url_for('auth_outlook_callback', _external=True)
        token_url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
        token_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri
        }
        token_headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        r = requests.post(token_url, data=token_data, headers=token_headers)
        token_response = r.json()
        access_token = token_response.get('access_token')
        if not access_token:
            return {'error': 'Invalid token response from Outlook'}, 400

        user_info = get_user_info(access_token)
        if not user_info:
            return {'error': 'Unable to fetch user info'}, 400

        user_data = db.session.get(Users, user_info['zid'])
        if not user_data:
            user_data = Users(zid=user_info['zid'], email=user_info['email'])  # Adjust fields accordingly
            db.session.add(user_data)
            db.session.commit()

        access_token = create_access_token(identity={'zid': user_data.zid})
        return {'access_token': access_token}, 200

def get_user_info(access_token):
    user_info_url = 'https://graph.microsoft.com/v1.0/me'
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    r = requests.get(user_info_url, headers=headers)
    if r.status_code == 200:
        user_info = r.json()
        return {
            'zid': user_info['id'],  # Adjust this field to match your user model
            'email': user_info['mail'] or user_info['userPrincipalName']
        }
    return None