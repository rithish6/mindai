# Architecture

EduMind AI uses a full-stack architecture with a web frontend, API backend, storage, database, vector search, and AI services.

## Frontend

The frontend is a Next.js application written in TypeScript. It provides:

- Dashboard
- Material upload workspace
- AI Tutor chat
- Notes, summaries, flashcards, quizzes, and mind maps
- Study planner and analytics screens
- Settings and profile management

## Backend

The backend is a FastAPI application. It is responsible for:

- File upload APIs
- Material processing orchestration
- Generated learning resource APIs
- RAG tutor APIs
- Planner and analytics APIs
- Authentication integration
- Database and cache access

## Storage

Original files should be stored outside the database in cloud storage such as AWS S3 or Cloudinary.

## Database

PostgreSQL stores users, materials, generated resources, quiz attempts, planner tasks, messages, notifications, and analytics events.

## Cache

Redis can store temporary processing state, sessions, rate limits, background job status, and frequently requested dashboard data.

## AI Layer

The AI layer includes:

- Text extraction
- OCR
- Speech-to-text
- Chunking
- Embeddings
- Vector search
- RAG question answering
- Notes, quiz, flashcard, mind map, assignment, and podcast generation

## Deployment

Recommended deployment split:

- Frontend: Vercel
- Backend: Railway or Render
- Database: Managed PostgreSQL
- Cache: Managed Redis
- Storage: AWS S3 or Cloudinary
- CI/CD: GitHub Actions
