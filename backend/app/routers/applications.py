from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.application import Application as ApplicationModel
from app.schemas.application_schema import Application, ApplicationCreate

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[Application])
def read_applications(db: Session = Depends(get_db)):
    return db.query(ApplicationModel).all()


@router.get("/{app_id}", response_model=Application)
def read_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationModel).filter(ApplicationModel.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/", response_model=Application, status_code=201)
def create_application(application: ApplicationCreate, db: Session = Depends(get_db)):
    db_app = ApplicationModel(**application.dict())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationModel).filter(ApplicationModel.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()
    return
