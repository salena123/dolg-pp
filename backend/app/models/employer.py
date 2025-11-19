from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database import Base

class Employer(Base):
    __tablename__ = "employers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    contact_email = Column(String(120))
    description = Column(Text)
