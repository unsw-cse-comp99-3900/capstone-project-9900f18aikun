from typing import Any
import pytest
import datetime
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
    #print(response.json)
    return response.json["access_token"]

def perform_login(client, zid, password):
    """Function to perform login and return the access token."""
    login_url = "/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = client.post(login_url, headers=headers, json=payload)
    assert response.status_code == 200, f"Login failed: {response.status_code}, {response.data}"
    return response.get_json().get("access_token")

def test_isadmin(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/admin/check_admin', headers=headers)
    print(response.data)  # Debug information
    assert response.status_code == 200
    assert response.get_json() == {'is_admin': True}

def test_report(client):
    token = perform_login(client, "z1", "a")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {'message': 'G01 table missin', 'to_zid': 'z2'}  # Ensure 'to_zid' is valid
    response = client.post('/admin/report', headers=headers, json=payload)
    #print(response.data)  # Debug information
    assert response.status_code == 200

def test_admin_book(client, token):
    admin_token = perform_login(client, "z2", "b")
    url = "/booking/admin_book"
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "user_id": "z1",
        "room_id": 5,
        "date": "2024-08-05",
        "start_time": "14:30",
        "end_time": "15:00"
    }
    response = client.post(url, headers=headers, json=payload)
    #print(response.data)  # Debug information
    assert response.status_code == 200, f"Admin book failed: {response.status_code}, {response.data}"

def test_get_usage_report_txt(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/admin/get-usage-report-txt', headers=headers)  # Ensure this endpoint exists
    print(response.data)  # Debug information
    assert response.status_code == 200,f"Failed: {response.status_code}, {response.data}"

def test_make_comment():
    token = perform_login("z1", "a")
    url = f"/comment/make-comment"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "room_id": "1",
        "comment":"Nice!!",
        "comment_to_id":0
    }
    response = client.post(url, headers=headers, json=payload)
    assert response.status_code == 200, f"make comment failed: {response.status_code}, {response.text}"

def test_find_room_comments(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/comment/get-comment', headers=headers, query_string={'room_id': 1})  # 假设查找房间评论的端点为/room/comments
    print(response.data)  # Debug information
    assert response.status_code == 200
    comments = response.get_json()
    return comments

def test_edit_comment(client):
    comments = test_find_room_comments(client)
    if comments:
        comment_id = comments[0]['id']  # 假设评论ID字段为id
        token = perform_login(client, "z2", "b")
        headers = {'Authorization': f'Bearer {token}'}
        payload = {'comment_id': comment_id, 'new_text': 'Edited comment'}
        response = client.post('/admin/edit-comment', headers=headers, json=payload)
        print(response.data)  # Debug information
        assert response.status_code == 200, f"Failed: {response.status_code}, {response.data}"
    else:
        pytest.skip("No comments found to edit")

def test_delete_comment(client):
    comments = test_find_room_comments(client)
    if comments:
        comment_id = comments[0]['id']  # 假设评论ID字段为id
        token = perform_login(client, "z2", "b")
        headers = {'Authorization': f'Bearer {token}'}
        response = client.delete('/admin/delete-comment', headers=headers, json={'comment_id': comment_id})
        print(response.data)  # Debug information
        assert response.status_code == 200,f"Failed: {response.status_code}, {response.data}"
    else:
        pytest.skip("No comments found to delete")

def test_time(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/admin/time', headers=headers)
    print(response.data)  # Debug information
    assert response.status_code == 200,f"Failed: {response.status_code}, {response.data}"

def test_view_get(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/admin/view', headers=headers)
    print(response.data)  # Debug information
    assert response.status_code == 200,f"Failed: {response.status_code}, {response.data}"

def test_view_post(client):
    token = perform_login(client, "z2", "b")
    headers = {'Authorization': f'Bearer {token}'}
    payload = {'view_id': 1, 'data': 'view data'}
    response = client.post('/admin/view', headers=headers, json=payload)
    print(response.data)  # Debug information
    assert response.status_code == 200,f"Failed: {response.status_code}, {response.data}"
