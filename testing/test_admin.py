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

def test_check_admin(client):
    url = "/admin/check_admin"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    response = client.get(url, headers=headers)
    assert response.status_code == 200
    assert response.json is not None

def test_admin_report_txt(client):
    url = "/admin/get-usage-report-txt"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    data = {
        "date": DATE
    }
    response = client.get(url, headers=headers, query_string=data)
    assert response.status_code == 200
    assert response.json is not None

def test_admin_report(client):
    url = "/admin/report"
    headers = {
        "Authorization": USER_TOKEN
    }
    data = {
        "message": "G01 table missing"
    }
    response = client.post(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_admin_time(client):
    url = "/admin/time"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    response = client.get(url, headers=headers)
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
    

def test_admin_edit_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/admin/edit-comment"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    data = {
        "comment_id": comment_number,
        "comment": "AHHHH! Great room."
    }
    response = client.post(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

def test_admin_delete_comment(client):
    global comment_number
    test_get_comment(client)  # Ensure comment_number is set
    url = "/admin/delete-comment"
    headers = {
        "Authorization": ADMIN_TOKEN
    }
    data = {
        "comment_id": comment_number,
    }
    response = client.delete(url, headers=headers, json=data)
    assert response.status_code == 200
    assert response.json is not None

if __name__ == "__main__":
    pytest.main()
