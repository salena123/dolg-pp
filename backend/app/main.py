from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import jobs
from app.database import Base, engine
import app.models
from app.routers import jobs, applications, employers, departments, auth, reviews, employer_reviews
from app.core.config import settings
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Campus Jobs API",
    version="1.0.0",
    description="API для поиска временной работы и стажировок в кампусе",
    redirect_slashes=False
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    import sys
    import traceback
    import os
    from pathlib import Path
    
    debug_log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug.log")
    
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    if auth_header and (auth_header.startswith("Bearer ") or auth_header.startswith("bearer ")):
        token = auth_header[7:]
        request.state.token = token
    else:
        request.state.token = None
    
    log_message = f"\n{'='*60}\nВХОДЯЩИЙ ЗАПРОС\n   Метод: {request.method}\n   Путь: {request.url.path}\n"
    log_message += f"   Authorization: {auth_header[:50] if auth_header else 'НЕТ'}...\n"
    log_message += f"   Токен извлечен: {request.state.token[:30] if request.state.token else 'НЕТ'}...\n"
    log_message += f"{'='*60}\n\n"
    
    try:
        with open(debug_log_path, "a", encoding="utf-8") as f:
            f.write(log_message)
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        sys.stderr.write(f"ОШИБКА ЗАПИСИ В ЛОГ: {e}\n")
        sys.stderr.flush()
    
    sys.stdout.write(log_message)
    sys.stdout.flush()
    logging.info(log_message.strip())
    
    try:
        response = await call_next(request)
        
        response_msg = f"ОТВЕТ: {response.status_code}\n"
        try:
            with open(debug_log_path, "a", encoding="utf-8") as f:
                f.write(response_msg)
                f.flush()
                os.fsync(f.fileno())
        except:
            pass
        sys.stdout.write(response_msg)
        sys.stdout.flush()
        
        return response
    except Exception as e:
        error_msg = f"ОШИБКА В MIDDLEWARE: {e}\n{traceback.format_exc()}\n"
        try:
            with open(debug_log_path, "a", encoding="utf-8") as f:
                f.write(error_msg)
                f.flush()
                os.fsync(f.fileno())
        except:
            pass
        sys.stderr.write(error_msg)
        sys.stderr.flush()
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({
            "field": field if field else "body",
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Ошибка валидации данных",
            "detail": "Проверьте правильность заполнения полей формы",
            "errors": errors,
            "help": "Убедитесь, что все обязательные поля заполнены корректно"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Внутренняя ошибка сервера",
            "detail": str(exc) if str(exc) else "Произошла непредвиденная ошибка",
            "help": "Попробуйте повторить запрос позже или обратитесь к администратору"
        }
    )

app.include_router(auth.router)
app.include_router(employers.router)
app.include_router(departments.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(reviews.router)
app.include_router(employer_reviews.router)

if settings.UPLOAD_DIR.exists():
    app.mount("/applications/resume", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="resumes")

@app.get("/")
def root():
    import sys
    sys.stdout.write("TEST: Root endpoint вызван\n")
    sys.stdout.flush()
    print("TEST PRINT: Root endpoint вызван", flush=True)
    logging.info("Root endpoint вызван")
    return {"message": "API запустился"}

@app.get("/test-auth")
def test_auth(request: Request):
    import sys
    msg = f"\n{'='*60}\nТЕСТОВЫЙ ЗАПРОС\n   Путь: {request.url.path}\n   Метод: {request.method}\n"
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization') or 'НЕТ'
    msg += f"   Authorization: {auth_header[:50] if auth_header != 'НЕТ' else 'НЕТ'}...\n{'='*60}\n\n"
    
    sys.stdout.write(msg)
    sys.stdout.flush()
    print(msg, end='', flush=True)
    logging.info(msg.strip())
    
    return {
        "message": "Тестовый endpoint работает",
        "path": request.url.path,
        "method": request.method,
        "authorization": auth_header
    }
