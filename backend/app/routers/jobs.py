from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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


# GET /jobs — получить список вакансий
@router.get("/", response_model=List[Job])
def read_jobs(db: Session = Depends(get_db)):
    return db.query(JobModel).all()


# GET /jobs/{id} — получить вакансию по ID
@router.get("/{job_id}", response_model=Job)
def read_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# POST /jobs — создать вакансию
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


# PUT /jobs/{job_id} — обновить вакансию
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


# DELETE /jobs/{job_id} — удалить вакансию
@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return
