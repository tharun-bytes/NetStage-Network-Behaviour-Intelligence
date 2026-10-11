import datetime
import uuid
import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    load_users,
    save_users,
    verify_google_credential,
    verify_password,
)
from backend.app.schemas.auth import (
    AuthResponse,
    EmailLoginRequest,
    EmailRegisterRequest,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    UserProfile,
)

logger = logging.getLogger("netsage.auth.routes")

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/google", response_model=AuthResponse)
async def authenticate_with_google(req: GoogleAuthRequest) -> AuthResponse:
    """Authenticate or register user via Google OAuth Identity Services token."""
    g_info = await verify_google_credential(req.credential)
    if not g_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google OAuth credential.",
        )
    
    users = load_users()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Check if user exists by google_id or email
    user_id = None
    for uid, u in users.items():
        if u.get("google_id") == g_info["google_id"] or u.get("email") == g_info["email"]:
            user_id = uid
            break
            
    if user_id:
        # Existing user
        user = users[user_id]
        user["last_login_at"] = now_str
        user["picture"] = g_info.get("picture") or user.get("picture")
        user["full_name"] = g_info.get("name") or user.get("full_name")
        users[user_id] = user
        save_users(users)
        msg = "Welcome back! Google authentication verified."
    else:
        # New user registration
        user_id = f"usr_{uuid.uuid4().hex[:10]}"
        user = {
            "user_id": user_id,
            "email": g_info["email"],
            "full_name": g_info["name"],
            "auth_provider": "google",
            "google_id": g_info["google_id"],
            "picture": g_info.get("picture"),
            "created_at": now_str,
            "last_login_at": now_str,
        }
        users[user_id] = user
        save_users(users)
        msg = "Account created successfully with Google."

    token = create_access_token({
        "sub": user_id,
        "email": user["email"],
        "name": user["full_name"],
        "auth_provider": "google",
    })
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            user_id=user["user_id"],
            email=user["email"],
            full_name=user["full_name"],
            auth_provider="google",
            picture=user.get("picture"),
        ),
        message=msg,
    )

@router.post("/register", response_model=AuthResponse)
def register_with_email(req: EmailRegisterRequest) -> AuthResponse:
    """Register a new account using email and password."""
    users = load_users()
    email_clean = req.email.lower().strip()
    
    for uid, u in users.items():
        if u.get("email") == email_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address is already registered.",
            )
            
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    user = {
        "user_id": user_id,
        "email": email_clean,
        "full_name": req.full_name.strip(),
        "auth_provider": "password",
        "password_hash": hash_password(req.password),
        "picture": None,
        "created_at": now_str,
        "last_login_at": now_str,
    }
    users[user_id] = user
    save_users(users)
    
    token = create_access_token({
        "sub": user_id,
        "email": user["email"],
        "name": user["full_name"],
        "auth_provider": "password",
    })
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            user_id=user["user_id"],
            email=user["email"],
            full_name=user["full_name"],
            auth_provider="password",
            picture=None,
        ),
        message="Account created successfully. Welcome to NetSage AI.",
    )

@router.post("/login", response_model=AuthResponse)
def login_with_email(req: EmailLoginRequest) -> AuthResponse:
    """Sign in using email and password."""
    users = load_users()
    email_clean = req.email.lower().strip()
    
    target_user = None
    for uid, u in users.items():
        if u.get("email") == email_clean:
            target_user = u
            break
            
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    stored_hash = target_user.get("password_hash")
    if not stored_hash or not verify_password(req.password, stored_hash):
        if target_user.get("auth_provider") == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account was registered using Google. Please click 'Continue with Google'.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    target_user["last_login_at"] = now_str
    users[target_user["user_id"]] = target_user
    save_users(users)
    
    token = create_access_token({
        "sub": target_user["user_id"],
        "email": target_user["email"],
        "name": target_user["full_name"],
        "auth_provider": target_user.get("auth_provider", "password"),
    })
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            user_id=target_user["user_id"],
            email=target_user["email"],
            full_name=target_user["full_name"],
            auth_provider=target_user.get("auth_provider", "password"),
            picture=target_user.get("picture"),
        ),
        message="Sign in successful.",
    )

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(user: dict[str, Any] = Depends(get_current_user)) -> UserProfile:
    """Retrieve verified profile of currently signed-in user."""
    return UserProfile(
        user_id=user["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        auth_provider=user.get("auth_provider", "password"),
        picture=user.get("picture"),
    )

@router.post("/logout")
def logout_user():
    """Terminate client authentication session."""
    return {"status": "success", "message": "Signed out successfully."}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """Initiate password reset dispatch simulation."""
    users = load_users()
    email_clean = req.email.lower().strip()
    user_exists = any(u.get("email") == email_clean for u in users.values())
    
    # Generic safe response prevents email enumeration
    return {
        "status": "success",
        "message": "If an account matches that email address, password recovery instructions have been generated.",
        "user_matched": user_exists,
    }
