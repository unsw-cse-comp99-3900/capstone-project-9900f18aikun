#! /usr/bin/env python3
# -*- coding: utf-8 -*-

"""
COMP9321 24T1 Assignment 2
Data publication as a RESTful service API

Getting Started
---------------

1. You MUST rename this file according to your zID, e.g., z1234567.py.

2. To ensure your submission can be marked correctly, you're strongly encouraged
   to create a new virtual environment for this assignment.  Please see the
   instructions in the assignment 1 specification to create and activate a
   virtual environment.

3. Once you have activated your virtual environment, you need to install the
   following, required packages:

   pip install python-dotenv==1.0.1
   pip install google-generativeai==0.4.1

   You may also use any of the packages we've used in the weekly labs.
   The most likely ones you'll want to install are:

   pip install flask==3.0.2
   pip install flask_restx==1.3.0
   pip install requests==2.31.0

4. Create a file called `.env` in the same directory as this file.  This file
   will contain the Google API key you generatea in the next step.

5. Go to the following page, click on the link to "Get an API key", and follow
   the instructions to generate an API key:

   https://ai.google.dev/tutorials/python_quickstart

6. Add the following line to your `.env` file, replacing `your-api-key` with
   the API key you generated, and save the file:

   GOOGLE_API_KEY=your-api-key

7. You can now start implementing your solution. You are free to edit this file how you like, but keep it readable
   such that a marker can read and understand your code if necessary for partial marks.

Submission
----------

You need to submit this Python file and a `requirements.txt` file.

The `requirements.txt` file should list all the Python packages your code relies
on, and their versions.  You can generate this file by running the following
command while your virtual environment is active:

pip freeze > requirements.txt

You can submit the two files using the following command when connected to CSE,
and assuming the files are in the current directory (remember to replace `zid`
with your actual zID, i.e. the name of this file after renaming it):

give cs9321 assign2 zid.py requirements.txt

You can also submit through WebCMS3, using the tab at the top of the assignment
page.

"""

# You can import more modules from the standard library here if you need them
# (which you will, e.g. sqlite3).
import sqlite3
import os
import requests
from pathlib import Path
from flask import Flask, request
from flask_restx import Api, Resource, reqparse, fields
from datetime import datetime
from requests.exceptions import RequestException

# You can import more third-party packages here if you need them, provided
# that they've been used in the weekly labs, or specified in this assignment,
# and their versions match.
from dotenv import load_dotenv          # Needed to load the environment variables from the .env file
import google.generativeai as genai     # Needed to access the Generative AI API


studentid = Path(__file__).stem         # Will capture your zID from the filename.
db_file   = f"{studentid}.db"           # Use this variable when referencing the SQLite database file.
txt_file  = f"{studentid}.txt"          # Use this variable when referencing the txt file for Q7.


# Load the environment variables from the .env file
load_dotenv()

# Configure the API key
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Create a Gemini Pro model
gemini = genai.GenerativeModel('gemini-pro')




app = Flask(__name__)
api = Api(app, 
         title='Deutsche Bahn API',
         version='1.0',
         description='the national railway company of Germany to enhance the experience of passengers',)


#  -------------Q1----------------

parser = reqparse.RequestParser()
parser.add_argument('query', type=str, required=True, help='Stop name you want to search.')

update_model = api.model('Update_Stop', {
    'name': fields.String(description='The name of the stop', default="Morty's House"),
    'next_departure': fields.String(description='The next departure of the stop', default="Platform 4 A-C towards Sollstedt"),
    'latitude': fields.Float(description='Latitude of the stop', default=-33.918859),
    'longitude': fields.Float(description='Longitude of the stop', default=151.321034),
    'last_updated': fields.String(description='The last updated time of the stop(YYYY-MM-DD-HH:MM:SS)', default="2024-03-26-15:22:20")
})

