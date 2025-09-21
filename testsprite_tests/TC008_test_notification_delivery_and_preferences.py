import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials for an existing test user who has notification preferences - Admin role assumed
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def authenticate_user(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json().get("accessToken")

def get_notification_preferences(token):
    url = f"{BASE_URL}/notifications/preferences"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def update_notification_preferences(token, preferences):
    url = f"{BASE_URL}/notifications/preferences"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.put(url, json=preferences, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def trigger_notification(token, notification_type, message):
    url = f"{BASE_URL}/notifications/send"
    payload = {
        "type": notification_type,
        "message": message
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    return response

def get_system_notifications(token):
    url = f"{BASE_URL}/notifications/system"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def test_notification_delivery_and_preferences():
    # Authenticate test user and get JWT token
    token = authenticate_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    assert token is not None and len(token) > 0

    # Get current notification preferences
    current_prefs = get_notification_preferences(token)
    assert isinstance(current_prefs, dict)

    # Save original prefs to restore later
    original_prefs = current_prefs.copy()

    try:
        # Update preferences to disable email notifications and enable system notifications
        new_prefs = {
            "email_notifications": False,
            "system_notifications": True,
            "email_frequency": "immediate",       # Should not matter since email disabled
            "system_alert_level": "all"            # Receiving all system alerts
        }
        update_resp = update_notification_preferences(token, new_prefs)
        assert update_resp.get("email_notifications") == new_prefs["email_notifications"]
        assert update_resp.get("system_notifications") == new_prefs["system_notifications"]

        # Trigger an email notification - should NOT send email due to preference but accept request
        email_resp = trigger_notification(token, "email", "Test email notification respecting preferences.")
        assert email_resp.status_code == 202 or email_resp.status_code == 200

        # Trigger a system notification - should be delivered
        system_resp = trigger_notification(token, "system", "Test system notification respecting preferences.")
        assert system_resp.status_code == 202 or system_resp.status_code == 200

        # Allow some time for notifications to be processed
        time.sleep(2)

        # Fetch system notifications for the user and confirm presence of the new test notification
        system_notifications = get_system_notifications(token)
        assert any("Test system notification respecting preferences." in n.get("message", "") for n in system_notifications)

        # Since email notifications are disabled, check that email notification is not present in system notifications
        # (Assuming email notifications also appear in system notifications as fallback or logs if sent)
        assert not any("Test email notification respecting preferences." in n.get("message", "") for n in system_notifications)

    finally:
        # Restore original preferences to avoid side effects on later tests
        update_notification_preferences(token, original_prefs)

test_notification_delivery_and_preferences()