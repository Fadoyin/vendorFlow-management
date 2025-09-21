import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Assuming we have admin credentials for authentication
ADMIN_AUTH = {
    "username": "admin@example.com",
    "password": "adminpassword123"
}

def get_auth_token(auth_payload):
    login_url = f"{BASE_URL}/auth/login"
    try:
        resp = requests.post(login_url, json=auth_payload, timeout=TIMEOUT)
        resp.raise_for_status()
        json_resp = resp.json()
        return json_resp.get("access_token") or json_resp.get("accessToken") or json_resp.get("token")
    except requests.RequestException as e:
        raise RuntimeError(f"Authentication failed: {e}")


def test_inventory_management_and_stock_level_tracking():
    token = get_auth_token(ADMIN_AUTH)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    inventory_url = f"{BASE_URL}/inventory"
    inventory_item_id = None

    # Create inventory item
    create_payload = {
        "productName": f"Test Product {uuid.uuid4()}",
        "sku": f"SKU-{uuid.uuid4()}",
        "quantity": 100,
        "unit": "kg",
        "location": "Warehouse A",
        "reorderLevel": 20,
        "pricePerUnit": 12.5
    }

    try:
        create_resp = requests.post(inventory_url, json=create_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        created_item = create_resp.json()
        inventory_item_id = created_item.get("id") or created_item.get("_id")
        assert inventory_item_id is not None, "Created inventory item id not returned."

        # Read inventory item
        get_resp = requests.get(f"{inventory_url}/{inventory_item_id}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 OK on GET, got {get_resp.status_code}"
        get_data = get_resp.json()
        for key in create_payload:
            assert key in get_data, f"{key} missing in read data"
            # For numeric and string values, check equality
            if isinstance(create_payload[key], (int, float, str)):
                assert get_data[key] == create_payload[key], f"Value mismatch for {key}"
        
        # Update inventory item (e.g., adjust stock quantity)
        update_payload = {"quantity": 75}
        update_resp = requests.put(f"{inventory_url}/{inventory_item_id}", json=update_payload, headers=headers, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Expected 200 OK on update, got {update_resp.status_code}"
        updated_data = update_resp.json()
        assert updated_data.get("quantity") == 75, "Quantity not updated correctly"

        # Track stock level (GET inventory list with stock levels)
        list_resp = requests.get(inventory_url, headers=headers, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Expected 200 OK on inventory list, got {list_resp.status_code}"
        inventory_list = list_resp.json()
        assert any((item.get("id") == inventory_item_id or item.get("_id") == inventory_item_id) and item.get("quantity") == 75 for item in inventory_list), "Updated inventory item not found in list or quantity mismatch"

        # Real-time inventory report endpoint - assume /inventory/report or /inventory/realtime-report exists
        # We'll test /inventory/report endpoint if available
        report_resp = requests.get(f"{inventory_url}/report", headers=headers, timeout=TIMEOUT)
        assert report_resp.status_code == 200, f"Expected 200 OK from inventory report, got {report_resp.status_code}"
        report_data = report_resp.json()
        # Expect the report to contain the inventory item with correct stock level
        assert any(
            (item.get("id") == inventory_item_id or item.get("_id") == inventory_item_id) and "quantity" in item
            for item in report_data
        ), "Inventory report missing our item or stock quantity"

        # Delete inventory item
        delete_resp = requests.delete(f"{inventory_url}/{inventory_item_id}", headers=headers, timeout=TIMEOUT)
        assert delete_resp.status_code == 204, f"Expected 204 No Content on delete, got {delete_resp.status_code}"

        # Confirm deletion
        confirm_resp = requests.get(f"{inventory_url}/{inventory_item_id}", headers=headers, timeout=TIMEOUT)
        assert confirm_resp.status_code == 404, "Deleted inventory item still accessible"

    except AssertionError:
        raise
    except requests.RequestException as e:
        raise RuntimeError(f"Request failed: {e}")
    finally:
        # Cleanup if the test failed before deletion
        if inventory_item_id:
            try:
                requests.delete(f"{inventory_url}/{inventory_item_id}", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass


test_inventory_management_and_stock_level_tracking()
