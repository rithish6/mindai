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
    } catch {
      setStatus("Generation failed. Check that the backend is running.");
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
                <p className="text-[15px] leading-relaxed text-textMuted">{section}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
