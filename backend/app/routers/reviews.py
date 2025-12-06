from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.review import Review as ReviewModel
from app.models.job import Job as JobModel
from app.models.employer import Employer as EmployerModel
from app.models.user import User
from app.schemas.review_schema import Review, ReviewCreate
from app.core.dependencies import get_current_student, get_current_user


router = APIRouter(prefix="/reviews", tags=["Reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/job/{job_id}", response_model=List[Review])
def read_reviews_for_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Вакансия не найдена",
                "detail": f"Вакансия с ID {job_id} не существует",
                "help": "Проверьте правильность указанного ID вакансии",
            },
        )
    return db.query(ReviewModel).filter(ReviewModel.job_id == job_id).all()


@router.post("/", response_model=Review, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    job = db.query(JobModel).filter(JobModel.id == review_data.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Вакансия не найдена",
                "detail": f"Вакансия с ID {review_data.job_id} не существует",
                "help": "Проверьте правильность указанного ID вакансии",
            },
        )

    employer = db.query(EmployerModel).filter(EmployerModel.id == job.employer_id).first()
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Профиль работодателя для этой вакансии не найден",
        )

    existing_review = db.query(ReviewModel).filter(
        ReviewModel.job_id == review_data.job_id,
        ReviewModel.user_id == current_user.id,
    ).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Отзыв уже существует",
                "detail": "Вы уже оставили отзыв на эту вакансию",
                "help": "Вы можете изменить существующий отзыв в будущей версии",
            },
        )

    db_review = ReviewModel(
        job_id=review_data.job_id,
        employer_id=employer.id,
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review
