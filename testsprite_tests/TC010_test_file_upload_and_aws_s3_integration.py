import requests
from requests.exceptions import RequestException
import os

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Assuming existence of environment variables for authentication
AUTH_URL = f"{BASE_URL}/auth/login"
FILE_UPLOAD_URL = f"{BASE_URL}/files/upload"
FILE_DELETE_URL = f"{BASE_URL}/files"  # Assuming DELETE at /files/{file_id}
HEADERS = {"Accept": "application/json"}

# Dummy admin credentials (should be replaced with valid test credentials)
ADMIN_CREDENTIALS = {
    "username": "admin@test.com",
    "password": "SecurePass123!"
}

def test_file_upload_and_aws_s3_integration():
    token = None
    uploaded_file_id = None
    try:
        # Step 1: Authenticate to get JWT token
        auth_resp = requests.post(AUTH_URL, json=ADMIN_CREDENTIALS, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Authentication failed: {auth_resp.status_code}, {auth_resp.text}"
        auth_data = auth_resp.json()
        assert "access_token" in auth_data, "No access_token in auth response"
        token = auth_data["access_token"]

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Step 2: Prepare file for upload
        test_file_path = "test_upload_file.txt"
        file_content = b"VendorFlow Management test upload file content for AWS S3 integration."
        with open(test_file_path, "wb") as f:
            f.write(file_content)

        with open(test_file_path, 'rb') as f:
            files = {
                "file": ("test_upload_file.txt", f, "text/plain")
            }
            upload_resp = requests.post(FILE_UPLOAD_URL, headers=headers, files=files, timeout=TIMEOUT)

        # Clean up local test file
        os.remove(test_file_path)

        # Step 3: Validate upload response
        assert upload_resp.status_code == 201, f"File upload failed: {upload_resp.status_code}, {upload_resp.text}"
        upload_data = upload_resp.json()
        assert "file_id" in upload_data, "No file_id returned after upload"
        assert "aws_s3_url" in upload_data, "No aws_s3_url returned after upload"
        uploaded_file_id = upload_data["file_id"]
        s3_url = upload_data["aws_s3_url"]

        # Step 4: Validate that the file is accessible on aws_s3_url (HEAD request)
        s3_head_resp = requests.head(s3_url, timeout=TIMEOUT)
        assert s3_head_resp.status_code == 200, f"AWS S3 file not accessible at {s3_url}"

        # Step 5: Optionally verify backend file processing status if endpoint exists
        # Assuming GET /files/{file_id}/status returns processing status
        file_status_url = f"{FILE_DELETE_URL}/{uploaded_file_id}/status"
        status_resp = requests.get(file_status_url, headers=headers, timeout=TIMEOUT)
        assert status_resp.status_code == 200, f"Failed to get file processing status: {status_resp.status_code}, {status_resp.text}"
        status_data = status_resp.json()
        assert "processing_status" in status_data, "No processing_status in file status response"
        assert status_data["processing_status"] in ["processed", "completed"], f"Unexpected processing_status: {status_data['processing_status']}"

    except RequestException as e:
        assert False, f"Request failed: {str(e)}"
    finally:
        # Cleanup: delete the uploaded file resource from backend and S3
        if uploaded_file_id and token:
            try:
                headers = {
                    "Authorization": f"Bearer {token}"
                }
                del_resp = requests.delete(f"{FILE_DELETE_URL}/{uploaded_file_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in [200, 204], f"Failed to delete uploaded file: {del_resp.status_code}, {del_resp.text}"
            except Exception:
                pass

test_file_upload_and_aws_s3_integration()