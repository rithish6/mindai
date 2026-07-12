"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { askImageDoubt } from "@/lib/api";

export default function DoubtSolverPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [status, setStatus] = useState("Upload an image of a problem you are stuck on.");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setAnswer(null);
    setStatus("Image selected. Ask your question below.");
  }

  async function handleSolve(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatus("Please select an image first.");
      return;
    }

    setIsSolving(true);
    setStatus("Analyzing image...");

    try {
      const response = await askImageDoubt(file, question);
      setAnswer(response.answer);
      setStatus("Solved!");
    } catch (err: any) {
      setStatus(err?.message || "Failed to solve doubt. Make sure the backend is running.");
    } finally {
      setIsSolving(false);
    }
  }

  return (
    <AppShell eyebrow="Multimodal AI" title="Image Doubt Solver">
      <section className="grid gap-6 py-6 xl:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div 
            className="group flex-1 min-h-[300px] rounded-2xl border-2 border-dashed border-border bg-surface/30 p-6 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-surface/50 transition-all relative overflow-hidden"
            onClick={() => inputRef.current?.click()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
            
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
              {previewUrl ? (
                <div className="relative w-full h-full min-h-[250px]">
                  <img src={previewUrl} alt="Uploaded doubt" className="absolute inset-0 w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <p className="text-white font-medium bg-background/80 px-4 py-2 rounded-lg backdrop-blur-md">Change Image</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-primary border border-white/5 shadow-surface group-hover:bg-primary/10 transition-colors">
                    <ImagePlus size={28} aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-xl font-bold text-white">Upload a screenshot</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-textMuted">Take a picture of a difficult math problem, a complex diagram, or an exam question.</p>
                </>
              )}
            </div>
          </div>
          
          <form className="flex flex-col gap-4" onSubmit={handleSolve}>
            <p className="text-[13px] font-medium text-success ml-1">{status}</p>
            <textarea 
              className="w-full rounded-2xl border border-border bg-background p-4 text-[15px] text-white min-h-[120px] resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner placeholder:text-textMuted/50"
              placeholder="What exactly are you struggling with in this image? (e.g. 'Can you explain step 2 of this equation?')"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex h-12 w-full sm:w-auto self-end items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-50"
              disabled={isSolving || !file}
            >
              {isSolving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Solve It
            </button>
          </form>
        </div>

        <aside className="rounded-2xl glass-panel p-8 flex flex-col h-full min-h-[500px] shadow-surface relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-lg font-bold text-white mb-6 relative z-10">Step-by-step solution</h2>
          
          <div className="flex-1 bg-background/50 rounded-xl p-6 overflow-y-auto border border-border/50 relative z-10 custom-scrollbar">
            {answer ? (
              <div className="prose prose-sm prose-invert max-w-none text-white/90 whitespace-pre-wrap leading-relaxed">
                {answer}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full border border-dashed border-textMuted/30 flex items-center justify-center mb-4">
                  <Sparkles size={20} className="text-textMuted/50" />
                </div>
                <p className="text-[15px] text-textMuted/70 max-w-xs">
                  The AI&apos;s explanation will appear here once you upload an image and ask a question.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
