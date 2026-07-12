from google.oauth2 import id_token
from google.auth.transport import requests
import os

# clear GOOGLE_APPLICATION_CREDENTIALS if any
if 'GOOGLE_APPLICATION_CREDENTIALS' in os.environ:
    del os.environ['GOOGLE_APPLICATION_CREDENTIALS']

try:
    decoded = id_token.verify_firebase_token("dummy", requests.Request(), audience="edumind-2427a")
except Exception as e:
    print("Error class:", e.__class__.__name__)
    print("Error message:", str(e))
