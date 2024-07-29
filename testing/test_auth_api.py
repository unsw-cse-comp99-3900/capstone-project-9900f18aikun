import requests

#auto_login

def test_login(url, zid, password):
   
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

if __name__ == "__main__":
    base_url = "http://3.26.67.188:5001/auth/login"
    
    # Example login attempt
    zid = "z54322"
    password = "oOEDu"
    
    result = test_login(base_url, zid, password)
    print("Status Code:", result['status_code'])
    print("Response Text:", result['response_text'])
    print("JSON Response:", result['json_response'])
    
    # Check login success and user type
    if result['status_code'] == 200 and result['json_response']:
        access_token = result['json_response'].get('access_token')
        is_admin = result['json_response'].get('is_admin', False)
        
        if access_token:
            print("Login successful.")
            print(f"Access Token: {access_token}")
            print(f"Is Admin: {is_admin}")
        else:
            print("Login failed. No access token received.")
    else:
        print("Login failed. Please check the credentials and try again.")