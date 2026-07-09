from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.schemas import TutorAnswer, TutorQuestion
from app.db.database import get_db
from app.core.auth import get_current_user
from app.services.rag import answer_with_context

router = APIRouter()

@router.post("/ask", response_model=TutorAnswer)
def ask_tutor(
    payload: TutorQuestion,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> TutorAnswer:
    user_id = current_user.get("uid")
    return answer_with_context(payload, db, user_id)
