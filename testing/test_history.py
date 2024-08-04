
import pytest
import date
from app import create_app

# Constants
#BASE_URL = f"http://{BACKEND_URL}"
#BASE_URL = "http://3.26.67.188:5001/"
ZID = "z2"  # 使用实际的 zID
PASSWORD = "b"  # 使用实际的密码

@pytest.fixture
def get_access_token():
    login_url = f"/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": ZID, "password": PASSWORD}
    response = client.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to login: {response.text}"
    return response.json().get("access_token")

@pytest.mark.parametrize("date", ["2024-07-28"])
def test_alluser_booking_history(get_access_token, date):
    url = f"/history/alluser-booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    params = {
        "date": date
    }
    response = client.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to get alluser booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"

def test_booking_history(get_access_token):
    url = f"/history/booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    response = client.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to get booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"

@pytest.mark.parametrize("user_zid", ["z27693"])
def test_certain_booking_history(get_access_token, user_zid):
    url = f"/history/certain-booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    params = {
        "user_zid": user_zid
    }
    response = client.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to get certain booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"

ef test_alluser_booking_history(get_token, date, expected_status_code):
    #base_url = "http://{BACKEND_URL}/history/alluser-booking-history"
    #base_url = "http://{BACKEND_URL}/history/alluser-booking-history"
    params = {
        "date": date
    }
    response = get.client(base_url, get_token, params=params)
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"

def test_booking_history(get_token,client:Any):
    #base_url = "http://{BACKEND_URL}/history/booking-history"
    #base_url = "http://{BACKEND_URL}/history/booking-history"
    response = get.client(base_url, get_token)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"

@pytest.mark.parametrize("user_zid, expected_status_code", [
    ("z27693", 200),
    ("z10000", 200),
])
def test_certain_booking_history(get_token, user_zid, expected_status_code):
    #base_url = "http://{BACKEND_URL}/history/certain-booking-history"
    #base_url = "http://{BACKEND_URL}/history/certain-booking-history"
    params = {
        "user_zid": user_zid
    }
   
    response = get.client(base_url, get_token, params=params)
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"