import requests
import json

API_KEY = "AIzaSyDDpVxv4adnpdWQaRYS7sw8K2JPDKjG4mM"

# 1. Sign up with email/password
import uuid
email = f"test_{uuid.uuid4()}@example.com"
password = "Password123!"

res = requests.post(
    f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}",
    json={"email": email, "password": password, "returnSecureToken": True}
)
if res.status_code != 200:
    print("Signup failed", res.text)
    exit(1)

data = res.json()
token = data["idToken"]
print("Got token")

# 2. Upload file
with open("test_upload_full.py", "rb") as f:
    upload_res = requests.post(
        "https://edumind-backend-v74a.onrender.com/materials/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.txt", f, "text/plain")}
    )

print("Upload response:", upload_res.status_code, upload_res.text)
