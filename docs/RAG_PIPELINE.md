# RAG Pipeline

EduMind AI's AI Tutor should answer from the student's uploaded material instead of relying only on model memory. Retrieval-Augmented Generation provides that grounding.

## Pipeline Steps

1. Upload material.
2. Store the original file in cloud storage.
3. Extract text from the file.
4. Clean and normalize extracted text.
5. Split text into chunks.
6. Generate embeddings for each chunk.
7. Store chunks and embeddings in a vector database.
8. When a user asks a question, embed the question.
9. Retrieve the most relevant chunks.
10. Send the question and retrieved context to the LLM.
11. Return the answer with source references.

## Supported Extraction Methods

| Input | Extraction Method |
| --- | --- |
| PDF | PDF parser and optional OCR |
| DOCX | Document parser |
| PPTX | Slide text parser |
| MP3/WAV | Whisper transcription |
| MP4/MOV | Audio extraction plus Whisper |
| YouTube | YouTube transcript API or audio transcription |
| Image | Tesseract OCR |

## Chunking Strategy

Recommended first version:

- 700 to 1,000 words per chunk
- 100 to 150 word overlap
- Preserve page numbers or timestamps when available
- Store course, material, page, and topic metadata

## Retrieval Strategy

Recommended first version:

- Top 5 semantic matches
- Optional metadata filter by selected material or course
- Rerank results later if answer quality needs improvement

## Prompt Shape

```text
You are EduMind AI Tutor.
Answer only using the provided study context.
If the context is not enough, say what is missing.
Explain clearly and step by step.
Include source references when possible.

Context:
{retrieved_chunks}

Question:
{student_question}
```

## Answer Quality Rules

- Prefer simple student-friendly explanations.
- Cite source chunk IDs, page numbers, or timestamps.
- Do not invent facts outside retrieved context.
- Mention when uploaded material does not contain enough information.
- Offer a short follow-up practice question when useful.

## First Implementation Plan

1. Use local FAISS for embeddings.
2. Store chunk metadata in PostgreSQL.
3. Use an OpenAI-compatible embedding model.
4. Use an OpenAI-compatible chat model for final answers.
5. Add source citations in tutor responses.
