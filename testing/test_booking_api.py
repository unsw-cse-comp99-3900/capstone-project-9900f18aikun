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

def test_booking_operations(base_url, token):
    def test_admin_book():
        url = f"{base_url}/booking/admin_book"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "user_id": "z1",
            "room_id": 1,
            "date": "2024-07-19",
            "start_time": "12:00",
            "end_time": "13:00"
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /booking/admin_book", response)

    def test_block_room():
        url = f"{base_url}/booking/block-room"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "roomid": 1
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/block-room", response)

    def test_book_room():
        url = f"{base_url}/booking/book"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "room_id": 1,
            "date": "2024-07-16",
            "start_time": "12:00",
            "end_time": "13:00",
            "weeks_of_duration": 1
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /booking/book", response)

    def test_delete_book(booking_id):
        url = f"{base_url}/booking/book/{booking_id}"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.delete(url, headers=headers)
        print_response(f"DELETE /booking/book/{booking_id}", response)

    def test_edit_room():
        url = f"{base_url}/booking/edit-room"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "room_id": 1,
            "name": "G01",
            "building": "K17",
            "capacity": 1,
            "level": "1"
        }
        response = requests.put(url, headers=headers, json=payload)
        print_response("PUT /booking/edit-room", response)

    def test_express_book():
        url = f"{base_url}/booking/express-book"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "query": "string",
            "room_type": "string"
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /booking/express-book", response)

    def test_extend_book(booking_id):
        url = f"{base_url}/booking/extend_book/{booking_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        response = requests.post(url, headers=headers)
        print_response(f"POST /booking/extend_book/{booking_id}", response)

    def test_handle_request():
        url = f"{base_url}/booking/handle-request"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "booking_id": 1,
            "confirmed": True
        }
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /booking/handle-request", response)

    def test_is_book_today():
        url = f"{base_url}/booking/is_book_today"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": "2024-07-19"
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/is_book_today", response)

    def test_meetingroom():
        url = f"{base_url}/booking/meetingroom"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": "2024-07-19",
            "is_ranked": False
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/meetingroom", response)

    def test_get_meetingroom_report():
        url = f"{base_url}/booking/meetingroom-report"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": "2024-07-19"
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/meetingroom-report", response)

    def test_meetingroom_top10():
        url = f"{base_url}/booking/meetingroom-top10-byCount"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": "2024-07-19"
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/meetingroom-top10-byCount", response)

    def test_get_meetingroom_usage():
        url = f"{base_url}/booking/meetingroom-usage"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "date": "2024-07-19"
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/meetingroom-usage", response)

    def test_show_request():
        url = f"{base_url}/booking/show-request"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /booking/show-request", response)

    def test_unblock_room():
        url = f"{base_url}/booking/unblock-room"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        params = {
            "roomid": 1
        }
        response = requests.get(url, headers=headers, params=params)
        print_response("GET /booking/unblock-room", response)

    # Run all tests
    test_admin_book()
    test_block_room()
    test_book_room()
    test_delete_book(1)
    test_edit_room()
    test_express_book()
    test_extend_book(1)
    test_handle_request()
    test_is_book_today()
    test_meetingroom()
    test_get_meetingroom_report()
    test_meetingroom_top10()
    test_get_meetingroom_usage()
    test_show_request()
    test_unblock_room()

if __name__ == "__main__":
    token = get_access_token(BASE_URL, ZID, PASSWORD)
    if token:
        print(f"Access Token: {token}")
        test_booking_operations(BASE_URL, token)
    else:
        print("Failed to obtain access token.")
