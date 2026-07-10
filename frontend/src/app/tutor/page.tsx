"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, SendHorizontal, BrainCircuit } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { askTutor, getMaterials, Material } from "@/lib/api";

type Message = {
  role: "Student" | "EduMind AI";
  text: string;
  sources?: string[];
};

function parseInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const codeContent = part.slice(3, -3).trim();
          const newlineIdx = codeContent.indexOf("\n");
          let language = "code";
          let code = codeContent;
          if (newlineIdx !== -1) {
            const potentialLang = codeContent.substring(0, newlineIdx).trim();
            if (potentialLang && potentialLang.length < 15) {
              language = potentialLang;
              code = codeContent.substring(newlineIdx + 1);
            }
          }
          return (
            <div key={idx} className="my-3 rounded-xl border border-white/10 bg-black/60 overflow-hidden font-mono text-xs">
              <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between text-white/50 text-[10px] uppercase font-bold tracking-wider">
                <span>{language}</span>
              </div>
              <pre className="p-4 overflow-x-auto text-white/90 leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              if (line.startsWith("### ")) {
                return <h4 key={lineIdx} className="text-sm font-bold text-white mt-4 mb-2">{parseInline(line.substring(4))}</h4>;
              }
              if (line.startsWith("## ")) {
                return <h3 key={lineIdx} className="text-md font-extrabold text-white mt-5 mb-2.5">{parseInline(line.substring(3))}</h3>;
              }
              if (line.startsWith("# ")) {
                return <h2 key={lineIdx} className="text-lg font-black text-white mt-6 mb-3">{parseInline(line.substring(2))}</h2>;
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <ul key={lineIdx} className="list-disc pl-5 my-1 space-y-1">
                    <li className="text-sm text-textMuted leading-relaxed">{parseInline(line.substring(2))}</li>
                  </ul>
                );
              }
              if (!line.trim()) return <div key={lineIdx} className="h-2" />;
              return <p key={lineIdx} className="text-sm text-textMuted leading-relaxed my-0.5">{parseInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function TutorPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Autoscroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    getMaterials().then(mats => {
      setMaterials(mats);
      if (mats.length > 0) {
        setSelectedMaterialIds([mats[0].id]);
      }
    }).catch(err => console.error("Failed to fetch materials", err));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    setMessages((current) => [...current, { role: "Student", text: trimmed }]);
    setQuestion("");
    setIsSending(true);

    try {
      const response = await askTutor(trimmed, selectedMaterialIds);
      setMessages((current) => [...current, { role: "EduMind AI", text: response.answer, sources: response.sources }]);
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        { role: "EduMind AI", text: err?.message || "I could not reach the backend. Check your connection or API keys." }
      ]);
    } finally {
      setIsSending(false);
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

          <div className="grid gap-6 flex-1 overflow-y-auto pr-4 mb-6 relative z-10 custom-scrollbar">
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
                    <MarkdownRenderer text={message.text} />
                  )}
                  {message.sources?.length ? (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-xs font-medium text-white/60">Sources: {message.sources.join(", ")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