@api.route('/stops')
class Stops(Resource):
   @api.expect(parser)
   @api.doc(description="GET the stops from extern API and update the database")
   @api.response(200, 'Successful Updated')
   @api.response(201, 'Successful Updated and Found New Stop')
   @api.response(400, 'Unexpected Parameters')
   @api.response(404, 'Do Not found Any Stops')
   @api.response(503, 'Can Not access to External API')
   def put(self):
      args = parser.parse_args()
      search_query = args['query']
      
      if not search_query.strip():
         return {}, 400
      try:
      # get the data from extern api
         response = requests.get('https://v6.db.transport.rest/locations', params={'query': search_query, 'results': 5})
      except RequestException as e:
          return {}, 503
      host_number = request.host.split(':')[0]
      port_number = request.host.split(':')[1]
      # successful
      if response.status_code == 200:
         return_status_code = 200
         res = []
         nums = response.json()
         # do not have data
         if not nums:
            return {}, 404
         for num in nums:
            # check whether it is a stop(maybe it is a station)
            cur_stopid = int(num.get('id'))
            cur_name = num.get('name')
            cur_type = num.get('type')
            cur_latitude = num.get('location').get('latitude')
            cur_longitude = num.get('location').get('longitude')
            if cur_type != 'stop':
               continue
            current_time = datetime.now().strftime('%Y-%m-%d-%H:%M:%S')
            curstop = StopInfo(cur_stopid, current_time, cur_name, cur_latitude, cur_longitude)
            found = db.insertOrUpdate(curstop)
            # found insert data into database
            if return_status_code == 200 and not found:
               return_status_code = 201
            cur = {
               'stop_id': cur_stopid,
               'last_updated': current_time,
               '_links': {
                  'self':{
                     'href': f'http://{host_number}:{port_number}/stops/{cur_stopid}'
                  }
               }
            }
            
            res.append(cur)
      # ascending sort 
      res.sort(key=lambda x: x['stop_id'])
      return res, return_status_code

