import requests
import json

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_role_based_authentication_and_authorization():
    """
    Verify that role-based authentication and authorization work correctly for Admin, Vendor, and Supplier roles
    using JWT tokens and multi-factor authentication.
    """
    roles = {
        "admin": {"email": "admin_user@example.com", "password": "AdminPass123!"},
        "vendor": {"email": "vendor_user@example.com", "password": "VendorPass123!"},
        "supplier": {"email": "supplier_user@example.com", "password": "SupplierPass123!"}
    }

    def login_and_2fa(role_creds):
        """
        Perform login and 2FA verification.
        Returns JWT token if successful.
        """
        try:
            # Step 1: Login with email and password
            login_resp = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": role_creds["email"],
                    "password": role_creds["password"]
                },
                timeout=TIMEOUT
            )
            assert login_resp.status_code == 200, f"Login failed for {role_creds['email']}"
            login_data = login_resp.json()
            # Expect response to include a temporary token or indication that 2FA is required
            assert "2fa_required" in login_data and login_data["2fa_required"] is True, "2FA should be required"

            temp_token = login_data.get("temp_token")
            assert temp_token, "temp_token missing in login response for 2FA"

            # Step 2: Complete MFA using code (simulate retrieving MFA code)
            # For testing, assume backend accepts a fixed test MFA code "123456"
            mfa_resp = requests.post(
                f"{BASE_URL}/auth/2fa/verify",
                headers={"Authorization": f"Bearer {temp_token}"},
                json={
                    "code": "123456"  # In real scenarios, code is dynamic. Here we simulate.
                },
                timeout=TIMEOUT
            )
            assert mfa_resp.status_code == 200, f"2FA verification failed for {role_creds['email']}"
            mfa_data = mfa_resp.json()

            jwt_token = mfa_data.get("accessToken")
            assert jwt_token, "JWT accessToken missing after 2FA"

            return jwt_token

        except requests.RequestException as e:
            assert False, f"Request failed during login or 2FA: {str(e)}"

    def verify_role_access(jwt_token, role):
        """
        Verify authorization by accessing role-specific endpoints.
        """
        # Define role-specific protected endpoints to verify authorization
        protected_endpoints = {
            "admin": "/admin/dashboard",
            "vendor": "/vendor/dashboard",
            "supplier": "/supplier/dashboard"
        }
        url = f"{BASE_URL}{protected_endpoints[role]}"
        headers = {
            "Authorization": f"Bearer {jwt_token}"
        }
        try:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Authorized access failed for {role} role"
            # Optional: Check common fields in response indicating authorized dashboard data
            data = resp.json()
            assert "dashboardData" in data, f"Dashboard data missing for {role}"
        except requests.RequestException as e:
            assert False, f"Request failed during role access verification for {role}: {str(e)}"

        # Negative test: access other roles' endpoints should be forbidden (403)
        other_roles = set(protected_endpoints.keys()) - {role}
        for other_role in other_roles:
            other_url = f"{BASE_URL}{protected_endpoints[other_role]}"
            try:
                other_resp = requests.get(other_url, headers=headers, timeout=TIMEOUT)
                assert other_resp.status_code == 403 or other_resp.status_code == 401, (
                    f"{role} should not access {other_role} endpoint, but got {other_resp.status_code}"
                )
            except requests.RequestException as e:
                assert False, f"Request failed during unauthorized access check for {role}: {str(e)}"

    # Test for each role
    for role_name, credentials in roles.items():
        token = login_and_2fa(credentials)
        verify_role_access(token, role_name)

    # Negative test: access with no token should get 401
    for url_suffix in ["/admin/dashboard", "/vendor/dashboard", "/supplier/dashboard"]:
        try:
            r = requests.get(f"{BASE_URL}{url_suffix}", timeout=TIMEOUT)
            assert r.status_code == 401, f"Access without token to {url_suffix} should be 401 Unauthorized"
        except requests.RequestException as e:
            assert False, f"Request failed during unauthorized access test without token: {str(e)}"

    # Negative test: access with invalid token should get 401
    invalid_headers = {"Authorization": "Bearer invalid.jwt.token"}
    for url_suffix in ["/admin/dashboard", "/vendor/dashboard", "/supplier/dashboard"]:
        try:
            r = requests.get(f"{BASE_URL}{url_suffix}", headers=invalid_headers, timeout=TIMEOUT)
            assert r.status_code == 401, f"Access with invalid token to {url_suffix} should be 401 Unauthorized"
        except requests.RequestException as e:
            assert False, f"Request failed during invalid token test: {str(e)}"

test_role_based_authentication_and_authorization()
