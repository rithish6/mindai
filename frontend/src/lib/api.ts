export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

export type Material = {
  id: string;
  title: string;
  material_type: string;
  processing_status: string;
};

export type StudyTask = {
  title: string;
  due_date: string;
  topic: string;
  estimated_minutes: number;
};

export type AnalyticsSummary = {
  study_hours: number;
  quiz_score: string;
  streak_days: number;
  cards_reviewed: number;
};

export type TutorAnswer = {
  answer: string;
  sources: string[];
};

import { auth } from "./firebase";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers = new Headers(init?.headers);
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (typeof window !== "undefined") {
    const geminiKey = localStorage.getItem("gemini_api_key");
    const openaiKey = localStorage.getItem("openai_api_key");
    if (geminiKey) {
      headers.set("x-gemini-key", geminiKey);
    }
    if (openaiKey) {
      headers.set("x-openai-key", openaiKey);
    }
  }

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.error || errorMsg;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export function getMaterials() {
  return request<Material[]>("/materials");
}

export function uploadMaterial(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<Material>("/materials/upload", {
    method: "POST",
    body: formData
  });
}

export function askTutor(question: string, materialIds: string[]) {
  return request<TutorAnswer>("/tutor/ask", {
    method: "POST",
    body: JSON.stringify({ question, material_ids: materialIds })
  });
}

export function getStudyTasks() {
  return request<StudyTask[]>("/planner/tasks");
}

export function createStudyTask(task: StudyTask) {
  return request<StudyTask>("/planner/tasks", {
    method: "POST",
    body: JSON.stringify(task)
  });
}

export function getAnalyticsSummary() {
  return request<AnalyticsSummary>(`/analytics/summary?t=${Date.now()}`);
}

export function generateResource(materialId: string | string[], resourceType: string, language: string = "English") {
  const body: any = { resource_type: resourceType, language };
  if (Array.isArray(materialId)) {
    body.material_ids = materialId;
  } else {
    body.material_id = materialId;
  }
  return request<{ content: string[]; status: string }>("/generate", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function askImageDoubt(file: File, question: string) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("question", question);
  
  return request<{ answer: string }>("/doubt/solve", {
    method: "POST",
    body: formData
  });
}
