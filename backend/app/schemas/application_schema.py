from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class Application(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
