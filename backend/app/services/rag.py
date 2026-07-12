from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.schemas import TutorAnswer, TutorQuestion
from app.models.domain import Material
from app.services.ai import ask_ai_tutor


from typing import Optional

def answer_with_context(
    payload: TutorQuestion, 
    db: Session, 
    user_id: str,
    custom_gemini_key: Optional[str] = None,
    custom_openai_key: Optional[str] = None
) -> TutorAnswer:
    # Fetch the materials associated with the IDs in the payload, ensuring they belong to the user
    materials = db.query(Material).filter(
        Material.id.in_(payload.material_ids),
        Material.user_id == user_id
    ).all()
    
    # Pass both title and content to the AI Tutor
    material_data = [(mat.title, mat.content) for mat in materials]
    
    # Delegate to the AI service
    answer_text, sources = ask_ai_tutor(
        payload.question, 
        material_data,
        custom_gemini_key=custom_gemini_key,
        custom_openai_key=custom_openai_key
    )
    
    return TutorAnswer(
        answer=answer_text,
        sources=sources,
    )
