from typing import Any
import pytest
import requests


# Constants
#BASE_URL = "http://3.26.67.188:5001/"
BASE_URL = "http://s2.gnip.vip:37895/"
ZID = "z2"
PASSWORD = "b"

@pytest.fixture(scope="module")
def token():
    login_url = f"{BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": ZID, "password": PASSWORD}
    response = requests.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to obtain access token: {response.status_code}"
    return response.json().get("access_token")

def get_booking_id(token: Any, room_id: int) -> int:
    url = f"{BASE_URL}/history"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "room_id": room_id
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to fetch history: {response.status_code}, {response.text}"
    history = response.json()
    if not history:
        raise ValueError("No bookings found for the room")
    return history[0]['booking_id']  # 返回第一个预订的ID，实际使用中可能需要调整

def test_admin_book(token: Any):
    url = f"{BASE_URL}/booking/admin_book"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "user_id": "z1",
        "room_id": 5,
        "date": "2024-08-01",
        "start_time": "14:30",
        "end_time": "15:00"
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Admin book failed: {response.status_code}, {response.text}"

def test_block_room(token: Any):
    url = f"{BASE_URL}/booking/block-room"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "roomid": 1
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Block room failed: {response.status_code}, {response.text}"

def test_book_room(token: Any):
    url = f"{BASE_URL}/booking/book"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": 3,
        "date": "2024-08-03",
        "start_time": "11:00",
        "end_time": "12:00",
        "weeks_of_duration": 0
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Book room failed: {response.status_code}, {response.text}"

def test_delete_book(token: Any):
    booking_id = 279
    url = f"{BASE_URL}/booking/book/{booking_id}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.delete(url, headers=headers)
    assert response.status_code == 200, f"Delete book failed: {response.status_code}, {response.text}"

def test_edit_room(token: Any):
    url = f"{BASE_URL}/booking/edit-room"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": 3,
        "name": "G01",
        "building": "K17",
        "capacity": 3,
        "level": "G"
    }
    response = requests.put(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Edit room failed: {response.status_code}, {response.text}"

def test_express_book(token: Any):
    url = f"{BASE_URL}/booking/express-book"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "query": "2024-08-03,13:30-14:00",
        "room_type": "meeting_room"
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Express book failed: {response.status_code}, {response.text}"

def test_extend_book(token: Any):
    booking_id = 221
    url = f"{BASE_URL}/booking/extend_book/{booking_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers)
    assert response.status_code == 200, f"Extend book failed: {response.status_code}, {response.text}"


def test_handle_request(token: Any):
    url = f"{BASE_URL}/booking/handle-request"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "booking_id": 198,
        "confirmed": True
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"Handle request failed: {response.status_code}, {response.text}"

def test_is_book_today(token: Any):
    url = f"{BASE_URL}/booking/is_book_today"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date": "2024-08-01"
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Is book today failed: {response.status_code}, {response.text}"

def test_meetingroom(token: Any):
    url = f"{BASE_URL}/booking/meetingroom"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date": "2024-08-01",
        "is_ranked": True
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Meeting room failed: {response.status_code}, {response.text}"

def test_get_meetingroom_report(token: Any):
    url = f"{BASE_URL}/booking/meetingroom-report"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date": "2024-08-01"
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Get meeting room report failed: {response.status_code}, {response.text}"

def test_meetingroom_top10(token: Any):
    url = f"{BASE_URL}/booking/meetingroom-top10-byCount"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date": "2024-08-01"
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Meeting room top 10 failed: {response.status_code}, {response.text}"

def test_get_meetingroom_usage(token: Any):
    url = f"{BASE_URL}/booking/meetingroom-usage"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date": "2024-07-31"
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Get meeting room usage failed: {response.status_code}, {response.text}"

def test_show_request(token: Any):
    url = f"{BASE_URL}/booking/show-request"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Show request failed: {response.status_code}, {response.text}"

def test_unblock_room(token: Any):
    url = f"{BASE_URL}/booking/unblock-room"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "roomid": 3
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Unblock room failed: {response.status_code}, {response.text}"
