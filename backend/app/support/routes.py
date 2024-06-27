from flask import Flask, jsonify
from datetime import datetime

support_ns = Namespace('support', description='Support API')

@support_ns.route('/time')
def get_time():
    current_time = datetime.now()
    return {'datetime': current_time.isoformat()}

