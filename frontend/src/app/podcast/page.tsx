"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Play, Pause, Square, Volume2, Info, Headphones } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { generateResource, getMaterials, Material } from "@/lib/api";

type DialogueLine = {
  host: "Host A" | "Host B";
  text: string;
};

export default function PodcastStudioPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [script, setScript] = useState<DialogueLine[]>([]);
  const [status, setStatus] = useState("Select a material to generate an audio overview");
  const [isGenerating, setIsGenerating] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);

  // TTS Voices state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hostAVoice, setHostAVoice] = useState<string>("");
  const [hostBVoice, setHostBVoice] = useState<string>("");

  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch materials and initial TTS voices
  useEffect(() => {
    getMaterials()
      .then((mats) => {
        setMaterials(mats);
        if (mats.length > 0) {
          setSelectedMaterialId(mats[0].id);
        }
      })
      .catch((err) => console.error("Failed to fetch materials", err));

    // Load TTS Voices
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Pre-select some decent default English voices if available
        const englishVoices = availableVoices.filter((v) => v.lang.startsWith("en"));
        if (englishVoices.length >= 2) {
          setHostAVoice(englishVoices[0].name);
          setHostBVoice(englishVoices[1].name);
        } else if (availableVoices.length > 0) {
          setHostAVoice(availableVoices[0].name);
          setHostBVoice(availableVoices[0].name);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Scroll active line into view
  useEffect(() => {
    if (currentLineIndex !== null && scriptContainerRef.current) {
      const activeElement = scriptContainerRef.current.querySelector(
        `[data-line-index="${currentLineIndex}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentLineIndex]);

  // Generate Podcast Script
  async function handleGenerate() {
    if (!selectedMaterialId) return;

    stopPlayback();
    setIsGenerating(true);
    setStatus("Analyzing material and generating script...");
    setScript([]);

    try {
      const response = await generateResource(selectedMaterialId, "podcast");
      
      // Parse Host A: ... and Host B: ...
      const parsedLines: DialogueLine[] = response.content.map((line) => {
        if (line.startsWith("Host A:")) {
          return { host: "Host A", text: line.replace("Host A:", "").trim() };
        } else if (line.startsWith("Host B:")) {
          return { host: "Host B", text: line.replace("Host B:", "").trim() };
        } else {
          // Fallback if no Host A/B tag is returned, alternate hosts
          return { host: "Host A", text: line.trim() };
        }
      });

      // Ensure some alternating logic if parsed as fallbacks
      const correctedLines: DialogueLine[] = parsedLines.map((line, idx) => {
        if (line.host === "Host A" && !response.content[idx].startsWith("Host A:")) {
          return { host: idx % 2 === 0 ? "Host A" : "Host B", text: line.text };
        }
        return line;
      });

      setScript(correctedLines);
      setStatus(`Generated dialogue with ${correctedLines.length} lines.`);
    } catch {
      setStatus("Generation failed. Check that the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Speak a specific line
  const speakLine = (index: number) => {
    if (index >= script.length) {
      stopPlayback();
      return;
    }

    setCurrentLineIndex(index);
    const line = script[index];
    const selectedVoiceName = line.host === "Host A" ? hostAVoice : hostBVoice;
    const selectedVoice = voices.find((v) => v.name === selectedVoiceName);

    const utterance = new SpeechSynthesisUtterance(line.text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Slight pitch adjustment to distinguish hosts even more
    utterance.pitch = line.host === "Host A" ? 1.0 : 1.15;
    utterance.rate = 1.05; // Slightly faster for natural conversation flow

    utterance.onend = () => {
      if (isPlaying && !isPaused) {
        speakLine(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      stopPlayback();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Playback Control Functions
  const startPlayback = () => {
    if (script.length === 0) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlaying(true);
      setIsPaused(false);
      speakLine(0);
    }
  };

  const pausePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentLineIndex(null);
    utteranceRef.current = null;
  };

  return (
    <AppShell eyebrow="Podcast Studio" title="Audio Overviews">
      <section className="grid gap-6 py-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar Configuration */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl glass-panel p-6 shadow-surface">
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
            <button
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-60"
              disabled={isGenerating || !selectedMaterialId}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : null}
              Generate Audio Overview
            </button>
            <p className="mt-4 text-xs font-semibold text-success/95 text-center leading-relaxed">{status}</p>
          </div>

          {/* Voice Configuration */}
          <div className="rounded-2xl glass-panel p-6 shadow-surface">
            <h2 className="text-lg font-bold text-white mb-1">Voice Settings</h2>
            <p className="text-[11px] text-textMuted mb-4">Choose different voices for your podcast hosts.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1.5 ml-1">
                  Host A (Expert)
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs text-white focus:border-primary outline-none"
                  value={hostAVoice}
                  onChange={(e) => setHostAVoice(e.target.value)}
                >
                  {voices.map((v) => (
                    <option key={`a-${v.name}`} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1.5 ml-1">
                  Host B (Co-Host)
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs text-white focus:border-primary outline-none"
                  value={hostBVoice}
                  onChange={(e) => setHostBVoice(e.target.value)}
                >
                  {voices.map((v) => (
                    <option key={`b-${v.name}`} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Script & Playback Timeline */}
        <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-surface flex flex-col h-[75vh] relative overflow-hidden">
          {/* Subtle gradient blob background */}
          <div className="absolute top-[-30%] right-[-20%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Timeline Header Controls */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Audio Overview Timeline</h2>
              <p className="text-xs text-textMuted mt-1">
                {script.length > 0
                  ? `Interactive discussion script • ${script.length} dialogue segments`
                  : "No podcast overview loaded"}
              </p>
            </div>

            {script.length > 0 && (
              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    onClick={pausePlayback}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                    aria-label="Pause"
                  >
                    <Pause size={18} />
                  </button>
                ) : (
                  <button
                    onClick={startPlayback}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-glow hover:bg-primaryHover transition-all"
                    aria-label="Play"
                  >
                    <Play size={18} className="ml-0.5" />
                  </button>
                )}

                <button
                  onClick={stopPlayback}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-40"
                  disabled={!isPlaying && !isPaused && currentLineIndex === null}
                  aria-label="Stop"
                >
                  <Square size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Timeline Dialogue Container */}
          <div
            ref={scriptContainerRef}
            className="flex-1 overflow-y-auto pr-2 relative z-10 space-y-6 custom-scrollbar pb-16"
          >
            {script.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-6 text-primary animate-pulse">
                  <Headphones size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Podcast Studio</h3>
                <p className="text-sm text-textMuted max-w-sm">
                  Select your study materials on the left and generate a conversational podcast. We will create two AI hosts that talk about the content.
                </p>
                <div className="mt-8 flex items-center gap-2 max-w-sm rounded-xl border border-border bg-white/5 p-4 text-[13px] text-textMuted/80 text-left leading-relaxed">
                  <Info size={16} className="shrink-0 text-primary" />
                  <span>Uses your device&apos;s speech synthesizer to narrate with custom voices! Make sure volume is enabled.</span>
                </div>
              </div>
            ) : (
              script.map((line, idx) => {
                const isActive = currentLineIndex === idx;
                const isHostA = line.host === "Host A";

                return (
                  <div
                    key={idx}
                    data-line-index={idx}
                    onClick={() => {
                      if (isPlaying || isPaused) {
                        stopPlayback();
                      }
                      setIsPlaying(true);
                      speakLine(idx);
                    }}
                    className={`flex flex-col gap-2 cursor-pointer transition-all duration-300 ${
                      isHostA ? "items-start mr-12" : "items-end ml-12"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-textMuted flex items-center gap-1.5">
                        {isHostA && <Volume2 size={10} className="text-primary" />}
                        {line.host}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-5 py-4 text-sm leading-relaxed border transition-all duration-300 ${
                        isActive
                          ? "bg-primary/20 border-primary/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] scale-[1.01]"
                          : "bg-surface border-border text-textMuted hover:bg-white/5"
                      }`}
                    >
                      <p>{line.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
