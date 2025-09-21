import requests

BASE_ENDPOINT = "http://localhost:3000"
TIMEOUT = 30

# Replace with valid admin credentials for authentication
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "AdminPass123!"

def test_user_management_crud_operations():
    session = requests.Session()
    try:
        # Authenticate as admin to get JWT token
        auth_resp = session.post(
            f"{BASE_ENDPOINT}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT,
        )
        assert auth_resp.status_code == 200, f"Login failed: {auth_resp.text}"
        token = auth_resp.json().get("access_token")
        assert token, "No access_token returned on login"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # 1. CREATE user
        user_payload = {
            "email": "testuser@example.com",
            "password": "TestUser123!",
            "firstName": "Test",
            "lastName": "User",
            "roles": ["Vendor"]  # example role assignment
        }
        create_resp = session.post(
            f"{BASE_ENDPOINT}/users",
            json=user_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"User creation failed: {create_resp.text}"
        user_data = create_resp.json()
        user_id = user_data.get("id") or user_data.get("_id") or user_data.get("userId")
        assert user_id, "Created user ID not found in response"

        # 2. READ user details
        read_resp = session.get(
            f"{BASE_ENDPOINT}/users/{user_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert read_resp.status_code == 200, f"User read failed: {read_resp.text}"
        read_data = read_resp.json()
        assert read_data.get("email") == user_payload["email"], "Email mismatch on read user"
        assert set(read_data.get("roles", [])) == set(user_payload["roles"]), "Roles mismatch on read user"

        # 3. UPDATE user - change last name and roles
        update_payload = {
            "lastName": "UserUpdated",
            "roles": ["Admin", "Vendor"]
        }
        update_resp = session.put(
            f"{BASE_ENDPOINT}/users/{user_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert update_resp.status_code == 200, f"User update failed: {update_resp.text}"
        updated_data = update_resp.json()
        assert updated_data.get("lastName") == update_payload["lastName"], "Last name not updated"
        assert set(updated_data.get("roles", [])) == set(update_payload["roles"]), "Roles not updated"

        # 4. DELETE user
        delete_resp = session.delete(
            f"{BASE_ENDPOINT}/users/{user_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert delete_resp.status_code == 204, f"User deletion failed: {delete_resp.text}"

        # Verify deletion by attempting to read deleted user
        verify_del_resp = session.get(
            f"{BASE_ENDPOINT}/users/{user_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert verify_del_resp.status_code == 404 or verify_del_resp.status_code == 401, "Deleted user still accessible"

    finally:
        # Cleanup in case deletion did not succeed
        try:
            session.delete(f"{BASE_ENDPOINT}/users/{user_id}", headers=headers, timeout=TIMEOUT)
        except:
            pass

test_user_management_crud_operations()