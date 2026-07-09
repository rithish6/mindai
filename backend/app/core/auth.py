import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from google.oauth2 import id_token
from google.auth.transport import requests

# Initialize Firebase Admin SDK
try:
    # If GOOGLE_APPLICATION_CREDENTIALS is set, it uses that.
    # Otherwise, it falls back to default credentials.
    # For token verification, just having the project ID is often sufficient.
    firebase_admin.get_app()
except ValueError:
    project_id = os.environ.get('FIREBASE_PROJECT_ID', 'edumind-2427a')
    firebase_admin.initialize_app(options={'projectId': project_id})

security = HTTPBearer()

from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import User

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        token = credentials.credentials
        project_id = os.environ.get('FIREBASE_PROJECT_ID', 'edumind-2427a')
        
        # Verify the Firebase token using google-auth instead of firebase-admin
        # This completely avoids the need for Google Application Default Credentials
        decoded_token = id_token.verify_firebase_token(
            token, 
            requests.Request(), 
            audience=project_id
        )
        
        uid = decoded_token.get("uid") or decoded_token.get("sub")
        email = decoded_token.get("email")

        # Check if user exists in DB, if not, create them
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            new_user = User(id=uid, email=email)
            db.add(new_user)
            db.commit()
            
        return decoded_token
    except Exception as e:
        import traceback
        print(f"Auth error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
