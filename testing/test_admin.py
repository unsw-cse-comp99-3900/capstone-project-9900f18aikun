import requests
import pytest
from typing import Any
from config import BACKEND_URL

# Constants
BASE_URL = f"http://{BACKEND_URL}"
#BASE_URL = "http://3.26.67.188:5001/"


def perform_login(zid, password):
    login_url = f"{BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = requests.post(login_url, headers=headers, json=payload)
    return response.json().get("access_token")


def test_isadmin():
    token = perform_login("z2","b")
    url = f"{BASE_URL}/admin/check_admin"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
    }
    response = requests.get(url, headers=headers,params=params)
    assert response.status_code == 200, f"check admin failed: {response.status_code}, {response.text}"

def test_report():
    token = perform_login("z27693", "oStvp")
    url = f"{BASE_URL}/admin/report"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "message": "test text"
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"send report failed: {response.status_code}, {response.text}"

def test_get_usage_report_txt():
    token = perform_login("z2", "b")
    url = f"{BASE_URL}/admin/get-usage-report-txt"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "date":"2024-07-31"
    }
    response = requests.get(url, headers=headers, params=params)
    assert response.status_code == 200, f"get report failed: {response.status_code}, {response.text}"

def test_edit_comment():
    token = perform_login("z2", "b")
    url = f"{BASE_URL}/admin/edit-comment"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "comment_id": 2,
        "comment":"edited comment"
    }
    response = requests.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"send report failed: {response.status_code}, {response.text}"

if __name__ == "__main__":
    pytest.main()