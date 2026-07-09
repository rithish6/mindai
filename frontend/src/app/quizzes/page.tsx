"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material } from "@/lib/api";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export default function QuizzesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  
  const [status, setStatus] = useState("Select a material to generate a quiz");
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
    setStatus("Generating quiz...");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);

    try {
      const response = await generateResource(selectedMaterialId, "quiz");
      
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
      
      setQuestions(parsedQuestions);
      setStatus(`Generated ${parsedQuestions.length} questions.`);
    } catch {
      setStatus("Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectOption(option: string) {
    if (selectedAnswer !== null) return; 
    
    setSelectedAnswer(option);
    if (option === questions[currentIndex].answer) {
      setScore(prev => prev + 1);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  }

  const currentQ = questions[currentIndex];

  return (
    <AppShell eyebrow="Practice mode" title="Quizzes">
      <section className="grid gap-6 py-6 xl:grid-cols-[1fr_320px]">
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
              Generate Quiz
            </button>
          </div>

          <div className="rounded-2xl glass-panel p-8 min-h-[500px] flex flex-col shadow-surface relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 flex-1 flex flex-col">
              {questions.length > 0 && currentQ ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Question {currentIndex + 1} of {questions.length}</p>
                    <span className="text-xs font-medium text-textMuted bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      Score: {score}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-relaxed">{currentQ.question}</h2>
                  <div className="mt-8 grid gap-4">
                    {currentQ.options.map((option, idx) => {
                      let btnClass = "flex min-h-14 items-center justify-between rounded-xl border border-border px-5 text-left text-[15px] font-medium hover:bg-white/5 transition-all group";
                      let Icon = null;
                      
                      if (selectedAnswer !== null) {
                        if (option === currentQ.answer) {
                          btnClass += " bg-success/10 border-success/30 text-success shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                          Icon = <CheckCircle2 size={20} className="text-success" aria-hidden="true" />;
                        } else if (option === selectedAnswer) {
                          btnClass += " bg-danger/10 border-danger/30 text-danger";
                          Icon = <XCircle size={20} className="text-danger" aria-hidden="true" />;
                        } else {
                          btnClass += " opacity-50";
                        }
                      } else {
                        btnClass += " text-textMuted hover:text-white";
                      }
                      
                      return (
                        <button 
                          key={idx} 
                          className={btnClass}
                          onClick={() => handleSelectOption(option)}
                          disabled={selectedAnswer !== null}
                        >
                          <span className="flex-1 pr-4">{option}</span>
                          {Icon ? Icon : <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors" />}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-auto pt-8 flex justify-end">
                    {selectedAnswer !== null && currentIndex < questions.length - 1 && (
                      <button 
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors"
                        onClick={handleNext}
                      >
                        Next Question
                        <ArrowRight size={18} />
                      </button>
                    )}
                    
                    {selectedAnswer !== null && currentIndex === questions.length - 1 && (
                      <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 text-center shadow-glow">
                        <p className="text-xl font-bold text-white mb-2">Quiz Complete!</p>
                        <p className="text-[15px] text-textMuted">You scored <span className="text-white font-bold">{score}</span> out of {questions.length}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} className="text-textMuted" />
                  </div>
                  <h2 className="text-lg font-medium text-textMuted max-w-sm">{status}</h2>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-2xl glass-panel p-6 shadow-surface h-fit">
          <h2 className="text-lg font-bold text-white mb-6">Session stats</h2>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-textMuted">Current Score</span>
              <span className="font-semibold text-success text-[15px]">
                {questions.length > 0 ? `${Math.round((score / questions.length) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-textMuted">Progress</span>
              <span className="font-semibold text-white">
                {selectedAnswer !== null ? currentIndex + 1 : currentIndex} / {questions.length}
              </span>
            </div>
            {questions.length > 0 && (
              <div className="h-2 rounded-full bg-white/5 mt-1 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-ai shadow-glow transition-all duration-300" 
                  style={{ width: `${((selectedAnswer !== null ? currentIndex + 1 : currentIndex) / questions.length) * 100}%` }} 
                />
              </div>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
