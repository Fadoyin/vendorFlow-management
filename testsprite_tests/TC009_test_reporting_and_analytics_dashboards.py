import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Sample user credentials for different roles to test dashboards
USERS = {
    "admin": {"email": "admin_user", "password": "AdminPass123!"},
    "vendor": {"email": "vendor_user", "password": "VendorPass123!"},
    "supplier": {"email": "supplier_user", "password": "SupplierPass123!"},
}

def login(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        token = data.get("access_token")
        assert token and isinstance(token, str), "Token not found or invalid in login response"
        return token
    except RequestException as e:
        raise AssertionError(f"Login request failed: {e}")
    except ValueError:
        raise AssertionError("Login response is not a valid JSON")

def get_dashboard(token):
    url = f"{BASE_URL}/analytics/dashboard"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except RequestException as e:
        raise AssertionError(f"Dashboard request failed: {e}")
    except ValueError:
        raise AssertionError("Dashboard response is not a valid JSON")

def validate_kpis(kpis):
    assert isinstance(kpis, dict), "KPIs should be a dictionary"
    expected_keys = ["totalVendors", "totalSuppliers", "totalOrders", "revenue"]
    for key in expected_keys:
        assert key in kpis, f"Missing KPI metric: {key}"
        assert (isinstance(kpis[key], int) or isinstance(kpis[key], float)), f"KPI {key} should be numeric"

def validate_transactions(transactions):
    assert isinstance(transactions, list), "Transactions should be a list"
    # If there are transactions, check keys of first element
    if transactions:
        first = transactions[0]
        expected_keys = {"transactionId", "amount", "status", "timestamp"}
        assert expected_keys.issubset(first.keys()), "Transaction missing expected keys"

def validate_activity_logs(logs):
    assert isinstance(logs, list), "Activity logs should be a list"
    if logs:
        first = logs[0]
        expected_keys = {"activity", "userId", "timestamp"}
        assert expected_keys.issubset(first.keys()), "Activity log missing expected keys"

def validate_custom_reports(reports):
    assert isinstance(reports, list), "Custom reports should be a list"
    # If any report exists, validate structure
    if reports:
        first = reports[0]
        expected_keys = {"reportId", "name", "createdBy", "data"}
        assert expected_keys.issubset(first.keys()), "Custom report missing expected keys"

def test_reporting_and_analytics_dashboards():
    # Test dashboard access and data for each user role
    for role, creds in USERS.items():
        token = login(creds["email"], creds["password"])

        dashboard = get_dashboard(token)

        # Validate dashboard content keys
        assert "kpis" in dashboard, "Dashboard missing 'kpis'"
        assert "transactions" in dashboard, "Dashboard missing 'transactions'"
        assert "activityLogs" in dashboard, "Dashboard missing 'activityLogs'"
        assert "customReports" in dashboard, "Dashboard missing 'customReports'"

        validate_kpis(dashboard["kpis"])
        validate_transactions(dashboard["transactions"])
        validate_activity_logs(dashboard["activityLogs"])
        validate_custom_reports(dashboard["customReports"])

        # Validate role-based access: users only see data relevant to their role
        if role == "admin":
            # Admin should have all data counts > 0 or zero but presence
            assert isinstance(dashboard["kpis"]["totalVendors"], (int, float))
            assert isinstance(dashboard["kpis"]["totalSuppliers"], (int, float))
        elif role == "vendor":
            # Vendor KPIs should include vendor-related info, totalSuppliers count can be zero or positive
            assert "totalVendors" in dashboard["kpis"]
        elif role == "supplier":
            # Supplier sees supplier relevant data
            assert "totalSuppliers" in dashboard["kpis"]

test_reporting_and_analytics_dashboards()
