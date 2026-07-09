# API Design

Base URL for local development:

```text
http://localhost:8000
```

## Health

### GET `/health`

Returns API availability.

```json
{
  "status": "ok",
  "service": "edumind-ai-api"
}
```

## Materials

### GET `/materials`

Returns all uploaded materials for the authenticated user.

### POST `/materials/upload`

Uploads a file for processing.

Request:

```text
multipart/form-data
file: PDF, DOCX, PPTX, MP3, MP4, image, or text file
```

Response:

```json
{
  "id": "mat_uploaded_demo",
  "title": "chapter-1.pdf",
  "material_type": "application/pdf",
  "processing_status": "queued"
}
```

## Generation

### POST `/generate`

Generates notes, summaries, flashcards, quizzes, mind maps, podcasts, or assignments from a material.

Request:

```json
{
  "material_id": "mat_001",
  "resource_type": "notes"
}
```

Response:

```json
{
  "material_id": "mat_001",
  "resource_type": "notes",
  "status": "mocked",
  "content": ["Key concept summary", "Important definitions", "Practice prompts"]
}
```

## AI Tutor

### POST `/tutor/ask`

Answers a question using RAG over selected materials.

Request:

```json
{
  "material_ids": ["mat_001"],
  "question": "Explain CPU scheduling in simple terms."
}
```

Response:

```json
{
  "answer": "The AI answer grounded in retrieved material chunks.",
  "sources": ["chunk_001", "chunk_002"]
}
```

## Planner

### GET `/planner/tasks`

Returns upcoming study tasks.

## Analytics

### GET `/analytics/summary`

Returns dashboard-level learning statistics.

```json
{
  "study_hours": 18.5,
  "quiz_score": "82%",
  "streak_days": 9,
  "cards_reviewed": 214
}
```

## Future API Groups

- `/auth`
- `/users`
- `/courses`
- `/flashcards`
- `/quizzes`
- `/transcriptions`
- `/ocr`
- `/translate`
- `/podcasts`
- `/notifications`
