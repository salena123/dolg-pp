from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Employer(Base):
    __tablename__ = "employers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    contact_email = Column(String(120), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    department = relationship("Department", back_populates="employers")
    user = relationship("User", back_populates="employer")
