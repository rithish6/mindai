from __future__ import annotations
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.schemas import GeneratedResourceRequest
from app.db.database import get_db
from app.models.domain import Material
from app.services.ai import generate_study_content
from app.core.auth import get_current_user

router = APIRouter()


@router.post("")
def generate_resource(
    payload: GeneratedResourceRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> dict[str, Any]:
    
    user_id = current_user.get("uid")
    
    # Verify the material exists and belongs to the user
    material = db.query(Material).filter(
        Material.id == payload.material_id, 
        Material.user_id == user_id
    ).first()
    
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Generate content using the AI service
    generated_items = generate_study_content(
        title=material.title, 
        content=material.content,
        resource_type=payload.resource_type,
        language=payload.language
    )

    return {
        "material_id": payload.material_id,
        "resource_type": payload.resource_type,
        "status": "completed",
        "content": generated_items,
    }

from fastapi.responses import StreamingResponse
import json

@router.post("/stream")
def generate_resource_stream(
    payload: GeneratedResourceRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("uid")
    material = db.query(Material).filter(
        Material.id == payload.material_id,
        Material.user_id == user_id
    ).first()
    
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
        
    context = material.content if material.content else f"the topic '{material.title}'"
    
    if payload.resource_type == "summary":
        prompt = f"You are an expert tutor. I am studying '{material.title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a highly detailed, comprehensive, and structured summary. Use beautiful Markdown formatting including headers (h2, h3), bold text, bullet points, numbered lists, tables where relevant, and blockquotes. Make the content extremely clear, understandable, and formatted like a premium GPT-4 answer."
    else:
        prompt = f"You are an expert tutor. I am studying '{material.title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a summary of the most important aspects."
        
    prompt += f"\n\nImportant: You must generate the final output entirely in the {payload.language} language."
    
    def event_generator():
        try:
            from app.services.ai import stream_ai_response
            system_msg = "You are a helpful study tutor. Output the summary directly in Markdown."
            for text_chunk in stream_ai_response(prompt, system_msg):
                yield json.dumps({"type": "text", "content": text_chunk}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"
            
    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
