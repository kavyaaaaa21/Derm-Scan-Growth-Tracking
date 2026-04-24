"""
auth.py
JWT-based authentication for DermScan.
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Literal, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
 
from database import get_db, User

DEFAULT_JWT_SECRET = "dermscan-dev-secret-change-in-production"
 
# ── Config ────────────────────────────────────────────────────────
SECRET_KEY      = os.getenv("JWT_SECRET", "").strip()
ALGORITHM       = "HS256"
ACCESS_EXPIRE   = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
 
pwd_ctx         = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme   = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

if not SECRET_KEY or SECRET_KEY == DEFAULT_JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET must be set to a strong unique value before starting the API."
    )
 
 
# ── Schemas ───────────────────────────────────────────────────────
 
class RegisterRequest(BaseModel):
    email:    EmailStr
    name:     str
    password: str
    role:     Literal["clinician", "researcher"] = "clinician"


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str
 
 
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    name:         str
    email:        str
    role:         str
 
 
class UserOut(BaseModel):
    id:         str
    email:      str
    name:       str
    role:       str
    created_at: datetime
 
    class Config:
        from_attributes = True
 
 
# ── Helpers ───────────────────────────────────────────────────────
 
def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)
 
 
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)
 
 
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_EXPIRE))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
 
 
def get_current_user(
    token: str       = Depends(oauth2_scheme),
    db:    Session   = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail      = "Invalid or expired token",
        headers     = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
 
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exc
    return user
 
 
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
 
 
# ── Router factory (imported by main.py) ─────────────────────────
 
from fastapi import APIRouter
 
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])
 
 
@auth_router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
 
    user = User(
        id        = str(uuid.uuid4()),
        email     = req.email,
        name      = req.name,
        hashed_pw = hash_password(req.password),
        role      = req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
 
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token = token,
        user_id      = user.id,
        name         = user.name,
        email        = user.email,
        role         = user.role,
    )
 
 
@auth_router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid email or password")
 
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token = token,
        user_id      = user.id,
        name         = user.name,
        email        = user.email,
        role         = user.role,
    )
 
 
@auth_router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
 
