import requests
import pytest

# Constants
BASE_URL = "http://s2.gnip.vip:37895/"
#BASE_URL = "http://3.26.67.188:5001/"
ZID = "z2"  # 使用实际的 zID
PASSWORD = "b"  # 使用实际的密码

@pytest.fixture
def get_access_token():
    login_url = f"{BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": ZID, "password": PASSWORD}
    response = requests.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Failed to login: {response.text}"
    return response.json().get("access_token")

@pytest.mark.parametrize("date", ["2024-07-28"])
def test_alluser_booking_history(get_access_token, date):
    url = f"{BASE_URL}/history/alluser-booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    params = {
        "date": date
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to get alluser booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"

def test_booking_history(get_access_token):
    url = f"{BASE_URL}/history/booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to get booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"

@pytest.mark.parametrize("user_zid", ["z27693"])
def test_certain_booking_history(get_access_token, user_zid):
    url = f"{BASE_URL}/history/certain-booking-history"
    headers = {
        "Authorization": f"Bearer {get_access_token}"
    }
    params = {
        "user_zid": user_zid
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"Failed to get certain booking history: {response.text}"
    assert response.json() is not None, "Response is not valid JSON"
