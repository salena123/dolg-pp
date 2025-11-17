from fastapi import FastAPI
from app.routers import jobs
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus Jobs API", version="1.0.0")

app.include_router(jobs.router)

@app.get("/")
def root():
    return {"message": "API запустился"}
