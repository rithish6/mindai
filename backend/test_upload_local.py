import requests
import json
import uuid

with open("test_upload_local.py", "rb") as f:
    # I don't need a real token because the local server has a /materials/debug-token endpoint! Wait no, /materials/upload requires a valid token!
    pass

# I'll modify main.py locally to print the exception to a file! No, I can just see the terminal output of uvicorn!
