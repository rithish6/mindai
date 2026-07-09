# Database Schema

This schema is designed for PostgreSQL. Vector data can start in FAISS for local development and later move to Pinecone or pgvector if production search needs grow.

## users

Stores account-level identity data. If Clerk or Supabase Auth is used, this table stores the local application profile connected to the external auth ID.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| auth_provider_id | text | Clerk or Supabase user ID |
| email | text | Unique |
| full_name | text |  |
| avatar_url | text | Optional |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## profiles

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| education_level | text | School, college, exam prep, self-learning |
| preferred_language | text | Default language for generated content |
| daily_goal_minutes | integer |  |
| target_exam | text | Optional |

## courses

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Owner |
| title | text | Course or subject name |
| description | text | Optional |
| color | text | UI label color |
| created_at | timestamptz |  |

## materials

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Owner |
| course_id | uuid | Optional course grouping |
| title | text | Original or user-edited title |
| material_type | text | pdf, docx, pptx, audio, video, youtube, image |
| source_url | text | Cloud storage URL or YouTube URL |
| processing_status | text | queued, processing, processed, failed |
| extracted_text | text | Optional canonical extracted text |
| created_at | timestamptz |  |
| updated_at | timestamptz |  |

## material_chunks

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| material_id | uuid | Foreign key to materials |
| chunk_index | integer | Stable order |
| content | text | Chunk text |
| token_count | integer | Approximate count |
| embedding_ref | text | FAISS index ID, Pinecone ID, or pgvector reference |
| page_number | integer | Optional |
| timestamp_start | numeric | Optional for audio or video |
| timestamp_end | numeric | Optional for audio or video |

## generated_resources

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Owner |
| material_id | uuid | Source material |
| resource_type | text | notes, summary, flashcards, quiz, mindmap, podcast, assignment |
| title | text |  |
| content_json | jsonb | Structured generated output |
| created_at | timestamptz |  |

## quizzes

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| material_id | uuid | Source material |
| title | text |  |
| difficulty | text | easy, medium, hard, mixed |
| created_at | timestamptz |  |

## quiz_questions

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quiz_id | uuid | Foreign key to quizzes |
| question_text | text |  |
| question_type | text | mcq, short, true_false |
| options_json | jsonb | For MCQs |
| correct_answer | text |  |
| explanation | text |  |

## quiz_attempts

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quiz_id | uuid |  |
| user_id | uuid |  |
| score_percent | numeric |  |
| answers_json | jsonb | User answers |
| completed_at | timestamptz |  |

## tutor_conversations

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid |  |
| title | text |  |
| material_ids | uuid[] | Context scope |
| created_at | timestamptz |  |

## tutor_messages

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| conversation_id | uuid |  |
| role | text | user, assistant, system |
| content | text |  |
| sources_json | jsonb | Retrieved references |
| created_at | timestamptz |  |

## study_tasks

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid |  |
| course_id | uuid | Optional |
| title | text |  |
| task_type | text | read, revise, quiz, flashcards, exam |
| due_at | timestamptz |  |
| estimated_minutes | integer |  |
| status | text | pending, completed, skipped |

## analytics_events

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid |  |
| event_type | text | material_uploaded, quiz_completed, tutor_asked, flashcard_reviewed |
| metadata | jsonb | Flexible event payload |
| created_at | timestamptz |  |

## notifications

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid |  |
| title | text |  |
| body | text |  |
| channel | text | in_app, email |
| scheduled_at | timestamptz |  |
| sent_at | timestamptz | Optional |
