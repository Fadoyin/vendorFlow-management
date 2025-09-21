import requests
import time

BASE_URL = "http://localhost:3000"
ML_SERVICE_URL = "http://localhost:8000"
TIMEOUT = 30

ADMIN_CREDENTIALS = {
    "username": "admin_user",
    "password": "admin_password"
}

def get_jwt_token():
    # Login as admin to get JWT token with 2FA assumed bypass or mocked here
    login_url = f"{BASE_URL}/auth/login"
    resp = requests.post(login_url, json=ADMIN_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    assert "access_token" in data, "No access_token in login response"
    return data["access_token"]

def create_test_forecast_request(token):
    url = f"{ML_SERVICE_URL}/forecast"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    # Example payload to request forecasting for demand, inventory, and cost
    payload = {
        "vendor_id": "test_vendor_123",
        "product_id": "test_product_456",
        "forecast_horizon_days": 30,
        "metrics": ["demand", "inventory", "cost"]
    }
    return url, headers, payload

def test_ml_forecasting_and_aws_forecast_integration():
    token = get_jwt_token()

    # Step 1: Request ML forecasting predictions from ML service
    url, headers, payload = create_test_forecast_request(token)
    ml_resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    assert ml_resp.status_code == 200, f"ML forecasting request failed: {ml_resp.text}"
    ml_data = ml_resp.json()

    # Validate response structure and content
    for metric in ["demand", "inventory", "cost"]:
        assert metric in ml_data, f"Missing {metric} forecast in ML response"
        values = ml_data[metric]
        assert isinstance(values, list), f"{metric} forecast should be a list"
        assert len(values) > 0, f"{metric} forecast list empty"
        for forecast_point in values:
            assert "date" in forecast_point and "value" in forecast_point, f"Invalid forecast point in {metric}"
            assert isinstance(forecast_point["value"], (int, float)), f"Forecast value for {metric} must be numeric"

    # Step 2: Validate integration with AWS Forecast via backend API
    # Assume backend exposes an endpoint to fetch AWS Forecast results for the same vendor/product
    backend_forecast_url = f"{BASE_URL}/api/forecasts/aws"
    backend_headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "vendor_id": "test_vendor_123",
        "product_id": "test_product_456"
    }
    aws_resp = requests.get(backend_forecast_url, headers=backend_headers, params=params, timeout=TIMEOUT)
    assert aws_resp.status_code == 200, f"AWS Forecast integration API failed: {aws_resp.text}"
    aws_data = aws_resp.json()

    # Validate AWS Forecast data has expected structure and aligns with ML forecasting
    for metric in ["demand", "inventory", "cost"]:
        assert metric in aws_data, f"Missing {metric} forecast in AWS Forecast response"
        aws_values = aws_data[metric]
        ml_values = ml_data[metric]
        assert isinstance(aws_values, list), f"{metric} AWS forecast should be a list"
        assert len(aws_values) == len(ml_values), f"Forecast length mismatch for {metric}"

        # Compare values closely to ensure integration correctness (within reasonable tolerance)
        for aws_point, ml_point in zip(aws_values, ml_values):
            assert aws_point["date"] == ml_point["date"], f"Date mismatch in {metric} forecast"
            aws_val = aws_point["value"]
            ml_val = ml_point["value"]
            assert isinstance(aws_val, (int, float)) and isinstance(ml_val, (int, float))
            diff = abs(aws_val - ml_val)
            tolerance = max(abs(ml_val)*0.1, 1e-3)  # Allow 10% difference or small epsilon
            assert diff <= tolerance, f"{metric} forecast discrepancy too high: ML={ml_val}, AWS={aws_val}"

    # Step 3: Validate response time under 2 seconds for ML service (performance check)
    start_time = time.time()
    perf_resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    elapsed = time.time() - start_time
    assert perf_resp.status_code == 200, f"ML forecasting request failed: {perf_resp.text}"
    assert elapsed <= 2, f"ML forecasting response time exceeded: {elapsed:.2f}s"

test_ml_forecasting_and_aws_forecast_integration()