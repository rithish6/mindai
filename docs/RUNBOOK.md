# Development Runbook

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- Docker Desktop
- Git

## Setup

1. Copy `.env.example` to `.env`.
2. Fill API keys only when connecting real AI and storage services.
3. Start PostgreSQL and Redis:

```bash
docker compose up -d
```

4. Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

5. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Development Order

1. Keep the mock frontend usable.
2. Add real database models and migrations.
3. Connect material upload to backend storage.
4. Add document extraction.
5. Add chunking and embeddings.
6. Add RAG tutor answers.
7. Add AI generation endpoints for notes, summaries, quizzes, flashcards, and mind maps.
8. Add analytics events.
9. Add authentication.
10. Add deployment configuration.

## Testing Checklist

- Backend health endpoint responds.
- Upload endpoint accepts a file.
- Tutor endpoint returns an answer with sources.
- Planner endpoint returns tasks.
- Analytics endpoint returns dashboard metrics.
- Frontend routes load without layout overflow.
- Navigation works across dashboard, materials, tutor, notes, flashcards, quizzes, planner, and analytics.
