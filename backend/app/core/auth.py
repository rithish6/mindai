import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# Initialize Firebase Admin SDK
try:
    # If GOOGLE_APPLICATION_CREDENTIALS is set, it uses that.
    # Otherwise, it falls back to default credentials.
    # For token verification, just having the project ID is often sufficient.
    firebase_admin.get_app()
except ValueError:
    cred = credentials.ApplicationDefault()
    # Replace with your actual project ID if not set in environment
    project_id = os.environ.get('FIREBASE_PROJECT_ID', 'edumind-auth-dev-9182')
    firebase_admin.initialize_app(cred, {'projectId': project_id})

security = HTTPBearer()

from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import User

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Validate the Firebase ID token, return the decoded token,
    and ensure the user exists in the local database.
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        # Check if user exists in DB, if not, create them
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            new_user = User(id=uid, email=email)
            db.add(new_user)
            db.commit()
            
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
