from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import sys
import os
import uuid
from pathlib import Path

from app.database import SessionLocal
from app.models.application import Application as ApplicationModel
from app.models.job import Job as JobModel
from app.models.user import User
from app.schemas.application_schema import Application, ApplicationCreate
from app.core.dependencies import get_current_user, get_current_student
from app.core.config import settings

router = APIRouter(prefix="/applications", tags=["Applications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[Application])
def read_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"\n{'='*60}", flush=True)
    print(f"РОУТЕР /applications/ ВЫЗВАН", flush=True)
    print(f"   Пользователь: {current_user.email} (ID: {current_user.id})", flush=True)
    print(f"{'='*60}\n", flush=True)
    sys.stdout.flush()
    
    query = db.query(ApplicationModel)
    
    if current_user.role == "student":
        query = query.filter(ApplicationModel.user_id == current_user.id)
    
    return query.all()


@router.get("/{app_id}", response_model=Application)
def read_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationModel).filter(ApplicationModel.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Заявка не найдена",
                "detail": f"Заявка с ID {app_id} не существует",
                "help": "Проверьте правильность указанного ID заявки"
            }
        )
    return app


@router.post("/", response_model=Application, status_code=status.HTTP_201_CREATED)
def create_application(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    job = db.query(JobModel).filter(JobModel.id == application.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Вакансия не найдена",
                "detail": f"Вакансия с ID {application.job_id} не существует",
                "help": "Убедитесь, что указан корректный ID вакансии"
            }
        )
    
    if job.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Вакансия недоступна",
                "detail": f"Вакансия имеет статус '{job.status}' и не принимает заявки",
                "help": "Выберите другую вакансию со статусом 'open'"
            }
        )
    
    existing_application = db.query(ApplicationModel).filter(
        ApplicationModel.job_id == application.job_id,
        ApplicationModel.user_id == current_user.id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Заявка уже подана",
                "detail": "Вы уже подали заявку на эту вакансию",
                "help": "Проверьте свои заявки в личном кабинете"
            }
        )
    
    try:
        app_data = application.dict()
        app_data["user_id"] = current_user.id
        db_app = ApplicationModel(**app_data)
        db.add(db_app)
        db.commit()
        db.refresh(db_app)
        return db_app
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Ошибка при создании заявки",
                "detail": str(e),
                "help": "Попробуйте повторить запрос позже"
            }
        )


@router.post("/upload-resume", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_student)
):
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Неподдерживаемый формат файла",
                "detail": f"Разрешенные форматы: {', '.join(settings.ALLOWED_EXTENSIONS)}",
                "help": "Загрузите файл в формате PDF, DOC или DOCX"
            }
        )
    
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Файл слишком большой",
                "detail": f"Максимальный размер файла: {settings.MAX_FILE_SIZE / 1024 / 1024} MB",
                "help": "Загрузите файл меньшего размера"
            }
        )
    
    file_id = str(uuid.uuid4())
    file_name = f"{file_id}{file_ext}"
    file_path = settings.UPLOAD_DIR / file_name
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        
        file_url = f"/applications/resume/{file_name}"
        return {
            "file_url": file_url,
            "file_name": file.filename,
            "file_size": file_size
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Ошибка при сохранении файла",
                "detail": str(e),
                "help": "Попробуйте повторить загрузку позже"
            }
        )


@router.get("/resume/{file_name}")
async def get_resume(file_name: str, current_user: User = Depends(get_current_user)):
    file_path = settings.UPLOAD_DIR / file_name
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Файл не найден",
                "detail": f"Файл {file_name} не существует",
                "help": "Проверьте правильность URL файла"
            }
        )
    
    if not str(file_path).startswith(str(settings.UPLOAD_DIR)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Доступ запрещен",
                "detail": "Недопустимый путь к файлу",
                "help": "Обратитесь к администратору"
            }
        )
    
    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/octet-stream"
    )


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(ApplicationModel).filter(ApplicationModel.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Заявка не найдена",
                "detail": f"Заявка с ID {app_id} не существует",
                "help": "Проверьте правильность указанного ID заявки"
            }
        )

    db.delete(app)
    db.commit()
    return
