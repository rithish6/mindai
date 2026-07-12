from fastapi import APIRouter, UploadFile, Form, File, Depends, Header
from app.services.ai import solve_image_doubt
from app.core.auth import get_current_user
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/solve")
async def solve_doubt(
    image: UploadFile = File(...),
    question: str = Form(""),
    current_user: dict = Depends(get_current_user),
    x_gemini_key: Optional[str] = Header(None),
    x_openai_key: Optional[str] = Header(None)
) -> dict[str, str]:
    
    try:
        image_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"
        
        # Use AI service to analyze image
        answer = solve_image_doubt(
            image_bytes, 
            mime_type, 
            question,
            custom_gemini_key=x_gemini_key,
            custom_openai_key=x_openai_key
        )
        
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in solve_doubt endpoint: {e}")
        return {"answer": "Failed to process the image."}
