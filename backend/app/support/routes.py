from datetime import datetime
from flask_restx import Namespace, Resource

support_ns = Namespace('support', description='Support API')

@support_ns.route('/time')
class TimeResource(Resource):
    def get(self):
        current_time = datetime.now()
        return {'datetime': current_time.isoformat()}
