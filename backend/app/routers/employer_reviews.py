from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.employer_review import EmployerReview as EmployerReviewModel
from app.models.application import Application as ApplicationModel
from app.models.job import Job as JobModel
from app.models.employer import Employer as EmployerModel
from app.models.user import User
from app.schemas.employer_review_schema import EmployerReview, EmployerReviewCreate
from app.core.dependencies import get_current_employer


router = APIRouter(prefix="/employer-reviews", tags=["EmployerReviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/application/{application_id}", response_model=EmployerReview | None)
def read_employer_review_for_application(application_id: int, db: Session = Depends(get_db)):
    return (
        db.query(EmployerReviewModel)
        .filter(EmployerReviewModel.application_id == application_id)
        .first()
    )


@router.post("/", response_model=EmployerReview, status_code=status.HTTP_201_CREATED)
def create_employer_review(
    review_data: EmployerReviewCreate,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db),
):
    application = (
        db.query(ApplicationModel)
        .filter(ApplicationModel.id == review_data.application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Заявка не найдена",
                "detail": f"Заявка с ID {review_data.application_id} не существует",
                "help": "Проверьте правильность указанного ID заявки",
            },
        )

    if application.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Нельзя оставить отзыв",
                "detail": "Оценивать можно только принятые заявки (со статусом 'accepted')",
                "help": "Сначала измените статус заявки на 'accepted'",
            },
        )

    job = db.query(JobModel).filter(JobModel.id == application.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Вакансия не найдена",
                "detail": f"Вакансия с ID {application.job_id} не существует",
                "help": "Проверьте правильность указанного ID вакансии",
            },
        )

    employer = db.query(EmployerModel).filter(EmployerModel.user_id == current_user.id).first()
    if not employer or job.employer_id != employer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ к этой заявке запрещен",
        )

    existing = (
        db.query(EmployerReviewModel)
        .filter(EmployerReviewModel.application_id == review_data.application_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Отзыв уже существует",
                "detail": "Вы уже оставили отзыв по этой заявке",
                "help": "Вы можете изменить существующий отзыв в будущей версии",
            },
        )

    db_review = EmployerReviewModel(
        application_id=review_data.application_id,
        job_id=application.job_id,
        student_id=application.user_id,
        employer_id=employer.id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review
