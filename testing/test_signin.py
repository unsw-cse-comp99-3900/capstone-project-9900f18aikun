import requests
import pytest
from config import BACKEND_URL

# Constants
BASE_URL = f"http://{BACKEND_URL}"
ZID = "z2"
PASSWORD = "b"

def perform_login(base_url, zid, password):
    login_url = f"{base_url}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = requests.post(login_url, headers=headers, json=payload)
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
    response = requests.get(url, headers=headers)
    return response

@pytest.mark.parametrize("room_id, expected_status_code", [
    (1, 400),  # Example room ID
    (2, 400),  # Another example room ID
    (0, 400),  # Lack room ID
    (900, 400),  # The room ID does not exist
])
def test_sign_in(get_token: str, room_id: int, expected_status_code: int):
    url = f"{BASE_URL}/sign_in/sign-in/{room_id}"
    response = perform_get_request(url, get_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    # Add more assertions here based on the expected structure of the JSON response.

@pytest.mark.parametrize("room_id, expected_status_code", [
    (1, 500),  # Example room ID, no token
])
def test_sign_in_no_token(room_id: int, expected_status_code: int):
    url = f"{BASE_URL}/sign_in/sign-in/{room_id}"
    response = perform_get_request(url)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

@pytest.mark.parametrize("room_id, expected_status_code", [
    (1, 422),  # Example room ID, expired token
])
def test_sign_in_expired_token(room_id: int, expected_status_code: int):
    url = f"{BASE_URL}/sign_in/sign-in/{room_id}"
    expired_token = "expired_or_invalid_token"
    response = perform_get_request(url, expired_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

if __name__ == "__main__":
    pytest.main()
