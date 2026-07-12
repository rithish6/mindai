import requests
import json
import uuid

API_KEY = "AIzaSyDDpVxv4adnpdWQaRYS7sw8K2JPDKjG4mM"
email = f"test_{uuid.uuid4()}@example.com"
password = "Password123!"

res = requests.post(
    f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}",
    json={"email": email, "password": password, "returnSecureToken": True}
)
data = res.json()
token = data["idToken"]

with open("test_upload_full2.py", "rb") as f:
    upload_res = requests.post(
        "https://edumind-backend-v74a.onrender.com/materials/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.txt", f, "text/plain")}
    )

print("Status:", upload_res.status_code)
print("Response:", upload_res.text)
