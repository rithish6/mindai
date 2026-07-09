"use client";

import { useState, useEffect } from "react";
import { Loader2, Share2, ZoomIn, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material } from "@/lib/api";
import Mermaid from "@/components/Mermaid";

export default function MindMapPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [chart, setChart] = useState<string | null>(null);
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
    setStatus("Analyzing concepts...");

    try {
      const response = await generateResource(selectedMaterialId, "mindmap");
      if (response.content && response.content.length > 0) {
        let rawChart = response.content[0];
        if (rawChart.startsWith("```mermaid")) {
          rawChart = rawChart.replace("```mermaid", "").replace("```", "").trim();
        } else if (rawChart.startsWith("```")) {
          rawChart = rawChart.replace("```", "").replace("```", "").trim();
        }
        setChart(rawChart);
        setStatus("Mind map generated!");
      } else {
        setStatus("Failed to generate mind map.");
      }
    } catch {
      setStatus("Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell eyebrow="Visual Learning" title="Mind Maps">
      <section className="grid gap-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
          <h2 className="text-lg font-bold text-white mb-6">Source Material</h2>
          <select 
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
          >
            {materials.length === 0 && <option value="">No materials found</option>}
            {materials.map(mat => (
              <option key={mat.id} value={mat.id}>{mat.title}</option>
            ))}
          </select>
          <button
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-50"
            disabled={isGenerating || !selectedMaterialId}
            onClick={handleGenerate}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : null}
            Generate mind map
          </button>
          <p className="mt-5 text-[13px] font-medium text-success ml-1">{status}</p>
        </aside>

        <div className="rounded-2xl glass-panel p-6 shadow-surface min-h-[500px] flex flex-col relative overflow-hidden">
          {chart && (
            <div className="absolute top-6 right-6 z-20 flex gap-2">
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                <ZoomIn size={18} />
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                <Download size={18} />
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          )}
          
          <div className="flex-1 flex flex-col items-center justify-center overflow-x-auto relative z-10 w-full h-full bg-white/5 rounded-xl border border-border">
            {chart ? (
              <div className="p-8 min-w-full min-h-full flex items-center justify-center">
                <Mermaid chart={chart} />
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-primary border border-white/5 shadow-surface mb-6">
                  <Share2 size={28} className="rotate-90" aria-hidden="true" />
                </div>
                <p className="text-white font-medium text-lg mb-2">No mind map generated yet</p>
                <p className="text-textMuted text-sm max-w-sm mx-auto">
                  Select a material and click generate to visualize the key concepts in an interactive mind map.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
