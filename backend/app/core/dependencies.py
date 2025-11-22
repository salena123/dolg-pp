from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
import logging
import sys
from pathlib import Path

from app.database import SessionLocal
from app.models.user import User
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

DEBUG_LOG_PATH = Path(__file__).parent.parent / "debug.log"

try:
    with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
        f.write("МОДУЛЬ dependencies.py ЗАГРУЖЕН\n")
        f.flush()
except:
    pass
print("МОДУЛЬ dependencies.py ЗАГРУЖЕН", flush=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "error": "Не авторизован",
            "detail": "Не удалось подтвердить учетные данные",
            "help": "Войдите в систему для доступа к этому ресурсу"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = getattr(request.state, 'token', None)
    
    log_msg = f"\n{'='*60}\nФУНКЦИЯ get_current_user ВЫЗВАНА\n   Метод: {request.method}\n   Путь: {request.url.path}\n   Токен из request.state: {token[:30] if token else 'НЕТ'}...\n{'='*60}\n"
    try:
        import os
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(log_msg)
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        sys.stderr.write(f"Ошибка записи в debug.log: {e}\n")
        sys.stderr.flush()
    
    print(f"\n{'='*60}", flush=True)
    print(f"ФУНКЦИЯ get_current_user ВЫЗВАНА", flush=True)
    print(f"   Метод: {request.method}", flush=True)
    print(f"   Путь: {request.url.path}", flush=True)
    print(f"   Токен: {token[:30] if token else 'НЕТ'}...", flush=True)
    print(f"{'='*60}\n", flush=True)
    sys.stdout.flush()
    
    if not token:
        print("ОШИБКА: Токен отсутствует", flush=True)
        logger.error("Токен отсутствует")
        sys.stdout.flush()
        raise credentials_exception
    
    print(f"Токен извлечен: {token[:30]}... (длина: {len(token)})", flush=True)
    logger.info(f"Токен извлечен: {token[:30]}... (длина: {len(token)})")
    sys.stdout.flush()
    
    payload = decode_access_token(token)
    if payload is None:
        print(f"ОШИБКА: Не удалось декодировать токен", flush=True)
        logger.error(f"Не удалось декодировать токен: {token[:30]}...")
        sys.stdout.flush()
        raise credentials_exception
    
    print(f"Токен декодирован. Payload: {payload}", flush=True)
    logger.info(f"Токен успешно декодирован. Payload: {payload}")
    sys.stdout.flush()
    
    user_id = payload.get("sub")
    if user_id is None:
        print(f"ОШИБКА: Токен не содержит user_id (sub): {payload}", flush=True)
        logger.error(f"Токен не содержит user_id (sub): {payload}")
        sys.stdout.flush()
        raise credentials_exception
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        print(f"ОШИБКА: Некорректный user_id: {user_id} (тип: {type(user_id)})", flush=True)
        logger.error(f"Некорректный user_id в токене: {user_id} (тип: {type(user_id)})")
        sys.stdout.flush()
        raise credentials_exception
    
    print(f"Поиск пользователя с ID: {user_id}", flush=True)
    logger.info(f"Поиск пользователя с ID: {user_id}")
    sys.stdout.flush()
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"ОШИБКА: Пользователь с ID {user_id} не найден в БД", flush=True)
        logger.error(f"Пользователь с ID {user_id} не найден в базе данных")
        sys.stdout.flush()
        raise credentials_exception
    
    print(f"УСПЕХ: Пользователь найден - {user.email} (ID: {user.id}, роль: {user.role})", flush=True)
    print(f"{'='*60}\n", flush=True)
    logger.info(f"Пользователь найден: {user.email} (ID: {user.id})")
    sys.stdout.flush()
    return user


def get_current_student(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Доступ запрещен",
                "detail": "Этот ресурс доступен только для студентов",
                "help": "Войдите как студент для доступа к этому ресурсу"
            }
        )
    return current_user


def get_current_employer(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Доступ запрещен",
                "detail": "Этот ресурс доступен только для работодателей",
                "help": "Войдите как работодатель для доступа к этому ресурсу"
            }
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Доступ запрещен",
                "detail": "Этот ресурс доступен только для администраторов",
                "help": "Войдите как администратор для доступа к этому ресурсу"
            }
        )
    return current_user

