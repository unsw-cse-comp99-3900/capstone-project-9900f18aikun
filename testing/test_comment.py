import pytest
from app import create_app
from config import USER_TOKEN, ADMIN_TOKEN, DATE

comment_number = -1

@pytest.fixture(scope='session')
def client():
    flask_app, socio = create_app()
    client = flask_app.test_client()
    ctx = flask_app.app_context()
    ctx.push()
    yield client
    ctx.pop()

def test_make_comment(client):
    url = "/comment/make-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "room_id": 1,
        "comment": "WOW! Nice room!",
        "comment_to_id": 0
    }
    response = client.post(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_get_comment(client):
    global comment_number
    url = "/comment/get-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "room_id": 1,
    }
    response = client.get(url, headers=headers, query_string=data)
    assert response.status_code == 200
    assert response.json is not None

    comments = response.json.get('comments', [])
    if comments:
        comment_number = comments[0]['id']
    print(f"First comment ID: {comment_number}")

def test_edit_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/comment/edit-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "comment_id": comment_number,
        "comment": "AHHHH! Great room."
    }
    response = client.post(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_like_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/comment/like-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "comment_id": comment_number,
    }
    response = client.put(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_unlike_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/comment/unlike-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "comment_id": comment_number,
    }
    response = client.put(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_make_rate(client):
    url = "/comment/make-rate"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "room_id": 1,
        "rate": 5
    }
    response = client.put(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_get_rate(client):
    url = "/comment/get-rate"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "room_id": 1,
    }
    response = client.get(url, headers=headers, query_string=data)
    assert response.status_code == 200
    assert response.json is not None

def test_delete_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/comment/delete-comment"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "comment_id": comment_number,
    }
    response = client.delete(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

if __name__ == "__main__":
    pytest.main()
