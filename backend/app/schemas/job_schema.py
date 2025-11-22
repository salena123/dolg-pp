from pydantic import BaseModel
from typing import Optional
from datetime import date

class JobBase(BaseModel):
    title: str
    description: str
    location: Optional[str]
    employment_type: Optional[str]
    remote: Optional[bool] = False
    start_date: Optional[date]
    end_date: Optional[date]
    spots: Optional[int]

class JobCreate(JobBase):
    employer_id: int

class Job(JobBase):
    id: int
    employer_id: int
    status: str

    model_config = {
        "from_attributes": True
    }

