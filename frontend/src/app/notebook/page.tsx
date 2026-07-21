"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BrainCircuit, 
  Headphones, 
  Layers, 
  GraduationCap, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Loader2, 
  SendHorizontal, 
  BookOpen, 
  Pin, 
  Edit3, 
  Save, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Video, 
  FileAudio, 
  Link2, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  PlusCircle,
  Clipboard,
  Check,
  Headset,
  BookOpenCheck
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getMaterials, 
  uploadMaterial, 
  generateResource, 
  Material, 
  API_BASE_URL 
} from "@/lib/api";

type Message = {
  role: "Student" | "SnapLearn with EduMind";
  text: string;
  sources?: string[];
  timestamp: string;
};

type DialogueLine = {
  host: "Host A" | "Host B";
  text: string;
};

type Flashcard = {
  question: string;
  answer: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type SavedNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
};

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Hindi",
  "Arabic",
  "Portuguese"
];

export default function NotebookPage() {
  const { user } = useAuth();
  
  // Sources State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Config
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [activeTab, setActiveTab] = useState<"chat" | "guide" | "podcast" | "flashcards" | "quiz" | "notes">("chat");

  // Chat Tab State
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Study Guide Tab State
  const [guideContent, setGuideContent] = useState("");
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideStatus, setGuideStatus] = useState("Ready to generate Study Guide.");

  // Podcast Tab State
  const [podcastScript, setPodcastScript] = useState<DialogueLine[]>([]);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastStatus, setPodcastStatus] = useState("Ready to generate podcast audio overview.");
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [isPausedPodcast, setIsPausedPodcast] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hostAVoice, setHostAVoice] = useState("");
  const [hostBVoice, setHostBVoice] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // Flashcards Tab State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [cardsStatus, setCardsStatus] = useState("Ready to generate Flashcards.");
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Quiz Tab State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizStatus, setQuizStatus] = useState("Ready to generate Quiz.");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // Saved Notes Tab State
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [noteTitleInput, setNoteTitleInput] = useState("");
  const [noteContentInput, setNoteContentInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Load materials & voices & saved notes on mount
  useEffect(() => {
    fetchMaterials();
    loadTTSVoices();
    loadNotesFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatSending]);

  // Handle voices loading
  const loadTTSVoices = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const getAvailableVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        const english = available.filter(v => v.lang.startsWith("en"));
        if (english.length >= 2) {
          setHostAVoice(english[0].name);
          setHostBVoice(english[1].name);
        } else if (available.length > 0) {
          setHostAVoice(available[0].name);
          setHostBVoice(available[0].name);
        }
      };
      getAvailableVoices();
      window.speechSynthesis.onvoiceschanged = getAvailableVoices;
    }
  };

  const fetchMaterials = () => {
    getMaterials()
      .then(mats => {
        setMaterials(mats);
        // Default select the first material if none selected
        if (mats.length > 0 && selectedMaterialIds.length === 0) {
          setSelectedMaterialIds([mats[0].id]);
        }
      })
      .catch(err => console.error("Failed to load materials", err));
  };

  const loadNotesFromStorage = () => {
    if (typeof window !== "undefined" && user?.uid) {
      const key = `edumind_notes_${user.uid}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setSavedNotes(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse notes", e);
        }
      }
    }
  };

  const saveNotesToStorage = (updatedNotes: SavedNote[]) => {
    if (typeof window !== "undefined" && user?.uid) {
      const key = `edumind_notes_${user.uid}`;
      localStorage.setItem(key, JSON.stringify(updatedNotes));
      setSavedNotes(updatedNotes);
    }
  };

  // Toggle Source Materials
  const handleToggleMaterial = (id: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSelectAllSources = () => {
    if (selectedMaterialIds.length === materials.length) {
      setSelectedMaterialIds([]);
    } else {
      setSelectedMaterialIds(materials.map(m => m.id));
    }
  };

  // Upload source
  const handleUploadSource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading source material...");

    try {
      const uploaded = await uploadMaterial(file);
      setMaterials(prev => [uploaded, ...prev]);
      setSelectedMaterialIds(prev => [...prev, uploaded.id]);
      setUploadStatus("Source uploaded successfully!");
    } catch (err: any) {
      setUploadStatus(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // RAG Chat Submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = questionInput.trim();
    if (!query || isChatSending) return;

    if (selectedMaterialIds.length === 0) {
      alert("Please select at least one source material on the left before chatting.");
      return;
    }

    setMessages(prev => [...prev, { 
      role: "Student", 
      text: query, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setQuestionInput("");
    setIsChatSending(true);

    try {
      const token = await user?.getIdToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const geminiKey = localStorage.getItem("gemini_api_key");
      const openaiKey = localStorage.getItem("openai_api_key");
      if (geminiKey) headers["x-gemini-key"] = geminiKey;
      if (openaiKey) headers["x-openai-key"] = openaiKey;

      const chatHistoryPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch(`${API_BASE_URL}/tutor/ask-stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          question: query, 
          material_ids: selectedMaterialIds,
          chat_history: chatHistoryPayload
        })
      });

      if (!res.ok) {
        let errorMsg = `Tutor failed: ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      setMessages(prev => [...prev, { 
        role: "SnapLearn with EduMind", 
        text: "", 
        sources: [], 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "sources") {
              setMessages(current => {
                const copy = [...current];
                const last = copy[copy.length - 1];
                if (last && last.role === "SnapLearn with EduMind") {
                  last.sources = parsed.content;
                }
                return copy;
              });
            } else if (parsed.type === "text") {
              setMessages(current => {
                const copy = [...current];
                const last = copy[copy.length - 1];
                if (last && last.role === "SnapLearn with EduMind") {
                  last.text += parsed.content;
                }
                return copy;
              });
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch (e) {
            console.error("Stream parsing chunk error:", e);
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: "SnapLearn with EduMind", 
        text: err?.message || "I encountered an error connecting to the AI Tutor. Please check your network and API keys.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Pin message to notes
  const handlePinToNotes = (text: string) => {
    const newNote: SavedNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Pinned Concept - ${new Date().toLocaleDateString()}`,
      content: text,
      createdAt: new Date().toLocaleString(),
      isPinned: true
    };
    const updated = [newNote, ...savedNotes];
    saveNotesToStorage(updated);
    alert("AI response pinned successfully to the 'Saved Notes' tab!");
  };

  // Generate Study Guide Summary
  const handleGenerateGuide = async () => {
    if (selectedMaterialIds.length === 0) {
      alert("Please select source materials on the left.");
      return;
    }

    setIsGeneratingGuide(true);
    setGuideStatus(`Analyzing selected sources in ${selectedLanguage}...`);
    setGuideContent("");

    try {
      const token = await user?.getIdToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const geminiKey = localStorage.getItem("gemini_api_key");
      const openaiKey = localStorage.getItem("openai_api_key");
      if (geminiKey) headers["x-gemini-key"] = geminiKey;
      if (openaiKey) headers["x-openai-key"] = openaiKey;

      const res = await fetch(`${API_BASE_URL}/generate/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          material_ids: selectedMaterialIds,
          resource_type: "summary",
          language: selectedLanguage
        })
      });

      if (!res.ok) {
        let errorMsg = `Guide generation failed: ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "text") {
              setGuideContent(current => current + parsed.content);
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch (e: any) {
            if (e.message.startsWith("AI operation failed")) throw e;
          }
        }
      }
      setGuideStatus(`Study guide generated successfully!`);
    } catch (err: any) {
      setGuideStatus(err.message || "Failed to generate guide.");
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleDownloadGuide = () => {
    if (!guideContent) return;
    const blob = new Blob([guideContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Study-Guide-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Podcast Overview
  const handleGeneratePodcast = async () => {
    if (selectedMaterialIds.length === 0) {
      alert("Please select source materials on the left.");
      return;
    }

    stopPodcastPlayback();
    setIsGeneratingPodcast(true);
    setPodcastStatus("Analyzing material and scripting conversational dialogue...");
    setPodcastScript([]);

    try {
      const response = await generateResource(selectedMaterialIds, "podcast", selectedLanguage);
      
      const parsedLines: DialogueLine[] = response.content.map((line, idx) => {
        if (line.startsWith("Host A:")) {
          return { host: "Host A", text: line.replace("Host A:", "").trim() };
        } else if (line.startsWith("Host B:")) {
          return { host: "Host B", text: line.replace("Host B:", "").trim() };
        } else {
          return { host: idx % 2 === 0 ? "Host A" : "Host B", text: line.trim() };
        }
      });

      setPodcastScript(parsedLines);
      setPodcastStatus(`Dual-host discussion overview successfully created.`);
    } catch (err: any) {
      setPodcastStatus(err.message || "Failed to create podcast script.");
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  // TTS Podcast Playback
  const speakPodcastLine = (index: number) => {
    if (index >= podcastScript.length) {
      stopPodcastPlayback();
      return;
    }

    setCurrentLineIndex(index);
    const line = podcastScript[index];
    const selectedVoiceName = line.host === "Host A" ? hostAVoice : hostBVoice;
    const selectedVoice = voices.find(v => v.name === selectedVoiceName);

    const utterance = new SpeechSynthesisUtterance(line.text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.pitch = line.host === "Host A" ? 0.95 : 1.15;
    utterance.rate = 1.05;

    utterance.onend = () => {
      if (isPlayingPodcast && !isPausedPodcast) {
        speakPodcastLine(index + 1);
      }
    };

    utterance.onerror = () => {
      stopPodcastPlayback();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Scroll script line into view
    if (scriptContainerRef.current) {
      const activeElement = scriptContainerRef.current.querySelector(`[data-podcast-line="${index}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const startPodcastPlayback = () => {
    if (podcastScript.length === 0) return;

    if (isPausedPodcast) {
      window.speechSynthesis.resume();
      setIsPausedPodcast(false);
      setIsPlayingPodcast(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingPodcast(true);
      setIsPausedPodcast(false);
      speakPodcastLine(0);
    }
  };

  const pausePodcastPlayback = () => {
    if (isPlayingPodcast) {
      window.speechSynthesis.pause();
      setIsPausedPodcast(true);
      setIsPlayingPodcast(false);
    }
  };

  const stopPodcastPlayback = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingPodcast(false);
    setIsPausedPodcast(false);
    setCurrentLineIndex(null);
    utteranceRef.current = null;
  };

  // Generate Flashcards
  const handleGenerateCards = async () => {
    if (selectedMaterialIds.length === 0) {
      alert("Please select source materials on the left.");
      return;
    }

    setIsGeneratingCards(true);
    setCardsStatus("Synthesizing concepts into flashcards...");
    setFlashcards([]);
    setFlippedCards({});

    try {
      const response = await generateResource(selectedMaterialIds, "flashcards", selectedLanguage);
      const parsedCards: Flashcard[] = [];

      for (const line of response.content) {
        const parts = line.split("|").map(p => p.trim());
        let q = "", a = "";
        for (const part of parts) {
          if (part.startsWith("Q:")) q = part.replace("Q:", "").trim();
          else if (part.startsWith("A:")) a = part.replace("A:", "").trim();
        }
        if (q && a) {
          parsedCards.push({ question: q, answer: a });
        }
      }

      setFlashcards(parsedCards);
      setCardsStatus(`Flashcards ready! Click to flip them.`);
    } catch (err: any) {
      setCardsStatus(err.message || "Failed to generate cards.");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const toggleCardFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    if (selectedMaterialIds.length === 0) {
      alert("Please select source materials on the left.");
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizStatus("Generating practice questions...");
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);

    try {
      const response = await generateResource(selectedMaterialIds, "quiz", selectedLanguage);
      const parsedQuestions: QuizQuestion[] = [];

      for (const line of response.content) {
        const parts = line.split("|").map(p => p.trim());
        let q = "", o: string[] = [], a = "";
        for (const part of parts) {
          if (part.startsWith("Q:")) q = part.replace("Q:", "").trim();
          else if (part.startsWith("O:")) o = part.replace("O:", "").split(",").map(s => s.trim());
          else if (part.startsWith("A:")) a = part.replace("A:", "").trim();
        }
        if (q && o.length > 0 && a) {
          parsedQuestions.push({ question: q, options: o, answer: a });
        }
      }

      setQuizQuestions(parsedQuestions);
      setQuizStatus(`Quiz generated! Good luck.`);
    } catch (err: any) {
      setQuizStatus(err.message || "Failed to generate quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (option: string) => {
    if (selectedQuizAnswer !== null) return;
    setSelectedQuizAnswer(option);
    if (option === quizQuestions[currentQuestionIndex].answer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedQuizAnswer(null);
    }
  };

  // Saved Notes Management
  const handleAddCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitleInput.trim() || !noteContentInput.trim()) return;

    const newNote: SavedNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: noteTitleInput.trim(),
      content: noteContentInput.trim(),
      createdAt: new Date().toLocaleString()
    };

    const updated = [newNote, ...savedNotes];
    saveNotesToStorage(updated);
    setNoteTitleInput("");
    setNoteContentInput("");
    setIsAddingNote(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      const updated = savedNotes.filter(n => n.id !== id);
      saveNotesToStorage(updated);
    }
  };

  const handleStartEditNote = (note: SavedNote) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEditNote = (id: string) => {
    const updated = savedNotes.map(n => 
      n.id === id ? { ...n, title: editTitle.trim(), content: editContent.trim() } : n
    );
    saveNotesToStorage(updated);
    setEditingNoteId(null);
  };

  const handleCopyNoteText = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessId(id);
      setTimeout(() => setCopySuccessId(null), 2000);
    });
  };

  // Cleanup synthesis audio
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <AppShell eyebrow="Interactive Studio" title="Notebook Workspace">
      <div className="grid gap-6 py-4 xl:grid-cols-[290px_1fr] h-[calc(100vh-140px)] relative overflow-hidden">
        
        {/* Left column - Document sources list */}
        <aside className="rounded-2xl glass-panel p-5 flex flex-col h-full overflow-hidden border border-white/5 relative z-10">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="text-[15px] font-extrabold text-white">Source Materials</h2>
              <p className="text-[11px] text-textMuted mt-0.5">{materials.length} uploaded files</p>
            </div>
            {materials.length > 0 && (
              <button 
                onClick={handleSelectAllSources}
                className="text-[11px] font-bold text-primary hover:text-primaryHover transition-colors"
              >
                {selectedMaterialIds.length === materials.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {/* Sources list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {materials.map(mat => {
              const isSelected = selectedMaterialIds.includes(mat.id);
              let FileIcon = FileText;
              if (mat.material_type.startsWith("video/")) FileIcon = Video;
              else if (mat.material_type.startsWith("audio/")) FileIcon = FileAudio;
              else if (mat.material_type.includes("url") || mat.material_type.includes("youtube")) FileIcon = Link2;

              return (
                <div 
                  key={mat.id}
                  onClick={() => handleToggleMaterial(mat.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                    isSelected 
                      ? "bg-primary/10 border-primary/45 shadow-[0_0_12px_rgba(139,92,246,0.08)]" 
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate leading-tight ${isSelected ? "text-primary" : "text-white"}`}>
                      {mat.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <FileIcon size={12} className="text-textMuted shrink-0" />
                      <span className="text-[10px] text-textMuted capitalize truncate">
                        {mat.processing_status === "processed" ? "Active Source" : mat.processing_status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {materials.length === 0 && (
              <div className="text-center py-10">
                <FileText size={24} className="mx-auto text-textMuted/40 mb-3" />
                <p className="text-xs text-textMuted">No materials uploaded yet.</p>
              </div>
            )}
          </div>

          {/* Add source file button */}
          <div className="mt-4 pt-4 border-t border-border shrink-0">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleUploadSource}
              className="hidden"
              accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.md,.json,.csv,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
            />
            <button
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-xs font-bold text-white shadow-glow hover:bg-primaryHover transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add Source Material</span>
                </>
              )}
            </button>
            {uploadStatus && (
              <p className="text-[10px] text-center font-medium mt-2 text-success/90">{uploadStatus}</p>
            )}
          </div>
        </aside>

        {/* Right column - Unified Multi-tab Studio workspace */}
        <section className="rounded-2xl glass-panel p-6 shadow-surface flex flex-col h-full overflow-hidden relative z-10 border border-white/5">
          <div className="absolute top-[-30%] right-[-20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Tab Navigation header */}
          <div className="flex items-center justify-between border-b border-border pb-2 shrink-0 overflow-x-auto custom-scrollbar">
            <div className="flex bg-white/5 border border-border p-1 rounded-xl shrink-0">
              {[
                { id: "chat", label: "AI Tutor Chat", icon: BrainCircuit },
                { id: "guide", label: "Study Guide", icon: BookOpen },
                { id: "podcast", label: "Podcast Studio", icon: Headphones },
                { id: "flashcards", label: "Flashcards", icon: Layers },
                { id: "quiz", label: "Practice Quiz", icon: GraduationCap },
                { id: "notes", label: "Saved Notes", icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      stopPodcastPlayback();
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? "bg-primary text-white shadow-glow" 
                        : "text-textMuted hover:text-white"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-white" : "text-textMuted"} />
                    <span className="inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background/50 px-2.5 text-xs text-white focus:border-primary outline-none transition-all"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Tab Panels Area */}
          <div className="flex-1 overflow-hidden py-4">
            <AnimatePresence mode="wait">
              
              {/* 1. CHAT TAB */}
              {activeTab === "chat" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-5 text-primary animate-pulse">
                          <BrainCircuit size={28} />
                        </div>
                        <h3 className="text-base font-extrabold text-white mb-2">Notebook AI Chat</h3>
                        <p className="text-xs text-textMuted max-w-sm leading-relaxed">
                          Select one or more sources on the left and ask questions. The responses will be fully grounded in your custom materials!
                        </p>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex flex-col ${msg.role === "Student" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}`}
                      >
                        <div className={`flex items-center gap-2 mb-1.5 ${msg.role === "Student" ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest text-textMuted">{msg.role}</span>
                          <span className="text-[9px] text-textMuted/60">{msg.timestamp}</span>
                        </div>
                        <div className={`rounded-2xl px-4.5 py-3.5 text-xs sm:text-[13px] leading-relaxed border ${
                          msg.role === "Student" 
                            ? "bg-primary border-primary/20 text-white shadow-glow rounded-tr-none" 
                            : "bg-surface border-border text-textMuted rounded-tl-none"
                        }`}>
                          {msg.role === "Student" ? (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <div className="prose prose-invert max-w-none text-textMuted select-text">
                              <ReactMarkdown
                                components={{
                                  h2: ({ ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5 border-b border-white/5 pb-0.5" {...props} />,
                                  h3: ({ ...props }) => <h3 className="text-xs font-semibold text-white/90 mt-2 mb-1" {...props} />,
                                  p: ({ ...props }) => <p className="leading-relaxed mb-2" {...props} />,
                                  ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
                                  ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
                                  li: ({ ...props }) => <li className="text-[12px]" {...props} />,
                                  code: ({ ...props }) => <code className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[11px] text-primary" {...props} />
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Pin Response & Citations block */}
                          {msg.role !== "Student" && (
                            <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {msg.sources?.length ? (
                                  <>
                                    <span className="text-[9px] font-black uppercase text-textMuted shrink-0">Grounded in:</span>
                                    {msg.sources.map((src, i) => (
                                      <span key={i} className="text-[9px] font-semibold text-white/70 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                        {src}
                                      </span>
                                    ))}
                                  </>
                                ) : (
                                  <span className="text-[9px] text-textMuted/60 italic">AI generated response</span>
                                )}
                              </div>
                              <button
                                onClick={() => handlePinToNotes(msg.text)}
                                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primaryHover transition-colors bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg shrink-0"
                                title="Pin to Saved Notes"
                              >
                                <Pin size={10} />
                                <span>Pin Note</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isChatSending && (
                      <div className="mr-auto max-w-[85%] flex flex-col">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-textMuted">AI Tutor</span>
                        </div>
                        <div className="rounded-2xl px-5 py-4 bg-surface border border-border text-textMuted rounded-tl-none flex items-center gap-3">
                          <Loader2 size={16} className="animate-spin text-primary" />
                          <span className="text-xs">Thinking and fetching sources...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input box */}
                  <form onSubmit={handleChatSubmit} className="flex gap-2.5 shrink-0">
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="Ask the AI Tutor anything about your sources..."
                      disabled={isChatSending || selectedMaterialIds.length === 0}
                      className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-xs sm:text-sm text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary shadow-inner placeholder:text-textMuted/50"
                    />
                    <button
                      type="submit"
                      disabled={isChatSending || !questionInput.trim() || selectedMaterialIds.length === 0}
                      className="grid place-items-center w-11 h-11 bg-primary hover:bg-primaryHover text-white rounded-xl shadow-glow transition-all disabled:opacity-40"
                    >
                      <SendHorizontal size={16} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* 2. STUDY GUIDE TAB */}
              {activeTab === "guide" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-5 h-full lg:grid-cols-[260px_1fr]"
                >
                  <aside className="rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col justify-between h-fit">
                    <div>
                      <h3 className="text-xs font-bold text-white mb-2">Overview Generator</h3>
                      <p className="text-[11px] text-textMuted leading-relaxed">
                        Generate a comprehensive, structured study summary including timelines, concepts, definitions, and headers.
                      </p>
                      <button
                        onClick={handleGenerateGuide}
                        disabled={isGeneratingGuide || selectedMaterialIds.length === 0}
                        className="w-full mt-4 flex items-center justify-center gap-1.5 h-10 bg-primary text-xs font-bold text-white rounded-xl shadow-glow hover:bg-primaryHover transition-all disabled:opacity-50"
                      >
                        {isGeneratingGuide ? <Loader2 size={14} className="animate-spin" /> : <BookOpenCheck size={14} />}
                        <span>{isGeneratingGuide ? "Generating..." : "Generate Guide"}</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-semibold text-center text-textMuted">{guideStatus}</p>
                      {guideContent && (
                        <button
                          onClick={handleDownloadGuide}
                          className="w-full mt-3 flex items-center justify-center gap-1.5 h-9 bg-white/5 border border-border text-[11px] font-bold text-white rounded-lg hover:bg-white/10 transition-all"
                        >
                          <Download size={12} />
                          <span>Export Markdown</span>
                        </button>
                      )}
                    </div>
                  </aside>

                  <div className="rounded-xl border border-border bg-background/50 p-6 overflow-y-auto custom-scrollbar h-[62vh]">
                    {guideContent ? (
                      <div className="select-text prose prose-invert max-w-none text-textMuted">
                        <ReactMarkdown
                          components={{
                            h1: ({ ...props }) => <h1 className="text-xl font-black text-white mt-5 mb-3 border-b border-border pb-2" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-lg font-bold text-white mt-4 mb-2.5 border-b border-white/5 pb-1" {...props} />,
                            h3: ({ ...props }) => <h3 className="text-sm font-bold text-white/95 mt-3 mb-1.5" {...props} />,
                            p: ({ ...props }) => <p className="text-xs sm:text-sm leading-relaxed mb-3" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-textMuted" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-textMuted" {...props} />,
                            li: ({ ...props }) => <li className="text-xs sm:text-[13px] leading-relaxed" {...props} />,
                            blockquote: ({ ...props }) => (
                              <blockquote className="border-l-4 border-primary bg-white/5 pl-4 py-2 my-3 rounded-r-xl text-xs text-textMuted italic" {...props} />
                            ),
                            table: ({ ...props }) => <table className="w-full border-collapse border border-white/10 my-4 text-xs" {...props} />,
                            th: ({ ...props }) => <th className="border border-white/10 bg-white/5 px-3 py-2 text-left font-bold text-white" {...props} />,
                            td: ({ ...props }) => <td className="border border-white/10 px-3 py-2 text-textMuted" {...props} />,
                            code: ({ ...props }) => (
                              <code className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[11px] text-primary" {...props} />
                            )
                          }}
                        >
                          {guideContent}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <FileText size={32} className="text-textMuted/30 mb-4" />
                        <h3 className="text-sm font-bold text-white mb-1.5">No Study Guide Yet</h3>
                        <p className="text-xs text-textMuted max-w-xs leading-relaxed">
                          Click &quot;Generate Guide&quot; in the options panel to write a combined summary of all checked source files.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 3. PODCAST STUDIO TAB */}
              {activeTab === "podcast" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-5 h-full lg:grid-cols-[260px_1fr]"
                >
                  <aside className="rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col justify-between h-fit gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-white mb-1.5">Audio Overview</h3>
                      <p className="text-[11px] text-textMuted leading-relaxed mb-4">
                        Synthesizes source contents into a dual-host conversational podcast script.
                      </p>
                      <button
                        onClick={handleGeneratePodcast}
                        disabled={isGeneratingPodcast || selectedMaterialIds.length === 0}
                        className="w-full flex items-center justify-center gap-1.5 h-10 bg-primary text-xs font-bold text-white rounded-xl shadow-glow hover:bg-primaryHover transition-all disabled:opacity-50"
                      >
                        {isGeneratingPodcast ? <Loader2 size={14} className="animate-spin" /> : <Headset size={14} />}
                        <span>{isGeneratingPodcast ? "Generating..." : "Generate Audio"}</span>
                      </button>
                    </div>

                    {podcastScript.length > 0 && (
                      <div className="pt-3 border-t border-white/5 space-y-3 shrink-0">
                        <div className="flex items-center gap-2 justify-center bg-background/50 py-2 rounded-xl border border-border">
                          {isPlayingPodcast ? (
                            <button
                              onClick={pausePodcastPlayback}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                              <Pause size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={startPodcastPlayback}
                              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-glow hover:bg-primaryHover transition-all"
                            >
                              <Play size={14} className="ml-0.5" />
                            </button>
                          )}
                          <button
                            onClick={stopPodcastPlayback}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                          >
                            <Square size={14} />
                          </button>
                        </div>

                        {/* Voices Settings dropdowns */}
                        <div className="space-y-2.5">
                          <div>
                            <label className="text-[9px] font-black uppercase text-textMuted tracking-wider block mb-1">Host A Voice</label>
                            <select
                              value={hostAVoice}
                              onChange={(e) => setHostAVoice(e.target.value)}
                              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-[10px] text-white focus:border-primary outline-none"
                            >
                              {voices.map(v => (
                                <option key={`a-${v.name}`} value={v.name}>{v.name} ({v.lang})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-textMuted tracking-wider block mb-1">Host B Voice</label>
                            <select
                              value={hostBVoice}
                              onChange={(e) => setHostBVoice(e.target.value)}
                              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-[10px] text-white focus:border-primary outline-none"
                            >
                              {voices.map(v => (
                                <option key={`b-${v.name}`} value={v.name}>{v.name} ({v.lang})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-[10px] font-bold text-center text-textMuted mt-1">{podcastStatus}</p>
                  </aside>

                  <div 
                    ref={scriptContainerRef}
                    className="rounded-xl border border-border bg-background/50 p-6 overflow-y-auto custom-scrollbar h-[62vh] space-y-4"
                  >
                    {podcastScript.length > 0 ? (
                      podcastScript.map((line, idx) => {
                        const isActive = currentLineIndex === idx;
                        const isA = line.host === "Host A";

                        return (
                          <div
                            key={idx}
                            data-podcast-line={idx}
                            onClick={() => {
                              stopPodcastPlayback();
                              setIsPlayingPodcast(true);
                              speakPodcastLine(idx);
                            }}
                            className={`flex flex-col cursor-pointer transition-all duration-200 ${
                              isA ? "items-start mr-10" : "items-end ml-10"
                            }`}
                          >
                            <span className="text-[9px] font-black text-textMuted uppercase mb-1">{line.host}</span>
                            <div className={`rounded-xl px-4 py-2.5 text-xs sm:text-[13px] border leading-relaxed transition-all ${
                              isActive 
                                ? "bg-primary/20 border-primary/45 text-white shadow-glow scale-[1.01]" 
                                : "bg-surface border-border text-textMuted hover:bg-white/5"
                            }`}>
                              <p>{line.text}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <Headphones size={32} className="text-textMuted/30 mb-4" />
                        <h3 className="text-sm font-bold text-white mb-1.5">No Script Generated</h3>
                        <p className="text-xs text-textMuted max-w-xs leading-relaxed">
                          Click &quot;Generate Audio&quot; in the panel on the left to write an interactive host overview script of your sources.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 4. FLASHCARDS TAB */}
              {activeTab === "flashcards" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
                    <p className="text-xs font-semibold text-textMuted">{cardsStatus}</p>
                    <button
                      onClick={handleGenerateCards}
                      disabled={isGeneratingCards || selectedMaterialIds.length === 0}
                      className="flex items-center gap-1.5 h-9 bg-primary text-xs font-bold text-white px-4 rounded-xl shadow-glow hover:bg-primaryHover transition-all disabled:opacity-50"
                    >
                      {isGeneratingCards ? <Loader2 size={12} className="animate-spin" /> : <Layers size={12} />}
                      <span>{isGeneratingCards ? "Generating..." : "Generate Cards"}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {flashcards.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-2">
                        {flashcards.map((card, idx) => {
                          const isFlipped = flippedCards[idx] || false;
                          return (
                            <div 
                              key={idx}
                              onClick={() => toggleCardFlip(idx)}
                              className="h-44 w-full cursor-pointer relative perspective-1000 group select-none"
                            >
                              <div className={`w-full h-full duration-500 transform-style-3d relative rounded-xl border border-border shadow-surface transition-all ${
                                isFlipped ? "rotate-y-180 bg-primary/10 border-primary/20" : "bg-surface hover:border-white/20"
                              }`}>
                                {/* Front Side */}
                                <div className={`absolute inset-0 backface-hidden p-5 flex flex-col justify-between ${
                                  isFlipped ? "opacity-0" : "opacity-100"
                                }`}>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-textMuted">Front</span>
                                  <p className="text-xs sm:text-sm font-semibold text-white text-center leading-relaxed my-auto font-bold">
                                    {card.question}
                                  </p>
                                  <span className="text-[10px] text-primary font-bold text-center">Click to reveal answer</span>
                                </div>

                                {/* Back Side */}
                                <div className={`absolute inset-0 backface-hidden p-5 flex flex-col justify-between rotate-y-180 ${
                                  isFlipped ? "opacity-100" : "opacity-0"
                                }`}>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Answer</span>
                                  <p className="text-xs sm:text-sm text-textMuted text-center leading-relaxed my-auto">
                                    {card.answer}
                                  </p>
                                  <span className="text-[10px] text-textMuted/60 text-center">Click to flip back</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <Layers size={32} className="text-textMuted/30 mb-4" />
                        <h3 className="text-sm font-bold text-white mb-1.5">No Flashcards Created</h3>
                        <p className="text-xs text-textMuted max-w-xs leading-relaxed">
                          Click &quot;Generate Cards&quot; to synthesize important formulas, concepts, and definitions into interactive flipping study cards.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 5. PRACTICE QUIZ TAB */}
              {activeTab === "quiz" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5 shrink-0">
                    <p className="text-xs font-semibold text-textMuted">{quizStatus}</p>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGeneratingQuiz || selectedMaterialIds.length === 0}
                      className="flex items-center gap-1.5 h-9 bg-primary text-xs font-bold text-white px-4 rounded-xl shadow-glow hover:bg-primaryHover transition-all disabled:opacity-50"
                    >
                      {isGeneratingQuiz ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
                      <span>{isGeneratingQuiz ? "Generating..." : "Generate Quiz"}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {quizQuestions.length > 0 ? (
                      <div className="max-w-2xl mx-auto rounded-xl bg-white/5 border border-border p-6 shadow-surface">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black uppercase text-primary">
                            Question {currentQuestionIndex + 1} of {quizQuestions.length}
                          </span>
                          <span className="text-xs bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg text-white font-bold">
                            Score: {quizScore}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${((selectedQuizAnswer !== null ? currentQuestionIndex + 1 : currentQuestionIndex) / quizQuestions.length) * 100}%` }}
                          />
                        </div>

                        <h2 className="text-[15px] sm:text-base font-bold text-white leading-relaxed mb-6">
                          {quizQuestions[currentQuestionIndex].question}
                        </h2>

                        <div className="grid gap-3">
                          {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                            const isCorrect = option === quizQuestions[currentQuestionIndex].answer;
                            const isSelected = option === selectedQuizAnswer;
                            const hasAnswered = selectedQuizAnswer !== null;

                            let btnStyle = "flex items-center justify-between min-h-12 w-full text-left px-4 py-3 border rounded-xl text-xs sm:text-sm font-semibold transition-all ";
                            let IconComponent = null;

                            if (hasAnswered) {
                              if (isCorrect) {
                                btnStyle += "bg-success/15 border-success/30 text-success shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                IconComponent = <CheckCircle2 size={16} className="text-success shrink-0" />;
                              } else if (isSelected) {
                                btnStyle += "bg-danger/15 border-danger/30 text-danger";
                                IconComponent = <XCircle size={16} className="text-danger shrink-0" />;
                              } else {
                                btnStyle += "border-transparent bg-white/5 opacity-55";
                              }
                            } else {
                              btnStyle += "border-border bg-background hover:bg-white/5 text-textMuted hover:text-white";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={hasAnswered}
                                onClick={() => handleSelectQuizOption(option)}
                                className={btnStyle}
                              >
                                <span className="pr-4 leading-relaxed">{option}</span>
                                {IconComponent ? IconComponent : <div className="w-4 h-4 rounded-full border border-border shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer next controls */}
                        <div className="mt-8 flex justify-end h-10">
                          {selectedQuizAnswer !== null && currentQuestionIndex < quizQuestions.length - 1 && (
                            <button
                              onClick={handleNextQuizQuestion}
                              className="flex items-center gap-1 bg-primary text-xs font-bold text-white px-5 rounded-xl shadow-glow hover:bg-primaryHover transition-all"
                            >
                              <span>Next Question</span>
                              <ChevronRight size={14} />
                            </button>
                          )}
                          {selectedQuizAnswer !== null && currentQuestionIndex === quizQuestions.length - 1 && (
                            <div className="w-full text-center py-4 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
                              <p className="text-sm font-bold text-white">Quiz Completed!</p>
                              <p className="text-xs text-textMuted mt-1">Final Score: <span className="text-white font-bold">{quizScore}</span> / {quizQuestions.length}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <GraduationCap size={32} className="text-textMuted/30 mb-4" />
                        <h3 className="text-sm font-bold text-white mb-1.5">No Quiz Available</h3>
                        <p className="text-xs text-textMuted max-w-xs leading-relaxed">
                          Click &quot;Generate Quiz&quot; to test your understanding of the selected sources with interactive multiple choice questions.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 6. SAVED NOTES TAB */}
              {activeTab === "notes" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
                    <p className="text-xs font-semibold text-textMuted">Create and manage your study notecards ({savedNotes.length})</p>
                    <button
                      onClick={() => setIsAddingNote(!isAddingNote)}
                      className="flex items-center gap-1.5 h-9 bg-primary text-xs font-bold text-white px-4 rounded-xl shadow-glow hover:bg-primaryHover transition-all"
                    >
                      <PlusCircle size={14} />
                      <span>{isAddingNote ? "View Notes" : "New Note"}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* Add note form */}
                    {isAddingNote ? (
                      <form onSubmit={handleAddCustomNote} className="max-w-xl mx-auto rounded-xl border border-border bg-white/5 p-5 space-y-4 shadow-surface">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create Custom Note Card</h3>
                        <div>
                          <label className="text-[10px] font-black uppercase text-textMuted tracking-wider block mb-1">Title</label>
                          <input
                            type="text"
                            value={noteTitleInput}
                            onChange={(e) => setNoteTitleInput(e.target.value)}
                            placeholder="e.g. Study Formulas, Key Definitions"
                            required
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-textMuted tracking-wider block mb-1">Content</label>
                          <textarea
                            value={noteContentInput}
                            onChange={(e) => setNoteContentInput(e.target.value)}
                            placeholder="Type or paste your summary notes here..."
                            required
                            rows={6}
                            className="w-full rounded-lg border border-border bg-background p-3 text-xs sm:text-sm text-white focus:border-primary outline-none resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingNote(false)}
                            className="h-9 px-4 rounded-lg border border-border hover:bg-white/5 text-[11px] font-bold text-white transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="h-9 px-5 rounded-lg bg-primary text-[11px] font-bold text-white shadow-glow hover:bg-primaryHover transition-all"
                          >
                            Save Note Card
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Grid of note cards */}
                        {savedNotes.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-2">
                            {savedNotes.map((note) => {
                              const isEditing = editingNoteId === note.id;
                              return (
                                <div 
                                  key={note.id}
                                  className="rounded-xl border border-border bg-surface/50 p-4.5 flex flex-col justify-between shadow-surface min-h-[170px] relative overflow-hidden"
                                >
                                  {note.isPinned && (
                                    <div className="absolute top-0 right-0 bg-primary/20 text-primary border-b border-l border-primary/25 rounded-bl-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                      <Pin size={8} />
                                      <span>Pinned</span>
                                    </div>
                                  )}

                                  {isEditing ? (
                                    <div className="flex-1 space-y-3.5">
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="h-8 w-full rounded border border-border bg-background px-2.5 text-xs text-white outline-none focus:border-primary"
                                      />
                                      <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={4}
                                        className="w-full rounded border border-border bg-background p-2.5 text-xs text-white outline-none focus:border-primary resize-none"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => setEditingNoteId(null)}
                                          className="grid place-items-center w-7 h-7 bg-white/5 border border-border text-white rounded hover:bg-white/10"
                                        >
                                          <X size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleSaveEditNote(note.id)}
                                          className="grid place-items-center w-7 h-7 bg-primary text-white rounded hover:bg-primaryHover shadow-glow"
                                        >
                                          <Save size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1">
                                        <h4 className="text-xs font-bold text-white pr-10 truncate">{note.title}</h4>
                                        <span className="text-[8px] text-textMuted/60 block mt-0.5">{note.createdAt}</span>
                                        <p className="text-xs text-textMuted leading-relaxed mt-2.5 line-clamp-5 select-text whitespace-pre-wrap">
                                          {note.content}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-end gap-1.5 mt-4 pt-2.5 border-t border-white/5">
                                        <button
                                          onClick={() => handleCopyNoteText(note.id, note.content)}
                                          className="grid place-items-center w-7 h-7 bg-white/5 border border-border hover:bg-white/10 text-white rounded transition-colors"
                                          title="Copy Note Text"
                                        >
                                          {copySuccessId === note.id ? <Check size={12} className="text-success" /> : <Clipboard size={12} />}
                                        </button>
                                        <button
                                          onClick={() => handleStartEditNote(note)}
                                          className="grid place-items-center w-7 h-7 bg-white/5 border border-border hover:bg-white/10 text-white rounded transition-colors"
                                          title="Edit Note Card"
                                        >
                                          <Edit3 size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteNote(note.id)}
                                          className="grid place-items-center w-7 h-7 bg-white/5 border border-border hover:bg-white/10 text-white rounded hover:text-danger hover:border-danger/35 transition-colors"
                                          title="Delete Note Card"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <FileText size={32} className="text-textMuted/30 mb-4" />
                            <h3 className="text-sm font-bold text-white mb-1.5">No Saved Notes</h3>
                            <p className="text-xs text-textMuted max-w-xs leading-relaxed">
                              Pin key insights directly from your AI Tutor conversations, or click &quot;New Note&quot; above to jot down custom study notecards.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
