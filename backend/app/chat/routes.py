from app.extensions import socketio
from flask import request, session
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from datetime import datetime
from app.extensions import db
from .models import Chat, Message, ChatView
from app.models import Users
from app.utils import get_user_name, is_admin, verify_jwt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import joinedload
from flask_restx import Namespace, Resource, fields


chat_ns = Namespace('chat', description='Chatting operations')


def handle_connect():
    token = request.args.get('token')
    if not token:
        print('Client connection refused: Missing token')

        return False

    try:
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']['zid']
        session['user_id'] = user_id
    except Exception as e:
        print(f'Client connection refused: {str(e)}')
        return False

    user_name = get_user_name(user_id)

    if not is_admin(user_id):
        user = db.session.get(Chat, user_id)
        output = []
        if not user:
            new_chat = Chat(
                chat_id=user_id,
                name=f'{user_id} {user_name}',
                user_id=user_id,
            )
            db.session.add(new_chat)
            db.session.commit()
        else:
            messages = Message.query.filter(
                Message.chat_id == user_id
            ).order_by(Message.timestamp.asc()).all()
            for message in messages:
                message_dict = convert_message_output(message)
                output.append(message_dict)

        join_room(user_id)
        print(f'Client connected: {user_id}')
        emit('user_chat_history', {'messages': output}, room=user_id)

    else:
        join_room(user_id)
        join_room("admin")
        message = get_chats_and_messages()
        emit('admin_chat_history', {'chat': message}, room=user_id)


def get_chats_and_messages():
    chats = Chat.query.order_by(Chat.last_message_time.desc()).all()

    output = []
    for chat in chats:
        chat_data = convert_chat_output(chat)
        messages = Message.query.filter(
            Message.chat_id == chat.chat_id
        ).order_by(Message.timestamp.desc()).all()
        for message in messages:
            message_data = convert_message_output(message)
            chat_data['messages'].append(message_data)
        output.append(chat_data)

    return output


def convert_message_output(message):
    message_data = {
        "message_id": message.message_id,
        "user_name": message.user_name,
        "user_id": message.user_id,
        "message": message.message,
        "timestamp": message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "chat_id": message.chat_id,
    }
    return message_data


def convert_chat_output(chat):
    chat_data = {
        "chat_id": chat.chat_id,
        "name": chat.name,
        "user_id": chat.user_id,
        "created_at": chat.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "last_message_time": chat.last_message_time.strftime("%Y-%m-%d %H:%M:%S"),
        "views": get_chat_views(chat.chat_id),
        "messages": []
    }
    return chat_data





def handle_disconnect():
    user_id = session.get('user_id')
    if user_id:
        leave_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f'Client disconnected: {user_id} at {leave_time}')
        leave_room(user_id)
    else:
        print('Client disconnected: Unknown user')


@socketio.on('send_message')
def handle_send_message(data):
    user_id = session.get('user_id')
    user_name = get_user_name(user_id)

    if not user_id:
        emit('message', {'msg': 'Unauthorized'}, room=request.sid)
        return

    msg = data.get('msg')
    print(f"send_message {msg}")
    if msg:
        message = Message(
            user_name=user_name,
            user_id=user_id,
            message=msg,
            chat_id=user_id
        )
        db.session.add(message)
        db.session.commit()

        chat = Chat.query.filter_by(chat_id=user_id).first()
        if chat:
            chat.last_message_time = datetime.utcnow()
            db.session.commit()
        # reset view, chat id is same to user id.
        reset_chat_views(user_id, user_id)
        message = convert_message_output(message)
        emit('message', {'message': message}, room=user_id)
        emit('message', {'message': message}, room="admin")
        print(f'Message from {user_id}: {msg}')


@socketio.on('reply_message')
def handle_reply_message(data):
    admin_id = session.get('user_id')
    admin_name = get_user_name(admin_id)

    if not admin_id:
        emit('message', {'msg': 'Unauthorized'}, room=request.sid)
        return

    msg = data.get('msg')
    user_id = data.get('user_id')
    print(f"send_message {msg}")
    if msg:
        message = Message(
            user_name=admin_name,
            user_id=admin_id,
            message=msg,
            chat_id=user_id
        )
        db.session.add(message)
        db.session.commit()

        chat = Chat.query.filter_by(chat_id=user_id).first()
        if chat:
            chat.last_message_time = datetime.utcnow()
            db.session.commit()

        message = convert_message_output(message)
        # reset view, chat id is same to user id.
        reset_chat_views(user_id, admin_id)
        print(f'user is {user_id}')
        emit('message', {'message': message}, room=user_id)
        emit('message', {'message': message}, room="admin")
        print(f'Message from {admin_id}: {msg}')


@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    user_id = session.get('user_id')
    if room and user_id:
        join_room(room)
        emit('message', {'msg': f'{user_id} has joined the room {room}'}, room=room)
        print(f'{user_id} joined room: {room}')


@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    user_id = session.get('user_id')
    if room and user_id:
        leave_room(room)
        emit('message', {'msg': f'{user_id} has left the room {room}'}, room=room)
        print(f'{user_id} left room: {room}')


@chat_ns.route('/view/<string:chat_id>')
class View(Resource):
    # Book a room
    @chat_ns.response(200, "success")
    @chat_ns.response(400, "Bad request")
    @chat_ns.doc(description="Book a space")
    @chat_ns.header('Authorization', 'Bearer <your_access_token>', required=True)
    def post(self, chat_id):
        jwt_error = verify_jwt()
        if jwt_error:
            return jwt_error
        current_user = get_jwt_identity()
        zid = current_user['zid']
        exists = db.session.query(Chat.chat_id).filter_by(chat_id=chat_id).first()
        if not exists:
            return {'error': 'Chat ID does not exist.'}, 400
        existing_view = ChatView.query.filter_by(user_id=zid, chat_id=chat_id).first()

        if existing_view:
            return {'message': 'Chat already viewed.'}, 200
        else:
            new_view = ChatView(user_id=zid, chat_id=chat_id)
            db.session.add(new_view)
            db.session.commit()
            return {'message': 'Chat view recorded.'}, 201


def get_chat_views(chat_id):
    views = ChatView.query.filter_by(chat_id=chat_id).all()
    views = [view.user_id for view in views]
    return views


def reset_chat_views(chat_id, user_id):
    views = ChatView.query.filter_by(chat_id=chat_id).all()
    for view in views:
        db.session.delete(view)
    new_view = ChatView(user_id=user_id, chat_id=chat_id)
    db.session.add(new_view)
    db.session.commit()


