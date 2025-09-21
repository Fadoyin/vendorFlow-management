import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_vendor_and_supplier_registration_and_profile_management():
    # Admin credentials for authentication
    admin_auth = {
        "username": "admin_user",
        "password": "admin_password"
    }
    headers = {"Content-Type": "application/json"}
    try:
        # 1. Admin login to get JWT token
        login_resp = requests.post(
            f"{BASE_URL}/auth/login",
            json=admin_auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        token = login_resp.json().get("access_token")
        assert token, "No access_token received"
        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Register Vendor
        vendor_data = {
            "name": "Test Vendor Inc",
            "email": "testvendor@example.com",
            "contact_number": "+15555550123",
            "address": "123 Vendor St, Vendor City",
            "tax_id": "VENDORTAX123",
            "role": "vendor",
            "password": "VendorPass!23"
        }
        vendor_reg_resp = requests.post(
            f"{BASE_URL}/vendors",
            json=vendor_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert vendor_reg_resp.status_code == 201, f"Vendor registration failed: {vendor_reg_resp.text}"
        vendor_id = vendor_reg_resp.json().get("id")
        assert vendor_id, "Vendor ID missing in registration response"

        # 3. Register Supplier
        supplier_data = {
            "name": "Test Supplier LLC",
            "email": "testsupplier@example.com",
            "contact_number": "+15555550456",
            "address": "456 Supplier Ave, Supplier City",
            "tax_id": "SUPPLIERTAX456",
            "role": "supplier",
            "password": "SupplierPass!45"
        }
        supplier_reg_resp = requests.post(
            f"{BASE_URL}/suppliers",
            json=supplier_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert supplier_reg_resp.status_code == 201, f"Supplier registration failed: {supplier_reg_resp.text}"
        supplier_id = supplier_reg_resp.json().get("id")
        assert supplier_id, "Supplier ID missing in registration response"

        # 4. Update Vendor profile
        vendor_update_data = {
            "contact_number": "+15555559999",
            "address": "999 Updated Vendor Blvd, Vendor City",
            "profile_description": "Updated vendor profile description"
        }
        vendor_update_resp = requests.put(
            f"{BASE_URL}/vendors/{vendor_id}/profile",
            json=vendor_update_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert vendor_update_resp.status_code == 200, f"Vendor profile update failed: {vendor_update_resp.text}"
        updated_vendor = vendor_update_resp.json()
        assert updated_vendor.get("contact_number") == vendor_update_data["contact_number"]
        assert updated_vendor.get("address") == vendor_update_data["address"]
        assert updated_vendor.get("profile_description") == vendor_update_data["profile_description"]

        # 5. Update Supplier profile
        supplier_update_data = {
            "contact_number": "+15555558888",
            "address": "888 Updated Supplier Rd, Supplier City",
            "profile_description": "Updated supplier profile description"
        }
        supplier_update_resp = requests.put(
            f"{BASE_URL}/suppliers/{supplier_id}/profile",
            json=supplier_update_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert supplier_update_resp.status_code == 200, f"Supplier profile update failed: {supplier_update_resp.text}"
        updated_supplier = supplier_update_resp.json()
        assert updated_supplier.get("contact_number") == supplier_update_data["contact_number"]
        assert updated_supplier.get("address") == supplier_update_data["address"]
        assert updated_supplier.get("profile_description") == supplier_update_data["profile_description"]

        # 6. Create a contract for Vendor
        contract_data = {
            "vendor_id": vendor_id,
            "contract_title": "Supply Agreement 2025",
            "contract_details": "Annual supply agreement for raw materials",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "terms": "Standard terms apply."
        }
        contract_resp = requests.post(
            f"{BASE_URL}/vendors/{vendor_id}/contracts",
            json=contract_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert contract_resp.status_code == 201, f"Contract creation failed: {contract_resp.text}"
        contract_id = contract_resp.json().get("id")
        assert contract_id, "Contract ID missing in response"

        # 7. Link Vendor and Supplier relationship
        link_data = {
            "vendor_id": vendor_id,
            "supplier_id": supplier_id,
            "relationship_type": "preferred_supplier"
        }
        link_resp = requests.post(
            f"{BASE_URL}/vendor-supplier-links",
            json=link_data,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert link_resp.status_code == 201, f"Vendor-Supplier linking failed: {link_resp.text}"
        link_id = link_resp.json().get("id")
        assert link_id, "Link ID missing after linking vendor and supplier"

        # 8. Retrieve Vendor-Supplier links to verify association
        links_list_resp = requests.get(
            f"{BASE_URL}/vendors/{vendor_id}/suppliers",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert links_list_resp.status_code == 200, f"Fetching linked suppliers failed: {links_list_resp.text}"
        linked_suppliers = links_list_resp.json()
        assert any(s.get("id") == supplier_id for s in linked_suppliers), "Supplier not found linked to vendor"

    finally:
        # Cleanup: Delete created vendor, supplier, contract, and link if they exist
        if 'link_id' in locals():
            requests.delete(
                f"{BASE_URL}/vendor-supplier-links/{link_id}",
                headers=auth_headers,
                timeout=TIMEOUT
            )
        if 'contract_id' in locals():
            requests.delete(
                f"{BASE_URL}/vendors/{vendor_id}/contracts/{contract_id}",
                headers=auth_headers,
                timeout=TIMEOUT
            )
        if 'vendor_id' in locals():
            requests.delete(
                f"{BASE_URL}/vendors/{vendor_id}",
                headers=auth_headers,
                timeout=TIMEOUT
            )
        if 'supplier_id' in locals():
            requests.delete(
                f"{BASE_URL}/suppliers/{supplier_id}",
                headers=auth_headers,
                timeout=TIMEOUT
            )

test_vendor_and_supplier_registration_and_profile_management()