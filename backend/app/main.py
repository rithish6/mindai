from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analytics, generation, materials, planner, tutor, doubt

app = FastAPI(
    title="EduMind AI API",
    description="Backend API for the EduMind AI learning platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://edumind-2427a.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Depends
from app.core.auth import get_current_user
from app.db.database import Base, engine
from app.models import domain

# Create database tables
Base.metadata.create_all(bind=engine)

app.include_router(materials.router, prefix="/materials", tags=["materials"], dependencies=[Depends(get_current_user)])
app.include_router(generation.router, prefix="/generate", tags=["generation"], dependencies=[Depends(get_current_user)])
app.include_router(tutor.router, prefix="/tutor", tags=["tutor"], dependencies=[Depends(get_current_user)])
app.include_router(planner.router, prefix="/planner", tags=["planner"], dependencies=[Depends(get_current_user)])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"], dependencies=[Depends(get_current_user)])
app.include_router(doubt.router, prefix="/doubt", tags=["doubt"], dependencies=[Depends(get_current_user)])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "edumind-ai-api"}
