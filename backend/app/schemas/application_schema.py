from pydantic import BaseModel
from typing import Optional

class ApplicationCreate(BaseModel):
    job_id: int
    user_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class Application(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: str

    class Config:
        orm_mode = True
