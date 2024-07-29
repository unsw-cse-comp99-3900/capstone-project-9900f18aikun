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

def test_comment_operations(base_url, token):
    def test_comment_make_comment():
        url = f"{base_url}/comment/make-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "room_id": 1,
            "comment": "WOW! Nice room!",
            "comment_to_id": 0
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /comment/make-comment", response)

    def test_comment_make_rate():
        url = f"{base_url}/comment/make-rate"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "room_id": 1,
            "rate": 5
        }
        response = requests.put(url, headers=headers, json=payload)
        print_response("PUT /comment/make-rate", response)

    def test_comment_unlike_comment():
        url = f"{base_url}/comment/unlike-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "comment_id": 1
        }
        response = requests.put(url, headers=headers, json=payload)
        print_response("PUT /comment/unlike-comment", response)

    def test_comment_like_comment():
        url = f"{base_url}/comment/like-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "comment_id": 1
        }
        response = requests.put(url, headers=headers, json=payload)
        print_response("PUT /comment/like-comment", response)

    def test_comment_get_rate():
        room_id = 1  # Example room ID
        url = f"{base_url}/comment/get-rate?room_id={room_id}"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(url, headers=headers)
        print_response(f"GET /comment/get-rate?room_id={room_id}", response)

    def test_comment_get_comment():
        room_id = 1  # Example room ID
        url = f"{base_url}/comment/get-comment?room_id={room_id}"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(url, headers=headers)
        print_response(f"GET /comment/get-comment?room_id={room_id}", response)

    def test_comment_edit_comment():
        url = f"{base_url}/comment/edit-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "comment_id": 1,
            "comment": "Updated comment"
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /comment/edit-comment", response)

    def test_comment_delete_comment():
        url = f"{base_url}/comment/delete-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "comment_id": 1
        }
        response = requests.delete(url, headers=headers, json=payload)
        print_response("DELETE /comment/delete-comment", response)

    test_comment_make_comment()
    test_comment_make_rate()
    test_comment_unlike_comment()
    test_comment_like_comment()
    test_comment_get_rate()
    test_comment_get_comment()
    test_comment_edit_comment()
    test_comment_delete_comment()

if __name__ == "__main__":
    token = get_access_token(BASE_URL, ZID, PASSWORD)
    if token:
        print(f"Access Token: {token}")
        test_comment_operations(BASE_URL, token)
    else:
        print("Failed to obtain access token.")
