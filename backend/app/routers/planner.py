from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import StudyTask as StudyTaskSchema
from app.models.domain import StudyTask
from app.db.database import get_db
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/tasks", response_model=list[StudyTaskSchema])
def list_tasks(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    tasks = db.query(StudyTask).filter(StudyTask.user_id == user_id).all()
    return tasks

@router.post("/tasks", response_model=StudyTaskSchema)
def create_task(task: StudyTaskSchema, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    
    new_task = StudyTask(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=task.title,
        due_date=task.due_date,
        topic=task.topic,
        estimated_minutes=task.estimated_minutes
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task
