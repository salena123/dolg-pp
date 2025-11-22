from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional

from app.database import SessionLocal
from app.models.job import Job as JobModel
from app.schemas.job_schema import Job, JobCreate

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[Job])
def read_jobs(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Поиск по ключевым словам в названии и описании"),
    employment_type: Optional[str] = Query(None, description="Фильтр по типу занятости"),
    location: Optional[str] = Query(None, description="Фильтр по местоположению"),
    remote: Optional[bool] = Query(None, description="Фильтр по удаленной работе"),
    status: Optional[str] = Query("open", description="Фильтр по статусу вакансии")
):
    query = db.query(JobModel)
    
    if status:
        query = query.filter(JobModel.status == status)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                JobModel.title.ilike(search_term),
                JobModel.description.ilike(search_term)
            )
        )
    
    if employment_type:
        query = query.filter(JobModel.employment_type == employment_type)
    
    if location:
        query = query.filter(JobModel.location.ilike(f"%{location}%"))
    
    if remote is not None:
        query = query.filter(JobModel.remote == remote)
    
    return query.all()


@router.get("/{job_id}", response_model=Job)
def read_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Вакансия не найдена",
                "detail": f"Вакансия с ID {job_id} не существует",
                "help": "Проверьте правильность указанного ID вакансии"
            }
        )
    return job


@router.post("/", response_model=Job, status_code=201)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    try:
        db_job = JobModel(**job.dict())
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{job_id}", response_model=Job)
def update_job(job_id: int, job_update: JobCreate, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in job_update.dict().items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return
