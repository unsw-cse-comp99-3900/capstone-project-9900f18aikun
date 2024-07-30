import requests


# Constants
BASE_URL = "http://3.26.67.188:5001/"
ZID = "z2"  # 使用实际的 zID
PASSWORD = "b"  # 使用实际的密码

def get_access_token(base_url, zid, password):
    login_url = f"{base_url}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = requests.post(login_url, headers=headers, json=payload)
    print(f"Login URL: {login_url}")
    print(f"Payload: {payload}")
    print(f"Response Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        return None

def print_response(endpoint, response):
    try:
        json_response = response.json()
    except ValueError:
        json_response = None
    print(f"{endpoint}: {response.status_code}, {json_response}")

def test_history_operations(base_url, token):
    def test_alluser_booking_history(base_url, date):
        url = f"{base_url}/history/alluser-booking-history"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": date
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /history/alluser-booking-history", response)

    def test_booking_history(base_url):
        url = f"{base_url}/history/booking-history"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /history/booking-history", response)

    def test_certain_booking_history(base_url, user_zid):
        url = f"{base_url}/history/certain-booking-history"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "user_zid": user_zid
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /history/certain-booking-history", response)

    test_alluser_booking_history(base_url, "2024-07-28")
    test_booking_history(base_url)
    test_certain_booking_history(base_url, "z27693")

if __name__ == "__main__":
    token = get_access_token(BASE_URL, ZID, PASSWORD)
    if token:
        print(f"Access Token: {token}")
        test_history_operations(BASE_URL, token)
    else:
        print("Failed to obtain access token.")
