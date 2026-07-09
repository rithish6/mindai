from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EduMind AI"
    environment: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/edumind"
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: Optional[str] = None
    storage_bucket: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
