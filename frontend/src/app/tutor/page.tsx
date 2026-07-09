"use client";

import { useState, useEffect } from "react";
import { Loader2, SendHorizontal, BrainCircuit } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { askTutor, getMaterials, Material } from "@/lib/api";

type Message = {
  role: "Student" | "EduMind AI";
  text: string;
  sources?: string[];
};

export default function TutorPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);

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
    } catch {
      setMessages((current) => [
        ...current,
        { role: "EduMind AI", text: "I could not reach the backend. Check your connection or API keys." }
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
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.sources?.length ? (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-xs font-medium text-white/60">Sources: {message.sources.join(", ")}</p>
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
