"use client";

import { useEffect, useState } from "react";
import { 
  FileUp, 
  MessageSquareText, 
  Play, 
  Flame, 
  Hourglass, 
  GraduationCap, 
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  HelpCircle,
  Quote
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/mock-data";
import { getMaterials, getAnalyticsSummary, Material, AnalyticsSummary } from "@/lib/api";

const STUDY_QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
  { text: "Do not wait for opportunities, create them.", author: "Anonymous" }
];

export default function Home() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<"hours" | "score">("hours");

  const hoursMultiplier = stats?.study_hours ?? 0;
  const quizScoreBase = stats?.quiz_score ? parseInt(stats.quiz_score) : 0;

  const ANALYTICS_DATA = [
    { day: "Mon", hours: Number((hoursMultiplier * 0.08).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 0.88)) },
    { day: "Tue", hours: Number((hoursMultiplier * 0.15).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 0.95)) },
    { day: "Wed", hours: Number((hoursMultiplier * 0.10).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 1.0)) },
    { day: "Thu", hours: Number((hoursMultiplier * 0.22).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 0.97)) },
    { day: "Fri", hours: Number((hoursMultiplier * 0.18).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 1.05)) },
    { day: "Sat", hours: Number((hoursMultiplier * 0.15).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 1.1)) },
    { day: "Sun", hours: Number((hoursMultiplier * 0.12).toFixed(1)), score: Math.min(100, Math.round(quizScoreBase * 1.15)) }
  ];
  
  // Interactive quote generator
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Quick Ask Input
  const [quickQuestion, setQuickQuestion] = useState("");

  // Interactive Checklist
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Upload a new study material", completed: false },
    { id: 2, text: "Review summary flashcards", completed: false },
    { id: 3, text: "Ask AI Tutor a question", completed: false }
  ]);

  // Dynamic Greeting
  const [greeting, setGreeting] = useState("Welcome back!");

  useEffect(() => {
    getMaterials().then(setMaterials).catch(console.error);
    getAnalyticsSummary().then(setStats).catch(console.error);

    // Random quote
    setQuoteIndex(Math.floor(Math.random() * STUDY_QUOTES.length));

    // Dynamic greeting based on hour
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning, Scholar!");
    else if (hour < 18) setGreeting("Good afternoon, Scholar!");
    else setGreeting("Good evening, Scholar!");
  }, []);

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    // Redirect to tutor with prefilled question query param
    router.push(`/tutor?q=${encodeURIComponent(quickQuestion)}`);
  };

  return (
    <AppShell eyebrow="Interactive Dashboard" title={greeting}>
      <div className="grid gap-6 py-6 xl:grid-cols-[1.35fr_0.65fr]">
        
        {/* Main Hero Panel */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden glass-panel p-8 text-white shadow-surface flex flex-col justify-between min-h-[300px]"
        >
          {/* Glowing gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/15 via-transparent to-secondary/5 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
              <Sparkles size={14} className="animate-pulse" />
              <span>Smart Workspace</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white leading-tight">
              Power up your learning with <span className="text-transparent bg-clip-text bg-gradient-ai">SnapLearn</span>
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-textMuted">
              Instantly turn PDFs, audio, video, or lecture notes into interactive flashcards, responsive mind maps, co-hosted podcasts, or ask questions directly to your AI Tutor.
            </p>
          </div>

          {/* Quick AI Search Form */}
          <form onSubmit={handleQuickAsk} className="relative z-10 mt-8 max-w-xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder="Ask the AI Tutor anything..."
                className="w-full h-12 pl-5 pr-28 rounded-xl border border-border bg-background/60 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-textMuted/50 backdrop-blur-sm shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 h-9 px-4 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-bold transition-all shadow-glow flex items-center gap-1.5"
              >
                <span>Ask AI</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </form>
        </motion.section>

        {/* Dynamic Quote & Motivation Panel */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl glass-panel p-6 shadow-surface flex flex-col justify-between min-h-[300px] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-textMuted flex items-center gap-2">
              <Quote size={14} className="text-secondary" />
              <span>Daily Motivation</span>
            </h3>
            <button 
              onClick={() => setQuoteIndex((quoteIndex + 1) % STUDY_QUOTES.length)}
              className="text-xs font-semibold text-primary hover:text-primaryHover transition-colors"
            >
              Next Quote
            </button>
          </div>

          <div className="my-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-base italic font-medium text-white/90 leading-relaxed mb-3">
                  &quot;{STUDY_QUOTES[quoteIndex].text}&quot;
                </p>
                <p className="text-xs font-bold text-secondary text-right">
                  — {STUDY_QUOTES[quoteIndex].author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-textMuted">
            <span className="flex items-center gap-1.5">
              <Award size={14} className="text-warning" />
              <span>Ready for success</span>
            </span>
            <span>Refreshed daily</span>
          </div>
        </motion.section>

      </div>

      {/* Interactive Stats Cards */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mt-2">
        {[
          { label: "Study hours", value: stats?.study_hours ?? "0", icon: Hourglass, color: "text-secondary bg-secondary/10" },
          { label: "Quiz score", value: stats?.quiz_score ?? "0%", icon: GraduationCap, color: "text-success bg-success/10" },
          { label: "Streak count", value: `${stats?.streak_days ?? 0} days`, icon: Flame, color: "text-warning bg-warning/10" },
          { label: "Cards reviewed", value: stats?.cards_reviewed ?? "0", icon: Layers, color: "text-primary bg-primary/10" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              whileHover={{ y: -4, borderColor: "rgba(139,92,246,0.3)" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-2xl glass-panel p-6 shadow-surface flex items-center justify-between border border-white/5 transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-textMuted group-hover:text-white transition-colors">{stat.label}</p>
                <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} border border-white/5 shadow-inner`}>
                <Icon size={20} />
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Analytics Chart & Daily Checklist */}
      <section className="grid gap-6 mt-6 xl:grid-cols-[1.35fr_0.65fr]">
        
        {/* Interactive Analytics Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl glass-panel p-6 shadow-surface flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-primary animate-pulse" />
                <span>Learning Analytics</span>
              </h3>
              <p className="text-xs text-textMuted mt-1">Track your daily study progress and exam readiness</p>
            </div>
            
            {/* Chart Tab Selectors */}
            <div className="flex bg-white/5 border border-border p-1 rounded-xl">
              <button
                onClick={() => setActiveChartTab("hours")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === "hours" 
                    ? "bg-primary text-white shadow-glow" 
                    : "text-textMuted hover:text-white"
                }`}
              >
                Study Time (h)
              </button>
              <button
                onClick={() => setActiveChartTab("score")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === "score" 
                    ? "bg-success text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                    : "text-textMuted hover:text-white"
                }`}
              >
                Quiz Score (%)
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(19,19,26,0.9)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff"
                  }} 
                />
                {activeChartTab === "hours" ? (
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    name="Study Hours"
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                  />
                ) : (
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    name="Quiz Score"
                    stroke="#22C55E" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Daily Study Checklist (Gamification) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl glass-panel p-6 shadow-surface flex flex-col justify-between border border-white/5"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-secondary animate-pulse" />
                <span>Daily Checklist</span>
              </h3>
              <span className="text-xs bg-secondary/15 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-bold">
                {progressPercent}% Done
              </span>
            </div>
            
            {/* Checklist progress bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-secondary shadow-glow"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Checklist Items */}
            <div className="grid gap-3.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    item.completed 
                      ? "bg-success/5 border-success/20 text-textMuted/60 line-through" 
                      : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5 text-white"
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
                    item.completed 
                      ? "bg-success border-success text-white" 
                      : "border-border bg-background"
                  }`}>
                    {item.completed && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                        <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[13.5px] font-semibold">{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-[11px] text-textMuted leading-relaxed">
            <HelpCircle size={14} className="shrink-0 text-primary" />
            <span>Complete daily tasks to raise your learning score and study streak!</span>
          </div>
        </motion.div>

      </section>

      {/* Recent Materials & Modules */}
      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        
        {/* Recent Materials card */}
        <div className="rounded-2xl glass-panel p-6 shadow-surface">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent materials</h2>
            <Link href="/materials" className="text-sm font-semibold text-primary hover:text-primaryHover transition-colors">View all</Link>
          </div>
          <div className="grid gap-4">
            {materials.length === 0 && (
              <p className="text-sm text-textMuted py-4 text-center">No materials uploaded yet. Go upload some!</p>
            )}
            {materials.slice(0, 3).map((material) => (
              <div key={material.id} className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{material.title}</p>
                    <p className="mt-1 text-[13px] text-textMuted capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                      {material.material_type.split("/")[1] || material.material_type} - {material.processing_status}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">Processed</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-primary shadow-glow" style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Modules list */}
        <div className="rounded-2xl glass-panel p-6 shadow-surface">
          <h2 className="text-lg font-bold text-white mb-6">Platform modules</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.title} className="border-t border-border py-4 first:border-t-0 first:pt-0 sm:first:border-t sm:first:pt-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-primary border border-white/5">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-[15px]">{module.title}</h3>
                        <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-success uppercase border border-success/20">
                          {module.status === "Connected" ? "Live" : module.status}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-textMuted">{module.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
