import pytest
from app import create_app
from config import USER_TOKEN, ADMIN_TOKEN, DATE

@pytest.fixture(scope='session')
def client():
    flask_app, socio = create_app() 
    client = flask_app.test_client()
    ctx = flask_app.app_context()
    ctx.push()
    yield client
    ctx.pop()

def test_normal_user_login(client):
    url = "/auth/login"
    data = {
        "zid": "z1",
        "password": "a"
    }
    response = client.post(url, json=data)  # Usinga json parameter to send JSON data
    assert response.status_code == 200
    assert response.json is not None

def test_admin_user_login(client):
    url = "/auth/login"
    data = {
        "zid": "z2",
        "password": "b"
    }
    response = client.post(url, json=data)  # Usinga json parameter to send JSON data
    assert response.status_code == 200
    assert response.json is not None

def test_normal_user_auto_login(client):
    url = "/auth/auto-login"
    headers = {
        "Authorization": USER_TOKEN
    }
    response = client.get(url, headers=headers) # Usinga json parameter to send JSON data
    assert response.status_code == 200
    assert response.json is not None

def test_admin_auto_login(client):
    url = "/auth/auto-login"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    response = client.get(url, headers=headers) # Usinga json parameter to send JSON data
    assert response.status_code == 200
    assert response.json is not None


def test_auto_login_invalidzid(client):
    url = "/auth/login"
    data = {
        "zid": "1",
        "password": "b"
    }
    response = client.post(url, json=data)  # Usinga json parameter to send JSON data
    assert response.status_code == 400

def test_auto_login_wrong_password(client):
    url = "/auth/login"
    data = {
        "zid": "z1",
        "password": "b"
    }
    response = client.post(url, json=data)  # Usinga json parameter to send JSON data
    assert response.status_code == 400