from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key-change-in-production-min-32-chars')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        plain_password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    if not password:
        raise ValueError("Пароль не может быть пустым")
    
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    logger.info(f"Создание токена с SECRET_KEY: {SECRET_KEY[:20]}...")
    logger.info(f"   Данные для токена: {to_encode}")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"Токен создан: {encoded_jwt[:30]}...")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        print(f"Декодирование токена...")
        print(f"   SECRET_KEY: {SECRET_KEY[:30]}...")
        print(f"   Алгоритм: {ALGORITHM}")
        print(f"   Длина токена: {len(token)}")
        logger.info(f"Попытка декодирования токена с SECRET_KEY: {SECRET_KEY[:20]}...")
        logger.info(f"   Алгоритм: {ALGORITHM}")
        logger.info(f"   Длина токена: {len(token)}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Токен декодирован успешно: {payload}")
        logger.info(f"Токен успешно декодирован: {payload}")
        return payload
    except JWTError as e:
        print(f"JWTError: {e}")
        print(f"   Тип: {type(e).__name__}")
        logger.error(f"JWTError при декодировании токена: {e}")
        logger.error(f"   Тип ошибки: {type(e).__name__}")
        return None
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        print(f"   Тип: {type(e).__name__}")
        logger.error(f"Неожиданная ошибка при декодировании токена: {e}")
        logger.error(f"   Тип ошибки: {type(e).__name__}")
        return None


