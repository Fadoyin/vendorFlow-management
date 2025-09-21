import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_stripe_payment_processing_and_subscription_management():
    # Step 1: Create a new supplier user (simulate registration)
    supplier_email = f"supplier_{uuid.uuid4().hex[:8]}@example.com"
    supplier_password = "TestPass123!"
    headers = {"Content-Type": "application/json"}

    # Create supplier via supplier management API
    create_supplier_url = f"{BASE_URL}/suppliers"
    supplier_payload = {
        "email": supplier_email,
        "password": supplier_password,
        "companyName": f"SupplierCo {uuid.uuid4().hex[:6]}",
        "contactName": "Test Supplier",
        "phone": "+1234567890",
        "address": "123 Supplier St, Supplier City"
    }
    resp = requests.post(create_supplier_url, json=supplier_payload, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 201, f"Supplier creation failed: {resp.text}"
    supplier_data = resp.json()
    supplier_id = supplier_data.get("id")
    assert supplier_id is not None, "Supplier ID missing in creation response"

    try:
        # Login with created supplier
        login_url = f"{BASE_URL}/auth/login"
        login_payload = {"email": supplier_email, "password": supplier_password}
        resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        login_response = resp.json()
        token = login_response.get("access_token")
        assert token, "JWT token missing in login response"
        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Step 2: Retrieve available subscription plans to select one
        plans_url = f"{BASE_URL}/subscriptions/plans"
        resp = requests.get(plans_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Fetching subscription plans failed: {resp.text}"
        plans = resp.json()
        assert isinstance(plans, list) and len(plans) > 0, "No subscription plans available"
        plan = plans[0]
        plan_id = plan.get("id")
        assert plan_id, "Subscription plan id missing"

        # Step 3: Create a payment method token via Stripe API simulation (mock or assume token)
        stripe_test_token = "tok_visa"

        # Step 4: Process subscription payment and activate subscription plan for supplier
        subscribe_url = f"{BASE_URL}/subscriptions/subscribe"
        subscription_payload = {
            "supplierId": supplier_id,
            "planId": plan_id,
            "paymentToken": stripe_test_token
        }
        resp = requests.post(subscribe_url, json=subscription_payload, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Subscription payment failed: {resp.text}"
        subscription_response = resp.json()
        subscription_id = subscription_response.get("id")
        assert subscription_id, "Subscription id missing in response"
        assert subscription_response.get("status") == "active", f"Subscription is not active: {subscription_response}"

        # Step 5: Retrieve payment history for the supplier and validate new payment record presence
        payments_url = f"{BASE_URL}/payments/history?supplierId={supplier_id}"
        resp = requests.get(payments_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Fetching payment history failed: {resp.text}"
        payment_history = resp.json()
        assert isinstance(payment_history, list), "Payment history is not a list"
        found_payment = any(
            p.get("subscriptionId") == subscription_id and p.get("status") == "succeeded"
            for p in payment_history
        )
        assert found_payment, "Successful payment record not found in payment history"

        # Step 6: Validate subscription is listed in supplier profile/subscription endpoint
        supplier_subscription_url = f"{BASE_URL}/suppliers/{supplier_id}/subscription"
        resp = requests.get(supplier_subscription_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Fetching supplier subscription failed: {resp.text}"
        supplier_subscription = resp.json()
        assert supplier_subscription.get("id") == subscription_id, "Fetched subscription does not match"
        assert supplier_subscription.get("status") == "active", "Supplier subscription is not active"

    finally:
        # Cleanup: delete supplier to keep test idempotent
        delete_supplier_url = f"{BASE_URL}/suppliers/{supplier_id}"
        # Use admin token or bypass auth if possible; here we try with supplier token and expect failure (401 or 403).
        # So skip try deletion via auth here and just log if needed.
        requests.delete(delete_supplier_url, headers=auth_headers, timeout=TIMEOUT)


test_stripe_payment_processing_and_subscription_management()
