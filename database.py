"""
database.py
SQLAlchemy models + async engine for PostgreSQL.
Falls back to SQLite for local development when DATABASE_URL is not set.
"""


import os
from datetime import datetime
 
from sqlalchemy import (
    create_engine, Column, String, Float, Boolean,
    DateTime, Integer, Text, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
 
# ── Connection ────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./dermscan.db"   # local dev fallback
)
 
# SQLite needs check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
 
engine       = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()
 
 
# ── Models ────────────────────────────────────────────────────────
 
class User(Base):
    __tablename__ = "users"
 
    id            = Column(String, primary_key=True)          # uuid
    email         = Column(String, unique=True, nullable=False, index=True)
    name          = Column(String, nullable=False)
    hashed_pw     = Column(String, nullable=False)
    role          = Column(String, default="clinician")        # clinician | researcher | admin
    created_at    = Column(DateTime, default=datetime.utcnow)
 
    patients      = relationship("Patient", back_populates="owner",
                                 cascade="all, delete-orphan")
 
 
class Patient(Base):
    __tablename__ = "patients"
 
    id            = Column(String, primary_key=True)           # e.g. PAT-001
    owner_id      = Column(String, ForeignKey("users.id"), nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
 
    owner         = relationship("User",  back_populates="patients")
    visits        = relationship("Visit", back_populates="patient",
                                 order_by="Visit.visit_date",
                                 cascade="all, delete-orphan")
 
 
class Visit(Base):
    __tablename__ = "visits"
 
    id              = Column(Integer, primary_key=True, autoincrement=True)
    patient_id      = Column(String, ForeignKey("patients.id"), nullable=False)
    visit_date      = Column(String, nullable=False)           # ISO date string
 
    # AI prediction
    prediction      = Column(String)
    confidence      = Column(Float)
    probability     = Column(Float)
 
    # Image (stored as base64 for simplicity; use object storage in production)
    image_b64       = Column(Text)
 
    # ABCDE
    abcde_json      = Column(JSON)                             # full ABCDE dict
 
    # Change vs previous visit
    change_json     = Column(JSON)
 
    # Body location
    body_location   = Column(String)                           # e.g. "left_forearm"
    body_x          = Column(Float)                            # SVG coordinate
    body_y          = Column(Float)
 
    created_at      = Column(DateTime, default=datetime.utcnow)
 
    patient         = relationship("Patient", back_populates="visits")
 
 
# ── Helpers ───────────────────────────────────────────────────────
 
def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 
def create_tables():
    Base.metadata.create_all(bind=engine)
 