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

from fastapi.responses import StreamingResponse
import json
from app.models.domain import Material

@router.post("/ask-stream")
def ask_tutor_stream(
    payload: TutorQuestion,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("uid")
    materials = db.query(Material).filter(
        Material.id.in_(payload.material_ids),
        Material.user_id == user_id
    ).all()
    
    material_texts = "\n\n".join([f"--- {mat.title} ---\n{mat.content if mat.content else 'No content provided.'}" for mat in materials])
    material_titles = [mat.title for mat in materials]
    
    prompt = (
        f"You are a helpful AI tutor. A student is asking: '{payload.question}'.\n"
        f"They are currently studying the following materials:\n\n{material_texts}\n\n"
        "Provide a clear, educational answer based on the materials provided."
    )
    
    def event_generator():
        yield json.dumps({"type": "sources", "content": material_titles}) + "\n"
        try:
            from app.services.ai import stream_ai_response
            for text_chunk in stream_ai_response(prompt):
                yield json.dumps({"type": "text", "content": text_chunk}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"
            
    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
