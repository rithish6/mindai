"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, SendHorizontal, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/app-shell";
import { getMaterials, Material, API_BASE_URL } from "@/lib/api";
import { auth } from "@/lib/firebase";

type Message = {
  role: "Student" | "SnapLearn with EduMind";
  text: string;
  sources?: string[];
};

export default function TutorPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMaterials().then(mats => {
      setMaterials(mats);
      if (mats.length > 0) {
        setSelectedMaterialIds([mats[0].id]);
      }
    }).catch(err => console.error("Failed to fetch materials", err));
  }, []);

  // Scroll to bottom helper
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    setMessages((current) => [...current, { role: "Student", text: trimmed }]);
    setQuestion("");
    setIsSending(true);

    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/tutor/ask-stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question: trimmed, material_ids: selectedMaterialIds })
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
      if (!reader) throw new Error("Connection failed: No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      
      // Append an empty assistant response first
      setMessages((current) => [
        ...current,
        { role: "SnapLearn with EduMind", text: "", sources: [] }
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Save partial line to buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = json_parsed(line);
            if (parsed.type === "sources") {
              setMessages((current) => {
                const copy = [...current];
                const last = copy[copy.length - 1];
                if (last && last.role === "SnapLearn with EduMind") {
                  last.sources = parsed.content;
                }
                return copy;
              });
            } else if (parsed.type === "text") {
              setMessages((current) => {
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
            console.error("Failed to parse chunk", e);
          }
        }
      }
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        { role: "SnapLearn with EduMind", text: err?.message || "I could not reach the backend. Check your connection or API keys." }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  // Safe JSON parser helper to prevent crashes
  function json_parsed(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  function toggleMaterial(id: string) {
    setSelectedMaterialIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }

  return (
    <AppShell eyebrow="RAG tutor" title="AI Tutor">
      <section className="grid gap-6 py-6 xl:grid-cols-[1fr_320px]">
        <div className="rounded-2xl glass-panel p-6 flex flex-col h-[75vh] shadow-surface relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          <div ref={chatContainerRef} className="grid gap-6 flex-1 overflow-y-auto pr-4 mb-6 relative z-10 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-6 text-primary">
                  <BrainCircuit size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">How can I help you study?</h3>
                <p className="text-sm text-textMuted max-w-sm">Select context materials on the right and ask me anything about your documents.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.text}-${index}`} className={`flex flex-col ${message.role === "Student" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}`}>
                <div className={`flex items-center gap-2 mb-2 ${message.role === "Student" ? "justify-end" : "justify-start"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">{message.role}</p>
                </div>
                <div className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed ${
                  message.role === "Student" 
                    ? "bg-primary text-white shadow-glow rounded-tr-sm" 
                    : "bg-surface border border-border text-textMuted rounded-tl-sm"
                }`}>
                  {message.role === "Student" ? (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-textMuted select-text">
                      <ReactMarkdown
                        components={{
                          h2: ({ ...props }) => <h2 className="text-base font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-sm font-semibold text-white/90 mt-3 mb-1" {...props} />,
                          p: ({ ...props }) => <p className="text-sm leading-relaxed mb-3" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({ ...props }) => <li className="text-[13px]" {...props} />,
                          code: ({ ...props }) => <code className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[12px] text-primary" {...props} />
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.sources?.length ? (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-[11px] font-medium text-white/60">Sources: {message.sources.join(", ")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          
          <form className="mt-auto flex gap-3 relative z-10" onSubmit={handleSubmit}>
            <input
              className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-background px-5 text-[15px] text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-textMuted/50"
              placeholder="Ask a question about your materials..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button 
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-50 disabled:hover:bg-primary" 
              disabled={isSending || selectedMaterialIds.length === 0} 
              aria-label="Send question"
            >
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <SendHorizontal size={20} className="ml-0.5" />}
            </button>
          </form>
        </div>

        <aside className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
          <h2 className="text-lg font-bold text-white mb-2">Context sources</h2>
          <p className="text-[13px] text-textMuted mb-6 leading-relaxed">Select the materials I should use to ground my answers.</p>
          
          <div className="grid gap-3">
            {materials.length === 0 && <p className="text-sm text-textMuted">No materials available.</p>}
            {materials.map(mat => {
              const isSelected = selectedMaterialIds.includes(mat.id);
              return (
                <label 
                  key={mat.id} 
                  className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                    isSelected ? "bg-primary/10 border-primary/30" : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleMaterial(mat.id)}
                    className="mt-1 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <div className="min-w-0">
                    <span className={`block truncate text-sm font-medium ${isSelected ? "text-primary" : "text-white"}`}>{mat.title}</span>
                    <span className="block text-xs text-textMuted mt-0.5 capitalize">{mat.material_type.split('/')[1] || mat.material_type}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
