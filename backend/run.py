"""
Run backend of this project
"""
from app import create_app

if __name__ == "__main__":
    app, socketio = create_app()
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
