from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    office = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    employers = relationship("Employer", back_populates="department")
