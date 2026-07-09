# EduMind AI

EduMind AI is an intelligent AI-powered learning management platform that turns study materials into personalized learning resources. Students can upload documents, lecture recordings, videos, or YouTube links, then generate notes, summaries, flashcards, quizzes, mind maps, podcasts, and context-aware answers through an AI tutor.

## Core Idea

The platform combines document processing, speech transcription, OCR, vector search, and large language models to create an interactive study system for students, educators, and self-learners.

## Planned Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query
- Backend: FastAPI, REST APIs, WebSocket updates
- AI: OpenAI-compatible LLMs, LangChain, RAG, Sentence Transformers, FAISS, Whisper, Tesseract OCR
- Database: PostgreSQL, Redis, FAISS or Pinecone
- Auth: Clerk, Supabase Auth, or JWT
- Storage: AWS S3 or Cloudinary
- Deployment: Vercel, Railway/Render, Docker, GitHub Actions

## Build Roadmap

1. Project planning, architecture, and documentation
2. Frontend and backend scaffolding
3. Authentication, user profiles, and dashboard
4. Upload pipeline for PDFs, docs, slides, audio, video, and links
5. AI generation modules for summaries, notes, flashcards, quizzes, and mind maps
6. RAG-based AI tutor
7. Study planner, reminders, analytics, and exam preparation mode
8. Transcription, OCR doubt solver, translation, and podcast generation
9. Testing, deployment setup, and presentation materials

## Current Status

The foundation has been created:

- Project blueprint
- Next.js frontend scaffold
- FastAPI backend scaffold
- Dashboard and main module screens
- API, database, architecture, and RAG documentation

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-minimal.txt
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

Use `requirements.txt` when you are ready to install the full AI stack for embeddings, FAISS, and LLM integrations.

### Database Services

```bash
docker compose up -d
```

This starts PostgreSQL and Redis for local development.

## Documentation

- `outputs/EduMind_AI_Project_Blueprint.md`
- `docs/ARCHITECTURE.md`
- `docs/API_DESIGN.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/RAG_PIPELINE.md`
