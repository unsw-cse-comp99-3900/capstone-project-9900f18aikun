from typing import Any
import pytest
from datetime import datetime, timedelta
from app import create_app
from config import DATE, ADMIN_TOKEN

@pytest.fixture(scope='session')
def client():
    flask_app, socio = create_app() 
    client = flask_app.test_client()
    ctx = flask_app.app_context()
    ctx.push()
    yield client  # this is where the testing happens!
    ctx.pop()

# Constants
ZID = "z2"
PASSWORD = "b"

@pytest.fixture(scope="module")
def token(client):
    login_url = "/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {'zid': 'z1', 'password': 'a'}
    response = client.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to obtain access token: {response.status_code}"
    return response.json["access_token"]


@pytest.fixture(scope="module")
def admin_token(client):
    login_url = "/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {'zid': 'z2', 'password': 'b'}
    response = client.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to obtain access token: {response.status_code}"
    return response.json["access_token"]


def get_booking_id(token: Any, room_id: int, client: Any) -> int:
    url = "/history"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "room_id": room_id
    }
    response = client.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to fetch history: {response.status_code}, {response.text}"
    history = response.json()
    if not history:
        raise ValueError("No bookings found for the room")
    return history[0]['booking_id']

def get_future_date(days: int) -> str:
    return (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

def test_admin_book(token: Any, client: Any):
    url = "/booking/admin_book"
    headers = {
        "Authorization": f"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMjc1ODkwNCwianRpIjoiYjcwNGU2MDktNGQyMC00M2VhLTgxMzAtMmU5NDBlOTU2NGYyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ6aWQiOiJ6MiJ9LCJuYmYiOjE3MjI3NTg5MDQsImNzcmYiOiJkNjExZmZmNi0xYWE3LTQ1NmMtOWJkMi00ZjUwMGQwZDc4ZGQiLCJleHAiOjE3ODI3NTg4NDR9.eU-gF86dxKUsnzqcYB0uMxRPUQd1MkYXY3t9_IAeAkY",
        "Content-Type": "application/json"
    }
    payload = {
        "user_id": "z1",
        "room_id": 5,
        "date": get_future_date(1),
        "start_time": "15:30",
        "end_time": "16:00"
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Admin book failed: {response.status_code}, {response.text}"

def test_block_room(token: Any, client: Any):
    url = "/booking/block-room"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "roomid": 1
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Block room failed: {response.status_code}, {response.text}"

def test_book_room(token: Any, client: Any):
    url = f"/booking/book"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": 3,
        "date": get_future_date(2),
        "start_time": "11:00",
        "end_time": "12:00",
        "weeks_of_duration": 0
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Book room failed: {response.status_code}, {response.text}"

def test_delete_book(token: Any, client: Any):
    url = "/history/booking-history"
    headers = {
        "Authorization": USER_TOKEN
    }
    response = client.get(url, headers=headers)
    assert response.status_code == 200
    assert response.json is not None

    booking_id = 1
    url = f"/booking/book/{booking_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = client.delete(url, headers=headers)
    assert response.status_code == 200, f"Delete book failed: {response.status_code}, {response.text}"

def test_edit_room(token: Any, client: Any):
    url = f"/booking/edit-room"
    headers = {
        "Authorization": ADMIN_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": 3,
        "name": "G01",
        "building": "K17",
        "capacity": 3,
        "level": "G"
    }
    response = client.put(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Edit room failed: {response.status_code}, {response.text}"

def test_express_book(token: Any, client: Any):
    url = f"/booking/express-book"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "query": f"{get_future_date(3)},13:30-14:00",
        "room_type": "meeting_room"
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Express book failed: {response.status_code}, {response.text}"

def test_extend_book(token: Any, client: Any):
    booking_id = 221
    url = f"/booking/extend_book/{booking_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = client.post(url, headers=headers)
    assert response.status_code == 200, f"Extend book failed: {response.status_code}, {response.text}"

def test_handle_request(token: Any, client: Any):
    url = f"/booking/handle-request"
    headers = {
        "Authorization": ADMIN_TOKEN,
        "Content-Type": "application/json"
    }
    payload = {
        "booking_id": 198,
        "confirmed": True
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Handle request failed: {response.status_code}, {response.text}"

def test_is_book_today(token: Any, client: Any):
    url = f"/booking/is_book_today"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "date": get_future_date(0)
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Is book today failed: {response.status_code}, {response.text}"

def test_meetingroom(token: Any, client: Any):
    url = f"/booking/meetingroom"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "date": get_future_date(1),
        "is_ranked": True
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Meeting room failed: {response.status_code}, {response.text}"

def test_get_meetingroom_report(token: Any, client: Any):
    url = f"/booking/meetingroom-report"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "date": get_future_date(1)
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Get meeting room report failed: {response.status_code}, {response.text}"

def test_meetingroom_top10(token: Any, client: Any):
    url = f"/booking/meetingroom-top10-byCount"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "date": get_future_date(1)
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Meeting room top 10 failed: {response.status_code}, {response.text}"

def test_get_meetingroom_usage(token: Any, client: Any):
    url = f"/booking/meetingroom-usage"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "date": get_future_date(-1)
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Get meeting room usage failed: {response.status_code}, {response.text}"

def test_show_request(token: Any, client: Any):
    url = f"/booking/show-request"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    response = client.get(url, headers=headers)
    assert response.status_code == 200, f"Show request failed: {response.status_code}, {response.text}"

def test_unblock_room(token: Any, client: Any):
    url = f"/booking/unblock-room"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    params = {
        "roomid": 3
    }
    response = client.get(url, headers=headers, query_string=params)
    assert response.status_code == 200, f"Unblock room failed: {response.status_code}, {response.text}"
