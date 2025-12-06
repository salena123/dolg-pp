from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EmployerReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class EmployerReviewCreate(EmployerReviewBase):
    application_id: int


class EmployerReview(EmployerReviewBase):
    id: int
    application_id: int
    job_id: int
    student_id: int
    employer_id: int
    created_at: datetime

    class Config:
        from_attributes = True
