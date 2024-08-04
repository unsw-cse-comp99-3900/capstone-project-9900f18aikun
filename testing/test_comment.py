import date
import pytest
from typing import Any
from app import create_app

# Constants
#BASE_URL = f"http://{BACKEND_URL}"
#BASE_URL = "http://3.26.67.188:5001/"



def perform_login(zid, password):
    login_url = f"/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = client.post(login_url, headers=headers, json=payload)
    return response.json().get("access_token")

def test_make_comment():
    token = perform_login("z27693", "oStvp")
    url = f"/comment/make-comment"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": "5",
        "comment":"content",
        "comment_to_id":0
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"make comment failed: {response.status_code}, {response.text}"

def test_delete_comment():
    token = perform_login("z27693", "oStvp")
    url = f"/comment/make-comment"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": "5",
        "comment":"content 1000",
        "comment_to_id":0
    }
    response = client.post(url, headers=headers, json=payload)
    json_response = response.json()
    message_list = json_response["message"]
    comment_id=message_list[len(message_list)-1]["id"]
    url = f"/comment/delete-comment"
    payload = {
        "comment_id": comment_id
    }
    response = client.delete(url, headers=headers, json=payload)
    assert response.status_code == 200,f"delete comment failed: {response.status_code}, {response.text}"


if __name__ == "__main__":
    pytest.main()