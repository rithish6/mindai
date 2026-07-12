import asyncio
from fastapi import FastAPI, UploadFile, File
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    return {"filename": file.filename}

client = TestClient(app)

def test():
    with open("test_db.py", "rb") as f:
        response = client.post("/upload", files={"file": ("test_db.py", f, "text/plain")})
    print(response.status_code, response.text)

test()
