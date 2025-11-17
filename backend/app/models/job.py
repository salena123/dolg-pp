from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, Boolean
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("employers.id", ondelete="CASCADE"))
    title = Column(String(255))
    description = Column(Text)
    location = Column(String(255))
    employment_type = Column(String(50))
    remote = Column(Boolean, default=False)
    start_date = Column(Date)
    end_date = Column(Date)
    spots = Column(Integer)
    status = Column(String(30), default="open")
