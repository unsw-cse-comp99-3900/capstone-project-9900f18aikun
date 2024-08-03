import requests
import pytest

# 自动登录函数
def perform_login(url, zid, password):
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "zid": zid,
        "password": password
    }

    response = requests.post(url, headers=headers, json=payload)

    result = {
        'status_code': response.status_code,
        'response_text': response.text,
        'json_response': response.json() if response.headers.get('Content-Type') == 'application/json' else None
    }
    return result

# Perform GET request
def perform_get_request(url, token, params=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }
    response = requests.get(url, headers=headers, params=params)
    return response

# 使用 pytest 进行参数化测试
@pytest.mark.parametrize("zid, password, expected_status_code, expected_response_keys", [
    ("z2", "b", 200, ["access_token", "is_admin"]),  # 正确的用户名和密码
    ("z27693", "oStvp", 200, ["access_token", "is_admin"]),  # 正确的用户名和密码
    ("z2", "wrongpassword", 400, ["error"]),  # 错误的密码
    ("wronguser", "b", 400, ["error"]),  # 错误的用户名
    ("", "", 400, ["error"]),  # 空的用户名和密码
])
def test_login_cases(zid, password, expected_status_code, expected_response_keys):
    #base_url = "http://3.26.67.188:5001/auth/login"
    base_url = "http://s2.gnip.vip:37895/auth/login"
    
    result = perform_login(base_url, zid, password)

    assert result['status_code'] == expected_status_code, f"Expected {expected_status_code}, got {result['status_code']}"
    
    json_response = result['json_response']
    assert json_response is not None, "Response JSON is None"
    
    for key in expected_response_keys:
        assert key in json_response, f"Expected key '{key}' in response"

# 定义一个 fixture 获取正确的 token
@pytest.fixture(scope='module')
def get_token():
    #base_url = "http://3.26.67.188:5001/auth/login"
    base_url = "http://s2.gnip.vip:37895/auth/login"
    zid = "z2"
    password = "b"
    result = perform_login(base_url, zid, password)

    assert result['status_code'] == 200, f"Expected 200, got {result['status_code']}"
    json_response = result['json_response']
    assert json_response is not None, "Response JSON is None"
    
    token = json_response.get('access_token')
    assert token is not None, "Login successful but no access token found"
    assert json_response.get('is_admin') is True, "Expected is_admin to be True"

    return token

# 示例测试，使用 token 进行授权请求
def test_auto_login(get_token):
    #base_url = "http://3.26.67.188:5001/auth/auto-login"
    base_url = "http://s2.gnip.vip:37895/auth/login"
    headers = {
        "Authorization": f"Bearer {get_token}",
        "accept": "application/json"
    }

    response = requests.get(base_url, headers=headers)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"
    assert json_response.get('zid') == 'z2', "Expected zid to be 'z2'"
    assert json_response.get('message') == 'User verified', "Expected message to be 'User verified'"
    assert json_response.get('is_admin') is True, "Expected is_admin to be True"

@pytest.mark.parametrize("date, expected_status_code", [
    ("2024-07-28", 200),
    ("2024-07-01", 200),
])
def test_alluser_booking_history(get_token, date, expected_status_code):
    #base_url = "http://3.26.67.188:5001/history/alluser-booking-history"
    base_url = "http://s2.gnip.vip:37895/history/alluser-booking-history"
    params = {
        "date": date
    }
    response = perform_get_request(base_url, get_token, params=params)
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"

def test_booking_history(get_token):
    #base_url = "http://3.26.67.188:5001/history/booking-history"
    base_url = "http://s2.gnip.vip:37895/history/booking-history"
    response = perform_get_request(base_url, get_token)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"

@pytest.mark.parametrize("user_zid, expected_status_code", [
    ("z27693", 200),
    ("z10000", 200),
])
def test_certain_booking_history(get_token, user_zid, expected_status_code):
    #base_url = "http://3.26.67.188:5001/history/certain-booking-history"
    base_url = "http://s2.gnip.vip:37895/history/certain-booking-history"
    params = {
        "user_zid": user_zid
    }
    response = perform_get_request(base_url, get_token, params=params)
    assert response.status_code == expected_status_code, f"Expected {expected_status_code}, got {response.status_code}"
    json_response = response.json()
    assert json_response is not None, "Response JSON is None"

if __name__ == "__main__":
    pytest.main()
