from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import SessionLocal
from app.models.department import Department as DepartmentModel
from app.models.employer import Employer
from app.models.user import User
from app.schemas.department_schema import Department, DepartmentCreate, DepartmentUpdate
from app.core.dependencies import get_current_user

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


@router.get("/my-department", response_model=Department)
def get_my_department(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    employer = db.query(Employer).filter(
        Employer.user_id == current_user.id
    ).options(joinedload(Employer.department)).first()
    
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    if not employer.department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No department assigned"
        )
    
    return employer.department


@router.put("/my-department", response_model=Department)
def update_my_department(
    department_update: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    # Get employer with department
    employer = db.query(Employer).filter(
        Employer.user_id == current_user.id
    ).options(joinedload(Employer.department)).first()
    
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    # If employer already has a department, update it
    if employer.department:
        for key, value in department_update.dict(exclude_unset=True).items():
            setattr(employer.department, key, value)
    else:
        # Create a new department
        department_data = department_update.dict()
        department = DepartmentModel(**department_data)
        db.add(department)
        db.flush()  # To get the department ID
        employer.department_id = department.id
    
    db.commit()
    db.refresh(employer)
    return employer.department


@router.get("/{department_id}", response_model=Department)
def get_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(DepartmentModel).filter(
        DepartmentModel.id == department_id
    ).first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    return department


@router.post("/", response_model=Department, status_code=201)
def create_department(
    dep: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only employers can create departments
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can create departments"
        )

    # Find employer profile for current user
    employer = db.query(Employer).filter(Employer.user_id == current_user.id).first()
    if not employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )

    # Create department
    db_dep = DepartmentModel(**dep.dict())
    db.add(db_dep)
    db.flush()  # get department id without full commit

    # Link department to employer
    employer.department_id = db_dep.id

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


 
