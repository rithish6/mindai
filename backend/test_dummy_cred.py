import firebase_admin
from firebase_admin import auth
from google.auth.credentials import Credentials

class DummyCredential(Credentials):
    def __init__(self):
        super(DummyCredential, self).__init__()
        self.token = "dummy"
    def refresh(self, request):
        pass

project_id = "edumind-2427a"
firebase_admin.initialize_app(DummyCredential(), {'projectId': project_id})

try:
    auth.verify_id_token("dummy")
except Exception as e:
    print("verify error:", type(e), e)
