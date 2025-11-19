from fastapi import FastAPI
from app.routers import jobs
from app.database import Base, engine
import app.models
from app.routers import jobs, applications, employers, departments

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus Jobs API", version="1.0.0")

app.include_router(employers.router)
app.include_router(departments.router)
app.include_router(jobs.router)
app.include_router(applications.router)
@app.get("/")
def root():
    return {"message": "API запустился"}
