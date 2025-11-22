from pydantic_settings import BaseSettings
import os
from pathlib import Path

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars-long"
    
    UPLOAD_DIR: Path = Path(__file__).parent.parent.parent / "uploads" / "resumes"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS: list = [".pdf", ".doc", ".docx"]

    class Config:
        env_file = ".env"

settings = Settings()

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
