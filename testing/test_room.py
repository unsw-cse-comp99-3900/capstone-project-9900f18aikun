from typing import Any, Literal

import pytest
import date
from app import create_app

# Constants

ZID = "z2"
PASSWORD = "b"

def perform_login(base_url, zid, password):
    login_url = f"/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = client.post(login_url, headers=headers, json=payload)
    return response

@pytest.fixture(scope='module')
def get_token():
    response = perform_login(BASE_URL, ZID, PASSWORD)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.text}"
    json_response = response.json()
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    
    token = json_response.get('access_token')
    assert token is not None, "Login successful but no access token found"
    return token

def perform_get_request(url, token=None):
    headers = {
        "accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = client.get(url, headers=headers)
    return response

@pytest.mark.parametrize("room_id, expected_status_code", [
    (1, 200),  # Example room ID
    (2, 200),  # Another example room ID
])
def test_room_detail(get_token: Any, room_id: int, expected_status_code: int):
    url = f"/room/room-detail/{room_id}"
    response = perform_get_client(url, get_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"

    if expected_status_code == 200:
        assert "message" in json_response, f"Expected 'message' key in response. Response: {json_response}"
        assert "room_id" in json_response["message"], f"Expected 'room_id' key in message. Response: {json_response['message']}"
        assert json_response["message"]["room_id"] == room_id, f"Expected room_id to be {room_id}, got {json_response['message']['room_id']}. Response: {json_response['message']}"
    else:
        assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

def test_room_detail_no_token(room_id=1, expected_status_code=500):
    url = f"/room/room-detail/{room_id}"
    response = perform_get_client(url)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

def test_room_detail_expired_token(room_id=1, expected_status_code=422):
    url = f"/room/room-detail/{room_id}"
    expired_token = "expired_or_invalid_token"
    response = perform_get_client(url, expired_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

def test_room_detail_missing_room_id(get_token: Any, expected_status_code=404):
    url = f"/room/room-detail/"
    response = perform_get_client(url, get_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    if response.status_code == 404:
        assert response.headers["Content-Type"].startswith("text/html"), f"Expected HTML error page. Response: {response.text}"
    else:
        assert json_response is not None, f"Response JSON is None. Response: {response.text}"
        assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

def test_room_detail_non_existent_room(get_token: Any, room_id=999, expected_status_code=500):
    url = f"/room/room-detail/{room_id}"
    response = perform_get_request(url, get_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert response.headers["Content-Type"].startswith("text/html"), f"Expected HTML error page. Response: {response.text}"
    # We can only print the HTML response here, as we can't assert its structure easily in this context.

if __name__ == "__main__":
    pytest.main()
