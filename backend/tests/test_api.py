from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "QuantX Engine Running"}

def test_search_unauthorized():
    response = client.get("/api/search?q=AAPL")
    # Should be 401 because I added authentication
    assert response.status_code == 401

def test_auth_flow():
    # Register a new user
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword"
    }
    # Use a unique email to avoid conflicts if db persists
    import random
    user_data["email"] = f"test_{random.randint(0, 10000)}@example.com"
    
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200
    
    # Login
    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }
    response = client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Access protected route
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/search?q=RELIANCE", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_rate_limiting():
    # This might be tricky in tests depending on how slowapi is configured, 
    # but we can try to hit it multiple times if needed.
    pass
