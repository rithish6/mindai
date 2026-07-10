"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material } from "@/lib/api";

const fallbackSections = [
  "Key definitions",
  "Important formulas",
  "Chapter summary",
  "Exam highlights",
  "Quick revision points"
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Hindi",
  "Arabic",
  "Japanese"
];

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

export default function NotesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [sections, setSections] = useState(fallbackSections);
  const [status, setStatus] = useState("Ready to generate");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getMaterials().then(mats => {
      setMaterials(mats);
      if (mats.length > 0) {
        setSelectedMaterialId(mats[0].id);
      }
    }).catch(err => console.error("Failed to fetch materials", err));
  }, []);

  async function handleGenerate() {
    if (!selectedMaterialId) {
      setStatus("Please select a material first.");
      return;
    }
    
    setIsGenerating(true);
    setStatus(`Generating notes in ${selectedLanguage}...`);

    try {
      const response = await generateResource(selectedMaterialId, "notes", selectedLanguage);
      setSections(response.content);
      setStatus(`Notes generated in ${selectedLanguage}!`);
    } catch (err: any) {
      setStatus(err?.message || "Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell eyebrow="AI notes generator" title="Notes">
      <section className="grid gap-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
          <h2 className="text-lg font-bold text-white">Material</h2>
          <select 
            className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
          >
            {materials.length === 0 && <option value="">No materials found</option>}
            {materials.map(mat => (
              <option key={mat.id} value={mat.id}>{mat.title}</option>
            ))}
          </select>

          <h2 className="text-lg font-bold mt-6 text-white">Translation</h2>
          <select 
            className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-60"
            disabled={isGenerating || !selectedMaterialId}
            onClick={handleGenerate}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : null}
            Generate notes
          </button>
          <p className="mt-5 text-[13px] font-medium text-success">{status}</p>
        </aside>

        <div className="rounded-2xl glass-panel p-8 shadow-surface">
          <h2 className="text-lg font-bold text-white mb-6">Structured output</h2>
          <div className="grid gap-4">
            {sections.map((section, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <MarkdownRenderer text={section} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
