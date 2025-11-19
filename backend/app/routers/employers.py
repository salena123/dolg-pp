from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.employer import Employer as EmployerModel
from app.schemas.employer_schema import Employer, EmployerCreate

router = APIRouter(prefix="/employers", tags=["Employers"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[Employer])
def get_employers(db: Session = Depends(get_db)):
    return db.query(EmployerModel).all()


@router.get("/{employer_id}", response_model=Employer)
def get_employer(employer_id: int, db: Session = Depends(get_db)):
    employer = db.query(EmployerModel).filter(EmployerModel.id == employer_id).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return employer


@router.post("/", response_model=Employer, status_code=201)
def create_employer(employer: EmployerCreate, db: Session = Depends(get_db)):
    db_emp = EmployerModel(**employer.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp


@router.put("/{employer_id}", response_model=Employer)
def update_employer(employer_id: int, employer_data: EmployerCreate, db: Session = Depends(get_db)):
    employer = db.query(EmployerModel).filter(EmployerModel.id == employer_id).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")

    for key, value in employer_data.dict().items():
        setattr(employer, key, value)

    db.commit()
    db.refresh(employer)
    return employer


@router.delete("/{employer_id}", status_code=204)
def delete_employer(employer_id: int, db: Session = Depends(get_db)):
    employer = db.query(EmployerModel).filter(EmployerModel.id == employer_id).first()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")

    db.delete(employer)
    db.commit()
    return