#  -------------Q2----------------
@api.route('/stops/<int:stop_id>')
@api.param('stop_id', 'The stop identifier')
class Stop(Resource):
   @api.doc(description="retrieve information about a stop")
   @api.param('include', 'The query parameter(last_updated,name,latitude,longitude,next_departure)')
   @api.response(200, 'Success Get Info')
   @api.response(400, 'Unexpected Parameters')
   @api.response(404, 'Do Not found Stop')
   @api.response(503, 'Can Not access to External API')
   def get(self, stop_id):
      
      valid_includes = ['last_updated', 'name', 'latitude', 'longitude', 'next_departure']
      parser = reqparse.RequestParser()
      parser.add_argument('include', type=str, required=False, help="Optional fields to include in response")

      args = parser.parse_args()
      include_fields = args.get('include')

      include_fields_str = args.get('include')
      if include_fields_str:
         include_fields = include_fields_str.split(',')
         # check valid 
         invalid_fields = set(include_fields) - set(valid_includes)
         if invalid_fields:
            # found invalid 
            return {}, 400
      
      # do not pass parameter means get all attribute
      if not include_fields:
         include_fields = valid_includes
      
      # stop not in db 
      found = db.check_in_db(stop_id)
      if not found:
         return {}, 404
      
      try:
      # get the data from extern API
         response = requests.get(
            f'https://v6.db.transport.rest/stops/{stop_id}/departures',
            params={'duration': 120})
      except RequestException as e:
         # can not get access to external API 
         return {}, 503
      
      host_number = request.host.split(':')[0]
      port_number = request.host.split(':')[1]
      # successful
      if response.status_code == 200:
         for num in response.json().get('departures'):
            platform = num.get('platform')
            direction = num.get('direction')
            if not platform or not direction:
               continue
            # get the first departure 
            next_departure = f"Platform {platform} towards {direction}"
            prev = db.get_prev(stop_id)
            next = db.get_next(stop_id)
            res = {}
            res['stop_id'] = stop_id
            info = db.get_info(stop_id)
            if 'last_updated' in include_fields:
               res['last_updated'] = info[1]
            if 'name' in include_fields:
               res['name'] = info[2]
            if 'latitude' in include_fields:
               res['latitude'] = info[3]
            if 'longitude' in include_fields:
               res['longitude'] = info[4]
            if 'next_departure' in include_fields:
               res['next_departure'] = next_departure
            links = {}
            links['self'] = {
               'href': f'http://{host_number}:{port_number}/stops/{stop_id}'
            }
            if prev:
               links['prev'] = {
                  'href': f'http://{host_number}:{port_number}/stops/{prev}'
               }
            if next:
               links['next'] = {
                  'href': f'http://{host_number}:{port_number}/stops/{next}'
               }
            res['_links'] = links
            return res, 200
         
      # Do not found next departure       
      return {}, 404 
   

   #  -------------Q4----------------
   @api.doc(description="delete a stop")
   @api.response(200, 'Success Delete')
   @api.response(400, 'Unexpected Parameters')
   @api.response(404, 'Do Not found Stop')
   def delete(self, stop_id):
      # stop not in db 
      found = db.check_in_db(stop_id)
      if not found:
         res = {
            'message': f'The stop_id {stop_id} was not found in the database.',
            'stop_id': stop_id
         }
         return res, 404
      db.delete(stop_id)
      res = {
         'message': f'The stop_id {stop_id} was removed from the database.',
         'stop_id': stop_id
      }
      return res, 200 
   
   #  -------------Q5----------------
   
   @api.doc(description="update information about a stop")
   @api.expect(update_model)
   @api.response(200, 'Success update Info')
   @api.response(400, 'Unexpected Parameters')
   @api.response(404, 'Do Not found Stop')
   def put(self, stop_id):
      if not db.check_in_db(stop_id):
         return {}, 404

      expected_fields = {'name', 'next_departure', 'latitude', 'longitude', 'last_updated'}
      # request is not in json fmt

      if not request.is_json:
         return {}, 400

      request_json = request.json
      # empty fields
      if not request_json:
         return {}, 400
      # invalid keys
      if not all(key in expected_fields for key in request_json.keys()):
         return {}, 400
      # name is not blank string 
      if 'name' in request_json and not request_json['name']:
         return {}, 400
      # next_departure is not blank string 
      if 'next_departure' in request_json and not request_json['next_departure']:
         return {}, 400
      # latitude is a number 
      if 'latitude' in request_json and not isinstance(request_json['latitude'], (int, float)):
         return {}, 400
      # longitude is a number 
      if 'longitude' in request_json and not isinstance(request_json['longitude'], (int, float)):
         return {}, 400
      # last_updated should in fmt yyyy-mm-dd-hh:mm:ss
      if 'last_updated' in request_json:
            try:
                datetime.strptime(request_json['last_updated'], '%Y-%m-%d-%H:%M:%S')
            except ValueError:
                return {}, 400
      # get info from db 
      info = db.get_info(stop_id)
      _, last_updated, name, latitude, longitude = info
      # set the values 
      if 'last_updated' in request_json:
         last_updated = request_json['last_updated']
      else:
         last_updated = datetime.now().strftime('%Y-%m-%d-%H:%M:%S')
      if 'name' in request_json:
         name = request_json['name']
      if 'latitude' in request_json:
         latitude = float(request_json['latitude'])
      if 'longitude' in request_json:
         longitude = float(request_json['longitude'])
      # update the values 
      curstop = StopInfo(stop_id, last_updated, name, latitude, longitude)
      db.insertOrUpdate(curstop)
      host_number = request.host.split(':')[0]
      port_number = request.host.split(':')[1]
      res = {
         'stop_id': stop_id,
         'last_updated': last_updated,
         '_links':{
            'self': {
               'href': f'http://{host_number}:{port_number}/stops/{stop_id}'
            }
         }
      }
      return res, 200
   
#  -------------Q6----------------
      
@api.route('/operator-profiles/<int:stop_id>')
class Stops(Resource):
   @api.doc(description="return a profile for each operator \
            who is operating a service departing from a desired stop within 90 minutes.")
   @api.response(200, 'Successful return')
   @api.response(400, 'Unexpected Parameters')
   @api.response(404, 'Do Not found Stop')
   @api.response(503, 'Can Not access to External API')
   def get(self, stop_id):
      # check stop in db 
      found = db.check_in_db(stop_id)
      if not found:
         return {}, 404
      
      try:
      # get the data from extern api
         response = requests.get(
            f'https://v6.db.transport.rest/stops/{stop_id}/departures',
            params={'duration': 90})
      except RequestException as e:
         # can not get access to external API 
         return {}, 503
      
      if response.status_code == 200:
         # make operator unique 
         operators = set()
         for num in response.json().get('departures'):
            # max_size = 5
            if len(operators) == 5:
               break
            # get operator name and insert into set 
            operator_name = num.get('line').get('operator').get('name')
            if operator_name:
               operators.add(operator_name)
            # break

         profiles = []
         # Gemini AI 
         for operator in operators:
            profile = {}
            question = f"Give me a general introduction about {operator} in Germany in few words."
            try:
                  response = gemini.generate_content(question).text
                  profile['operator_name'] = operator
                  profile['information'] = response
                  profiles.append(profile)
            except Exception as e:  # Consider specifying the exact exception
               return {}, 503
         res = {
            'stop_id': stop_id,
            'profiles': profiles
         }
         return res, 200
      return {}, 404 

