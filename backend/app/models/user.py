from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(30))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relationship with Employer (one-to-one)
    employer = relationship("Employer", back_populates="user", uselist=False, cascade="all, delete-orphan")
