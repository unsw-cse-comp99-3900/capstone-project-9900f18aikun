import requests


# Constants
BASE_URL = "http://3.26.67.188:5001/"
ZID = "z2"
PASSWORD = "b"

def get_access_token(base_url, zid, password):
    login_url = f"{base_url}/auth/login"
    headers = {"Content-Type": "application/json"}
    payload = {"zid": zid, "password": password}
    response = requests.post(login_url, headers=headers, json=payload)
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

def test_room_operations(base_url, token):
    def test_room_detail(room_id):
        url = f"{base_url}/room/room-detail/{room_id}"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(url, headers=headers)
        print_response(f"GET /room/room-detail/{room_id}", response)

    test_room_detail(1)  # Example room ID

if __name__ == "__main__":
    token = get_access_token(BASE_URL, ZID, PASSWORD)
    if token:
        print(f"Access Token: {token}")
        test_room_operations(BASE_URL, token)
    else:
        print("Failed to obtain access token.")
