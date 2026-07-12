import asyncio
from fastapi import FastAPI, UploadFile, File
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    return {"filename": file.filename}

client = TestClient(app)
with open("test_fastapi_multipart.py", "rb") as f:
    response = client.post("/upload", files={"file": ("test.py", f, "text/plain")})
print(response.status_code, response.text)
