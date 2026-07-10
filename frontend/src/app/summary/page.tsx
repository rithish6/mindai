"use client";

import { useState, useEffect } from "react";
import { Loader2, BookOpen, Download, HelpCircle, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material, API_BASE_URL } from "@/lib/api";
import { auth } from "@/lib/firebase";

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

export default function SummaryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [status, setStatus] = useState("Select a material to generate a summary.");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getMaterials()
      .then((mats) => {
        setMaterials(mats);
        if (mats.length > 0) {
          setSelectedMaterialId(mats[0].id);
        }
      })
      .catch((err) => console.error("Failed to fetch materials", err));
  }, []);

  async function handleGenerate() {
    if (!selectedMaterialId) return;

    setIsGenerating(true);
    setStatus(`Analyzing and summarizing in ${selectedLanguage}...`);
    setMarkdownContent("");

    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/generate/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          material_id: selectedMaterialId,
          resource_type: "summary",
          language: selectedLanguage
        })
      });

      if (!res.ok) {
        let errorMsg = `Generation failed: ${res.status}`;
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
              setMarkdownContent((current) => current + parsed.content);
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch (e: any) {
            if (e.message.startsWith("AI operation failed")) {
              throw e;
            }
            console.error("Stream parse error:", e);
          }
        }
      }

      setStatus(`Summary generated successfully in ${selectedLanguage}!`);
    } catch (err: any) {
      setStatus(err?.message || "Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload() {
    if (!markdownContent) return;
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${materials.find(m => m.id === selectedMaterialId)?.title || "summary"}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell eyebrow="AI study assistant" title="Document Summary">
      <section className="grid gap-6 py-6 lg:grid-cols-[320px_1fr]">
        {/* Settings Panel */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
            <h2 className="text-lg font-bold text-white mb-4">Source Material</h2>
            <select
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
            >
              {materials.length === 0 && <option value="">No materials found</option>}
              {materials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.title}
                </option>
              ))}
            </select>

            <h2 className="text-lg font-bold mt-6 text-white mb-4">Output Language</h2>
            <select
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            <button
              className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-50"
              disabled={isGenerating || !selectedMaterialId}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : null}
              Generate Summary
            </button>
            <p className="mt-4 text-xs font-semibold text-success/90 text-center leading-relaxed">
              {status}
            </p>
          </div>

          {/* Download options */}
          {markdownContent && (
            <div className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
              <h3 className="text-sm font-bold text-white mb-3">Export Options</h3>
              <button
                onClick={handleDownload}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border hover:bg-white/5 text-xs font-semibold text-white transition-all"
              >
                <Download size={14} />
                Download Markdown (.md)
              </button>
            </div>
          )}
        </aside>

        {/* Markdown Render Area */}
        <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-surface flex flex-col min-h-[70vh] relative overflow-hidden">
          {/* Subtle gradient blob */}
          <div className="absolute top-[-30%] right-[-20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          {markdownContent ? (
            <div className="relative z-10 select-text overflow-x-auto pb-10">
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => <h1 className="text-2xl font-black text-white mt-8 mb-4 border-b border-border pb-3" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-xl font-bold text-white mt-7 mb-3 border-b border-white/5 pb-2" {...props} />,
                  h3: ({ ...props }) => <h3 className="text-lg font-bold text-white/95 mt-5 mb-2" {...props} />,
                  p: ({ ...props }) => <p className="text-[15px] text-textMuted leading-relaxed mb-4" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-textMuted" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-textMuted" {...props} />,
                  li: ({ ...props }) => <li className="text-[14px] leading-relaxed" {...props} />,
                  blockquote: ({ ...props }) => (
                    <blockquote className="border-l-4 border-primary bg-white/5 pl-4 py-3 my-4 rounded-r-xl text-textMuted italic" {...props} />
                  ),
                  table: ({ ...props }) => <table className="w-full border-collapse border border-white/10 my-6 text-sm" {...props} />,
                  th: ({ ...props }) => <th className="border border-white/10 bg-white/5 px-4 py-3 text-left font-bold text-white" {...props} />,
                  td: ({ ...props }) => <td className="border border-white/10 px-4 py-3 text-textMuted" {...props} />,
                  code: ({ ...props }) => (
                    <code className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[13px] text-primary" {...props} />
                  ),
                  pre: ({ ...props }) => (
                    <pre className="bg-white/5 border border-white/10 rounded-xl p-4 my-4 font-mono text-[13px] text-white overflow-x-auto" {...props} />
                  )
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex-1 flex flex-col items-center justify-center text-center relative z-10 py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-6 text-primary">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generate PDF Summary</h3>
              <p className="text-sm text-textMuted max-w-sm">
                Choose one of your uploaded files on the left and click &quot;Generate Summary&quot; to read a detailed AI summary of your notes.
              </p>
              <div className="mt-8 flex items-center gap-2 max-w-xs rounded-xl border border-border bg-white/5 p-4 text-[13px] text-textMuted/80 text-left leading-relaxed">
                <BookOpen size={16} className="shrink-0 text-primary" />
                <span>Provides a structured layout with key definitions, tables, and headers matching GPT-4 style!</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