# ------------------------------
# |          db zone           |
# ------------------------------
class db:
   # create a table 
   def init(): 
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      cur.execute('''CREATE TABLE IF NOT EXISTS stops
               (stop_id INTEGER PRIMARY KEY, last_update TEXT, stop_name TEXT, latitude REAL, longitude REAL)''')
        
      conn.commit()
      conn.close()

   # true --> update | false --> insert 
   def insertOrUpdate(stop):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      # check stop in table 
      cur.execute('SELECT stop_id FROM stops WHERE stop_id = ?', (stop.stop_id,))
      found = cur.fetchone()
      
      if found:
         # update
         cur.execute('UPDATE stops SET last_update = ?, stop_name = ?, latitude = ?, longitude = ? WHERE stop_id = ?',
                     (stop.last_update, stop.stop_name, stop.latitude, stop.longitude, stop.stop_id))
      else:
         # insert
         cur.execute('INSERT INTO stops (stop_id, last_update, stop_name, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
                     (stop.stop_id, stop.last_update, stop.stop_name, stop.latitude, stop.longitude))
      conn.commit()
      conn.close()
      return found

   def check_in_db(stop_id):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      cur.execute('SELECT stop_id FROM stops WHERE stop_id = ?', (stop_id,))
      found = cur.fetchone()
      conn.close()
      return found != None
   
   # get all information about stop_id 
   def get_info(stop_id):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      cur.execute('SELECT * FROM stops WHERE stop_id = ?', (stop_id, ))
      res = cur.fetchone()
      conn.close()
      return res
   
   
   def get_prev(stop_id):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      
      # Get the minimum stop_id in the table
      cur.execute('SELECT MIN(stop_id) FROM stops')
      min_stop_id = cur.fetchone()[0]
      
      # Check if provided stop_id is the minimum
      if stop_id == min_stop_id:
         conn.close()
         return None  # Return None if it is the smallest id
      
      # If not, find the next smallest stop_id that is less than the provided stop_id
      cur.execute('SELECT MAX(stop_id) FROM stops WHERE stop_id < ?', (stop_id,))
      prev_stop_id = cur.fetchone()[0]
      
      conn.close()
      return prev_stop_id
   
   def get_next(stop_id):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      
      # Get the minimum stop_id in the table
      cur.execute('SELECT MAX(stop_id) FROM stops')
      max_stop_id = cur.fetchone()[0]
      
      # Check if provided stop_id is the minimum
      if stop_id == max_stop_id:
         conn.close()
         return None  # Return None if it is the smallest id
      
      # If not, find the next smallest stop_id that is less than the provided stop_id
      cur.execute('SELECT MIN(stop_id) FROM stops WHERE stop_id > ?', (stop_id,))
      next_stop_id = cur.fetchone()[0]
      
      conn.close()
      return next_stop_id
   
   def delete(stop_id):
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      # delete stop_id from stops table 
      cur.execute('DELETE FROM stops WHERE stop_id = ?', (stop_id, ))
      conn.commit()
      conn.close()

   # for test 
   def findAllStops():
      conn = sqlite3.connect(db_file)
      cur = conn.cursor()
      cur.execute('SELECT * FROM stops')
      stops = cur.fetchall()
      conn.close()
      return stops

class StopInfo:
   def __init__(self, stop_id, current_time, stop_name, latitude, longitude):
      self.stop_id = stop_id
      self.last_update = current_time
      self.stop_name = stop_name
      self.latitude = latitude
      self.longitude = longitude
# ------------------------------

if __name__ == "__main__":
   # start api listening
   app.run()

   # iniliaze db
   db.init()