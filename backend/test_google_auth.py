from google.oauth2 import id_token
from google.auth.transport import requests

project_id = "edumind-2427a"
try:
    decoded = id_token.verify_firebase_token("dummy", requests.Request(), audience=project_id)
except Exception as e:
    print(type(e), e)
