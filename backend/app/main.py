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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://edumind-2427a.web.app", "https://edumind-2427a.firebaseapp.com"],
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

@app.get("/")
def read_root():
    return {"status": "online", "message": "EduMind API is running! Please use the frontend application."}

@app.get("/debug-commit")
def debug_commit():
    import os
    from app.services.ai import get_ai_provider
    return {
        "commit": os.environ.get("RENDER_GIT_COMMIT", "local"),
        "python_version": os.sys.version,
        "ai_provider": get_ai_provider()
    }

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    trace = traceback.format_exc()
    print(f"Global Error: {error_msg}")
    print(trace)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": error_msg, "traceback": trace}
    )
