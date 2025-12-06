from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    job_id: int


class Review(ReviewBase):
    id: int
    job_id: int
    employer_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
