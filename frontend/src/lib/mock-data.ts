import {
  BarChart3,
  Brain,
  CalendarDays,
  FileText,
  GraduationCap,
  Image,
  Languages,
  Mic,
  Network,
  Podcast,
  Sparkles,
  Upload
} from "lucide-react";

export const modules = [
  { title: "Upload Center", description: "PDFs, slides, docs, recordings, videos, and links.", icon: Upload, status: "Ready" },
  { title: "AI Notes", description: "Structured notes with highlights and examples.", icon: FileText, status: "Mock" },
  { title: "AI Tutor", description: "RAG-based chat grounded in uploaded materials.", icon: Brain, status: "Mock" },
  { title: "Flashcards", description: "Active recall cards from each topic.", icon: Sparkles, status: "Mock" },
  { title: "Quizzes", description: "MCQ and short-answer practice with explanations.", icon: GraduationCap, status: "Mock" },
  { title: "Mind Maps", description: "Visual concept maps for chapters and courses.", icon: Network, status: "Mock" },
  { title: "Transcription", description: "Convert lectures and videos into searchable text.", icon: Mic, status: "Planned" },
  { title: "Podcast Studio", description: "Turn summaries into audio lessons.", icon: Podcast, status: "Planned" },
  { title: "Study Planner", description: "Calendar, exam mode, and revision schedule.", icon: CalendarDays, status: "Mock" },
  { title: "Analytics", description: "Study streaks, quiz trends, and weak topics.", icon: BarChart3, status: "Mock" },
  { title: "Image Doubt Solver", description: "OCR-powered step-by-step question help.", icon: Image, status: "Planned" },
  { title: "Translation", description: "Multilingual notes, summaries, and explanations.", icon: Languages, status: "Planned" }
];

export const recentMaterials = [
  { name: "Data Structures Unit 3.pdf", type: "PDF", progress: 86, generated: "Notes, quiz, flashcards" },
  { name: "Operating Systems Lecture.mp4", type: "Video", progress: 42, generated: "Transcript pending" },
  { name: "Machine Learning Slides.pptx", type: "Slides", progress: 74, generated: "Summary, mind map" }
];

export const weeklyStats = [
  { label: "Study hours", value: "18.5" },
  { label: "Quiz score", value: "82%" },
  { label: "Streak", value: "9 days" },
  { label: "Cards reviewed", value: "214" }
];
