import os
os.environ["DATABASE_URL"] = "postgres://test"
from app.core.config import settings
print(settings.database_url)
