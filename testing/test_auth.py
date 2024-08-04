from typing import Any
import pytest
from datetime import datetime, timedelta
from app import create_app

@pytest.fixture(scope='session')
def client():
    flask_app, socio = create_app() 
    client = flask_app.test_client()
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

# 自动登录函数
def perform_login(client, url, zid, password):
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "zid": zid,
        "password": password
    }

    response = client.post(url, headers=headers, json=payload)

    result = {
        'status_code': response.status_code,
        'response_text': response.text,
        'json_response': response.json() if response.headers.get('Content-Type') == 'application/json' else None
    }
    return result

# 使用 pytest 进行参数化测试
@pytest.mark.parametrize("zid, password, expected_status_code, expected_response_keys", [
    ("z2", "b", 200, ["access_token", "is_admin"]),  # 正确的用户名和密码
    ("z27693", "oStvp", 200, ["access_token", "is_admin"]),  # 正确的用户名和密码
    ("z2", "wrongpassword", 400, ["error"]),  # 错误的密码
    ("wronguser", "b", 400, ["error"]),  # 错误的用户名
    ("", "", 400, ["error"]),  # 空的用户名和密码
])
def test_login_cases(client, zid, password, expected_status_code, expected_response_keys):
    login_url = "/auth/login"
    result = perform_login(client, login_url, zid, password)

    assert result['status_code'] == expected_status_code, f"Expected {expected_status_code}, got {result['status_code']}"
    
    json_response = result['json_response']
    assert json_response is not None, "Response JSON is None"
    
    for key in expected_response_keys:
        assert key in json_response, f"Expected key '{key}' in response"

# 示例测试，使用 token 进行授权请求
def test_auto_login(client, token):
    auto_login_url = "/auth/auto-login"
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    response = client.get(auto_login_url, headers=headers)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"
    assert json_response.get('zid') == 'z2', "Expected zid to be 'z2'"
    assert json_response.get('message') == 'User verified', "Expected message to be 'User verified'"
    assert json_response.get('is_admin') is True, "Expected is_admin to be True"

if __name__ == "__main__":
    pytest.main()
