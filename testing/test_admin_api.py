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

def test_admin_operations(base_url, token):
    def test_admin_check_admin():
        url = f"{base_url}/admin/check_admin"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /admin/check_admin", response)

    def test_admin_delete_comment(comment_id):
        url = f"{base_url}/admin/delete-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        payload = {"comment_id": comment_id}
        response = requests.delete(url, headers=headers, json=payload)
        print_response("DELETE /admin/delete-comment", response)

    def test_admin_edit_comment(comment_id, comment):
        url = f"{base_url}/admin/edit-comment"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        payload = {"comment_id": comment_id, "comment": comment}
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /admin/edit-comment", response)

    def test_admin_get_usage_report_txt(date):
        url = f"{base_url}/admin/get-usage-report-txt?date={date}"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /admin/get-usage-report-txt", response)

    def test_admin_report(message):
        url = f"{base_url}/admin/report"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        payload = {"message": message}
        response = requests.post(url, headers=headers, json=payload)
        print_response("POST /admin/report", response)

    def test_admin_time():
        url = f"{base_url}/admin/time"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /admin/time", response)

    def test_admin_view_get():
        url = f"{base_url}/admin/view"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        response = requests.get(url, headers=headers)
        print_response("GET /admin/view", response)

    def test_admin_view_post():
        url = f"{base_url}/admin/view"
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        response = requests.post(url, headers=headers)
        print_response("POST /admin/view", response)

    test_admin_check_admin()
    test_admin_delete_comment(1)
    test_admin_edit_comment(1, "Updated comment.")
    test_admin_get_usage_report_txt("2024-07-18")
    test_admin_report("Sample report message.")
    test_admin_time()
    test_admin_view_get()
    test_admin_view_post()

if __name__ == "__main__":
    token = get_access_token(BASE_URL, ZID, PASSWORD)
    if token:
        print(f"Access Token: {token}")
        test_admin_operations(BASE_URL, token)
    else:
        print("Failed to obtain access token.")
