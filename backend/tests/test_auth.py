import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_auth_registration_and_login_flow():
    rand_id = uuid.uuid4().hex[:6]
    test_email = f"analyst.{rand_id}@netsage.ai"
    test_password = "SecurePassword123!"
    test_name = f"NetSage Analyst {rand_id}"

    # 1. Register new user
    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": test_name,
        "email": test_email,
        "password": test_password,
    })
    assert reg_resp.status_code == 200, reg_resp.text
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["full_name"] == test_name
    token = reg_data["access_token"]

    # 2. Duplicate registration should be rejected
    dup_resp = client.post("/api/v1/auth/register", json={
        "full_name": test_name,
        "email": test_email,
        "password": test_password,
    })
    assert dup_resp.status_code == 400

    # 3. Login with correct password
    login_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_password,
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == test_email

    # 4. Login with wrong password
    bad_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "WrongPassword999!",
    })
    assert bad_login.status_code == 401

    # 5. Access /auth/me with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == test_email
    assert me_data["full_name"] == test_name

    # 6. Access /auth/me without token
    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401

    # 7. Forgot password request
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={
        "email": test_email,
    })
    assert forgot_resp.status_code == 200
    assert "message" in forgot_resp.json()

def test_copilot_user_isolated_session():
    rand_id = uuid.uuid4().hex[:6]
    test_email = f"copilot.analyst.{rand_id}@netsage.ai"
    test_password = "SecurePassword123!"

    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": "Copilot Test User",
        "email": test_email,
        "password": test_password,
    })
    token = reg_resp.json()["access_token"]

    chat_resp = client.post(
        "/api/v1/copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "What is an anomaly threshold?"}
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert "reply" in data
    assert "conversation_id" in data
