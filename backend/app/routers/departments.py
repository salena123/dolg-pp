from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.department import Department as DepartmentModel
from app.schemas.department_schema import Department, DepartmentCreate

router = APIRouter(prefix="/departments", tags=["Departments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[Department])
def get_departments(db: Session = Depends(get_db)):
    return db.query(DepartmentModel).all()


@router.get("/{department_id}", response_model=Department)
def get_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(DepartmentModel).filter(
        DepartmentModel.id == department_id
    ).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    return department


@router.post("/", response_model=Department, status_code=201)
def create_department(dep: DepartmentCreate, db: Session = Depends(get_db)):
    db_dep = DepartmentModel(**dep.dict())
    db.add(db_dep)
    db.commit()
    db.refresh(db_dep)
    return db_dep


@router.put("/{department_id}", response_model=Department)
def update_department(department_id: int, dep: DepartmentCreate, db: Session = Depends(get_db)):
    department = db.query(DepartmentModel).filter(
        DepartmentModel.id == department_id
    ).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    for key, value in dep.dict().items():
        setattr(department, key, value)

    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(DepartmentModel).filter(
        DepartmentModel.id == department_id
    ).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(department)
    db.commit()
    return
