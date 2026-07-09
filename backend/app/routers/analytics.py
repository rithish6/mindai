from __future__ import annotations

from typing import Any

from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def analytics_summary() -> dict[str, Any]:
    return {
        "study_hours": 18.5,
        "quiz_score": "82%",
        "streak_days": 9,
        "cards_reviewed": 214,
    }
