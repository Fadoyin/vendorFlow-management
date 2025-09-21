import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Assuming credentials for vendor and supplier users exist for testing
VENDOR_AUTH = {"username": "vendoruser", "password": "vendorpass"}
SUPPLIER_AUTH = {"username": "supplieruser", "password": "supplierpass"}

def authenticate_user(auth_payload):
    url = f"{BASE_URL}/auth/login"
    try:
        resp = requests.post(url, json=auth_payload, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        token = data.get("access_token") or data.get("token") or data.get("jwt")
        assert token is not None, "No token received on authentication"
        return token
    except requests.RequestException as e:
        raise AssertionError(f"Authentication request failed: {e}")

def test_order_creation_and_tracking():
    vendor_token = authenticate_user(VENDOR_AUTH)
    supplier_token = authenticate_user(SUPPLIER_AUTH)
    headers_vendor = {"Authorization": f"Bearer {vendor_token}", "Content-Type": "application/json"}
    headers_supplier = {"Authorization": f"Bearer {supplier_token}", "Content-Type": "application/json"}

    order_id = None
    purchase_order_id = None
    try:
        # Step 1: Vendor creates an order
        create_order_url = f"{BASE_URL}/orders"
        order_payload = {
            "vendorId": str(uuid.uuid4()),  # simulate vendor ID
            "supplierId": str(uuid.uuid4()),  # simulate supplier ID
            "items": [
                {"productId": str(uuid.uuid4()), "quantity": 10},
                {"productId": str(uuid.uuid4()), "quantity": 5}
            ],
            "deliveryDate": "2025-10-01T10:00:00Z",
            "notes": "Please deliver between 9am and 12pm"
        }
        resp = requests.post(create_order_url, json=order_payload, headers=headers_vendor, timeout=TIMEOUT)
        resp.raise_for_status()
        order_resp = resp.json()
        order_id = order_resp.get("id") or order_resp.get("_id") or order_resp.get("orderId")
        assert order_id is not None, "Order ID missing from create order response"

        # Step 2: Vendor creates purchase order for the order
        create_po_url = f"{BASE_URL}/purchase-orders"
        po_payload = {
            "orderId": order_id,
            "referenceNumber": f"PO-{uuid.uuid4().hex[:8]}",
            "items": order_payload["items"],
            "status": "pending"
        }
        resp = requests.post(create_po_url, json=po_payload, headers=headers_vendor, timeout=TIMEOUT)
        resp.raise_for_status()
        po_resp = resp.json()
        purchase_order_id = po_resp.get("id") or po_resp.get("_id") or po_resp.get("purchaseOrderId")
        assert purchase_order_id is not None, "Purchase order ID missing from create purchase order response"

        # Step 3: Supplier tracks the order status
        track_url = f"{BASE_URL}/orders/{order_id}/status"
        resp = requests.get(track_url, headers=headers_supplier, timeout=TIMEOUT)
        resp.raise_for_status()
        status_resp = resp.json()
        assert "status" in status_resp, "Order status field missing in tracking response"

        # Step 4: Vendor retrieves order history
        history_url = f"{BASE_URL}/orders/history?vendorId={order_payload['vendorId']}"
        resp = requests.get(history_url, headers=headers_vendor, timeout=TIMEOUT)
        resp.raise_for_status()
        history_resp = resp.json()
        assert isinstance(history_resp, list), "Order history response should be a list"
        assert any(o.get("id") == order_id or o.get("_id") == order_id for o in history_resp), "Created order not found in order history"

        # Step 5: Supplier retrieves order history
        supplier_history_url = f"{BASE_URL}/orders/history?supplierId={order_payload['supplierId']}"
        resp = requests.get(supplier_history_url, headers=headers_supplier, timeout=TIMEOUT)
        resp.raise_for_status()
        supplier_history_resp = resp.json()
        assert isinstance(supplier_history_resp, list), "Supplier order history response should be a list"
        assert any(o.get("id") == order_id or o.get("_id") == order_id for o in supplier_history_resp), "Created order not found in supplier order history"

    finally:
        # Cleanup: Delete purchase order and order if created
        if purchase_order_id:
            try:
                del_po_url = f"{BASE_URL}/purchase-orders/{purchase_order_id}"
                requests.delete(del_po_url, headers=headers_vendor, timeout=TIMEOUT)
            except requests.RequestException:
                pass
        if order_id:
            try:
                del_order_url = f"{BASE_URL}/orders/{order_id}"
                requests.delete(del_order_url, headers=headers_vendor, timeout=TIMEOUT)
            except requests.RequestException:
                pass

test_order_creation_and_tracking()