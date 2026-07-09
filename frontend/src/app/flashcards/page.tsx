"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material } from "@/lib/api";

type Flashcard = {
  question: string;
  answer: string;
};

export default function FlashcardsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [status, setStatus] = useState("Select a material to generate cards");
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
    if (!selectedMaterialId) return;
    
    setIsGenerating(true);
    setStatus("Generating flashcards...");
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const response = await generateResource(selectedMaterialId, "flashcards");
      // Parse Q: ... | A: ...
      const parsedCards = response.content.map(line => {
        const [qPart, aPart] = line.split("|");
        return {
          question: qPart ? qPart.replace("Q:", "").trim() : line,
          answer: aPart ? aPart.replace("A:", "").trim() : "Answer not found in generated format"
        };
      });
      setCards(parsedCards);
      setStatus(`Generated ${parsedCards.length} flashcards.`);
    } catch {
      setStatus("Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }

  return (
    <AppShell eyebrow="Active recall" title="Flashcards">
      <section className="grid gap-6 py-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select 
              className="h-11 w-full flex-1 rounded-xl border border-border bg-background px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-surface"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
            >
              {materials.length === 0 && <option value="">No materials found</option>}
              {materials.map(mat => (
                <option key={mat.id} value={mat.id}>{mat.title}</option>
              ))}
            </select>
            <button
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-60"
              disabled={isGenerating || !selectedMaterialId}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              Generate
            </button>
          </div>

          <div 
            className="group relative grid min-h-[400px] place-items-center rounded-2xl glass-panel p-8 text-center cursor-pointer hover:border-primary/50 transition-all shadow-surface overflow-hidden"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Subtle glow effect behind card */}
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'group-hover:opacity-50'}`} />
            
            <div className="relative z-10 w-full">
              {cards.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">Card {currentIndex + 1} of {cards.length}</p>
                  <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white leading-relaxed px-4">
                    {isFlipped ? cards[currentIndex].answer : cards[currentIndex].question}
                  </h2>
                  <p className="mx-auto mt-6 max-w-lg text-[13px] leading-6 text-textMuted/60">Tap anywhere on the card to flip</p>
                  <button 
                    className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(!isFlipped);
                    }}
                  >
                    <RotateCcw size={17} aria-hidden="true" className={isFlipped ? "rotate-180 transition-transform duration-300" : "transition-transform duration-300"} />
                    {isFlipped ? "Show Question" : "Reveal Answer"}
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-medium text-textMuted">{status}</h2>
                </div>
              )}
            </div>
          </div>
          
          {cards.length > 0 && (
            <div className="flex justify-between items-center px-2">
              <button 
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface border border-border px-6 text-sm font-semibold text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-surface"
                disabled={currentIndex === 0}
                onClick={handlePrev}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button 
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface border border-border px-6 text-sm font-semibold text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-surface"
                disabled={currentIndex === cards.length - 1}
                onClick={handleNext}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <aside className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
          <h2 className="text-lg font-bold text-white mb-6">Review queue</h2>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-textMuted">Generated cards</span>
              <span className="font-semibold text-white">{cards.length}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-textMuted">Current Progress</span>
              <span className="font-semibold text-white">
                {cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0}%
              </span>
            </div>
            {cards.length > 0 && (
              <div className="h-2 rounded-full bg-white/5 mt-1 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary shadow-glow transition-all duration-300" 
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} 
                />
              </div>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
