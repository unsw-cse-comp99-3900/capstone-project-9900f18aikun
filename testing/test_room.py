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

def test_room_detail(client):
    url = "/room/room-detail/1"
    headers = {
        "Authorization": USER_TOKEN
    }
    response = client.get(url, headers=headers)
    assert response.status_code == 200
    assert response.json is not None
