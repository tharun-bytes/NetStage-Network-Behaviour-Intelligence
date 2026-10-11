import datetime
import hashlib
import json
import logging
import os
import secrets
import uuid
from pathlib import Path
from typing import Any, Optional
import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr

from backend.app.config import settings

logger = logging.getLogger("netsage.auth")

USERS_FILE = settings.USERS_FILE

class UserRecord(BaseModel):
    user_id: str
    email: str
    full_name: str
    auth_provider: str = "password"  # 'google' or 'password'
    google_id: Optional[str] = None
    picture: Optional[str] = None
    password_hash: Optional[str] = None
    created_at: str
    last_login_at: str

def _seed_demo_accounts(users: dict[str, dict[str, Any]]) -> bool:
    """Ensure standard demo analyst accounts exist for immediate one-click testing."""
    changed = False
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    demo_accounts = [
        ("usr_demo_lead", "analyst.demo@netsage.ai", "Security Lead (Demo)", "DemoAnalyst2026!"),
        ("usr_demo_local", "analyst@netsage.local", "NetSage Analyst", "DemoPassword123!"),
    ]
    for uid, email, name, pwd in demo_accounts:
        existing = any(u.get("email") == email for u in users.values())
        if not existing:
            users[uid] = {
                "user_id": uid,
                "email": email,
                "full_name": name,
                "auth_provider": "password",
                "password_hash": hash_password(pwd),
                "picture": None,
                "created_at": now_str,
                "last_login_at": now_str,
            }
            changed = True
    return changed

def load_users() -> dict[str, dict[str, Any]]:
    """Load user registry from persistent data store."""
    users = {}
    if USERS_FILE.exists():
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                users = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load users: {e}")
            users = {}
            
    if _seed_demo_accounts(users):
        save_users(users)
        
    return users

def save_users(users: dict[str, dict[str, Any]]) -> None:
    """Save user registry to persistent data store."""
    try:
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save users: {e}")

def hash_password(password: str) -> str:
    """Hash password with PBKDF2-HMAC-SHA256 and unique salt."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}:{pwd_hash}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify plain password against stored salt:hash."""
    try:
        salt, pwd_hash = stored_hash.split(":")
        check_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
        return secrets.compare_digest(pwd_hash, check_hash)
    except Exception:
        return False

def create_access_token(data: dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate signed JWT access token."""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.PyJWTError as e:
        logger.warning(f"Invalid token: {e}")
        return None

async def verify_google_credential(credential: str) -> Optional[dict[str, Any]]:
    """
    Verify Google OAuth ID token with Google's public tokeninfo endpoint.
    Extracts authenticated email, name, sub (Google ID), and picture safely.
    """
    if not credential:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential}
            )
            if resp.status_code != 200:
                logger.warning(f"Google tokeninfo error: {resp.text}")
                return None
            info = resp.json()
            if not info.get("email") or not info.get("sub"):
                return None
            return {
                "google_id": info["sub"],
                "email": info["email"].lower().strip(),
                "name": info.get("name", info["email"].split("@")[0]),
                "picture": info.get("picture"),
                "email_verified": info.get("email_verified") in [True, "true", "True"],
            }
    except Exception as e:
        logger.error(f"Google authentication request failed: {e}")
        return None

def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict[str, Any]]:
    """Extract authenticated user if bearer token is present; returns None if unauthenticated."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        return None
    users = load_users()
    user_id = payload.get("sub")
    if user_id and user_id in users:
        u = users[user_id]
        return {
            "user_id": u["user_id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "auth_provider": u.get("auth_provider", "password"),
            "picture": u.get("picture"),
        }
    return None

def get_current_user(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
    """Enforce authenticated user token on protected endpoints."""
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
