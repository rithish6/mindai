from __future__ import annotations
import uuid

from fastapi import APIRouter, UploadFile, Depends
from sqlalchemy.orm import Session

from app.models.schemas import Material as MaterialSchema
from app.models.domain import Material
from app.db.database import get_db
from app.core.auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[MaterialSchema])
def list_materials(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    materials = db.query(Material).filter(Material.user_id == user_id).all()
    return materials


@router.post("/test-upload")
async def test_upload(file: UploadFile):
    return {"filename": file.filename}

@router.get("/debug-token")
def debug_token(auth_header: str = None):
    try:
        from firebase_admin import auth as firebase_auth
        token = auth_header.replace("Bearer ", "") if auth_header else "dummy"
        decoded = firebase_auth.verify_id_token(token)
        return {"status": "success", "decoded": decoded}
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

@router.post("/upload", response_model=MaterialSchema)
async def upload_material(file: UploadFile, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    
    extracted_text = None
    if file.content_type == "application/pdf":
        try:
            import fitz
            file_bytes = await file.read()
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text_pages = [page.get_text() for page in doc]
            extracted_text = "\n".join(text_pages)
            doc.close()
        except Exception as e:
            print(f"Failed to parse PDF: {e}")
    elif file.content_type and (file.content_type.startswith("audio/") or file.content_type.startswith("video/")):
        try:
            from app.services.ai import transcribe_media
            file_bytes = await file.read()
            extracted_text = transcribe_media(file_bytes, file.content_type)
        except Exception as e:
            print(f"Failed to transcribe media: {e}")
    elif file.content_type and (file.content_type.startswith("text/") or file.content_type == "application/json" or file.filename.endswith((".txt", ".md", ".json", ".csv"))):
        try:
            file_bytes = await file.read()
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Failed to read text file: {e}")
    
    new_material = Material(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=file.filename or "uploaded-material",
        content=extracted_text,
        material_type=file.content_type or "unknown",
        processing_status="processed" if extracted_text else "queued"
    )
    
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    
    return new_material
