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

content = """
Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities. Some of this chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water. Photosynthesis is largely responsible for producing and maintaining the oxygen content of the Earth's atmosphere, and supplies most of the energy necessary for life on Earth.
"""

upload_res = requests.post(
    "https://edumind-backend-v74a.onrender.com/materials/upload",
    headers={"Authorization": f"Bearer {token}"},
    files={"file": ("photosynthesis.txt", content.encode('utf-8'), "text/plain")}
)
upload_data = upload_res.json()
material_id = upload_data["id"]
print("Uploaded photosynthesis text. Material ID:", material_id)

gen_res = requests.post(
    "https://edumind-backend-v74a.onrender.com/generate",
    headers={"Authorization": f"Bearer {token}"},
    json={"material_id": material_id, "resource_type": "podcast"}
)

print("Generation Status:", gen_res.status_code)
print("Generation Response:", json.dumps(gen_res.json(), indent=2))
