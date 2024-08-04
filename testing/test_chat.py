import date
import pytest
from app import create_app


@pytest.fixture(scope='session')
def client():
    flask_app,socio = create_app() 
    # Flask provides a way to test your application by exposing the Werkzeug test Client
    # and handling the context locals for you.
    client = flask_app.test_client()
    # Establish an application context before running the tests.
    ctx = flask_app.app_context()
    ctx.push()
    yield client  # this is where the testing happens!
    ctx.pop()

@pytest.fixture(scope="module")
def token(client):
    login_url = "/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {'zid': 'z1', 'password': 'a'}
    response = client.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to obtain access token: {response.status_code}"
    return response.json().get("access_token")


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

def perform_post_request(url, token=None):
    headers = {
        "accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = client.post(url, headers=headers)
    return response

@pytest.mark.parametrize("chat_id, expected_status_code", [
    (1, 400),  # Example chat ID
    (2, 400),  # Another example chat ID
])
def test_chat_view(get_token: str, chat_id: int, expected_status_code: int):
    url = f"/chat/view/{chat_id}"
    response = perform_post_client(url, get_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    # Add more assertions here based on the expected structure of the JSON response.

@pytest.mark.parametrize("chat_id, expected_status_code", [
    (1, 500),  # Example chat ID, no token
])
def test_chat_view_no_token(chat_id: int, expected_status_code: int):
    url = f"/chat/view/{chat_id}"
    response = perform_post_client(url)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

@pytest.mark.parametrize("chat_id, expected_status_code", [
    (1, 422),  # Example chat ID, expired token
])
def test_chat_view_expired_token(chat_id: int, expected_status_code: int):
    url = f"/chat/view/{chat_id}"
    expired_token = "expired_or_invalid_token"
    response = perform_post_client(url, expired_token)
    
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}. Response: {response.text}"
    
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    
    assert json_response is not None, f"Response JSON is None. Response: {response.text}"
    assert "error" in json_response, f"Expected 'error' key in response. Response: {json_response}"

if __name__ == "__main__":
    pytest.main()
