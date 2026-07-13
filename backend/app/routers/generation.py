from __future__ import annotations
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
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
    current_user: dict = Depends(get_current_user),
    x_gemini_key: Optional[str] = Header(None),
    x_openai_key: Optional[str] = Header(None)
) -> dict[str, Any]:
    
    user_id = current_user.get("uid")
    
    # Check if multiple material_ids are provided
    if payload.material_ids:
        materials = db.query(Material).filter(
            Material.id.in_(payload.material_ids),
            Material.user_id == user_id
        ).all()
        if not materials:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid materials found")
        combined_title = " & ".join([m.title for m in materials])
        combined_content = "\n\n".join([f"--- Source: {m.title} ---\n{m.content or ''}" for m in materials])
    elif payload.material_id:
        material = db.query(Material).filter(
            Material.id == payload.material_id, 
            Material.user_id == user_id
        ).first()
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
        combined_title = material.title
        combined_content = material.content
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either material_id or material_ids must be provided")

    # Generate content using the AI service
    generated_items = generate_study_content(
        title=combined_title, 
        content=combined_content,
        resource_type=payload.resource_type,
        language=payload.language,
        custom_gemini_key=x_gemini_key,
        custom_openai_key=x_openai_key
    )

    return {
        "material_id": payload.material_id or (payload.material_ids[0] if payload.material_ids else "combined"),
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
    current_user: dict = Depends(get_current_user),
    x_gemini_key: Optional[str] = Header(None),
    x_openai_key: Optional[str] = Header(None)
):
    user_id = current_user.get("uid")
    if payload.material_ids:
        materials = db.query(Material).filter(
            Material.id.in_(payload.material_ids),
            Material.user_id == user_id
        ).all()
        if not materials:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid materials found")
        combined_title = " & ".join([m.title for m in materials])
        combined_content = "\n\n".join([f"--- Source: {m.title} ---\n{m.content or ''}" for m in materials])
    elif payload.material_id:
        material = db.query(Material).filter(
            Material.id == payload.material_id,
            Material.user_id == user_id
        ).first()
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
        combined_title = material.title
        combined_content = material.content
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either material_id or material_ids must be provided")
        
    context = combined_content if combined_content else f"the topic '{combined_title}'"
    
    if payload.resource_type == "summary":
        prompt = f"You are an expert tutor. I am studying '{combined_title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a highly detailed, comprehensive, and structured summary. Use beautiful Markdown formatting including headers (h2, h3), bold text, bullet points, numbered lists, tables where relevant, and blockquotes. Make the content extremely clear, understandable, and formatted like a premium GPT-4 answer."
    else:
        prompt = f"You are an expert tutor. I am studying '{combined_title}'. Here is the source material:\n\n{context}\n\nBased ONLY on the material above, generate a summary of the most important aspects."
        
    prompt += f"\n\nImportant: You must generate the final output entirely in the {payload.language} language."
    
    def event_generator():
        try:
            from app.services.ai import stream_ai_response
            system_msg = "You are a helpful study tutor. Output the summary directly in Markdown."
            for text_chunk in stream_ai_response(
                prompt, 
                system_message=system_msg, 
                custom_gemini_key=x_gemini_key, 
                custom_openai_key=x_openai_key
            ):
                yield json.dumps({"type": "text", "content": text_chunk}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"
            
    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
