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
