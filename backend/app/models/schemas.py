from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class Material(BaseModel):
    id: str
    title: str
    material_type: str
    processing_status: str = "queued"


class GeneratedResourceRequest(BaseModel):
    material_id: Optional[str] = None
    material_ids: Optional[list[str]] = None
    resource_type: str = Field(pattern="^(notes|summary|flashcards|quiz|mindmap|podcast)$")
    language: str = "English"


class TutorQuestion(BaseModel):
    material_ids: list[str]
    question: str


class TutorAnswer(BaseModel):
    answer: str
    sources: list[str]


class StudyTask(BaseModel):
    id: Optional[str] = None
    title: str
    due_date: str
    topic: str
    estimated_minutes: int
