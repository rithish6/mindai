"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Award, 
  Check, 
  Save, 
  Laptop, 
  ShieldCheck, 
  Flame, 
  GraduationCap, 
  Hourglass, 
  Sparkles,
  Lock,
  ChevronRight,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/contexts/AuthContext";

interface Badge {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

const INITIAL_BADGES: Badge[] = [
  { id: "1", name: "Early Bird", desc: "Study for at least 1 hour before 7:00 AM.", unlocked: true, icon: "🌅" },
  { id: "2", name: "Doc Devourer", desc: "Upload and process 5 or more custom learning materials.", unlocked: true, icon: "📚" },
  { id: "3", name: "Perfect Score", desc: "Achieve a perfect 100% on any generated AI Quiz.", unlocked: false, icon: "🎯" },
  { id: "4", name: "Podcast Fanatic", desc: "Listen to or generate 3 co-hosted learning podcasts.", unlocked: false, icon: "🎙️" },
  { id: "5", name: "Consistency King", desc: "Maintain a study streak of 7 or more consecutive days.", unlocked: true, icon: "🔥" }
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [studyPreferences, setStudyPreferences] = useState("Visual (Mind Maps & Timelines)");
  const [dailyGoalHours, setDailyGoalHours] = useState(3);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReminders, setWeeklyReminders] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Interactive badge state
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Simulated sessions log
  const [sessions, setSessions] = useState([
    { id: "s1", device: "MacBook Air (Current)", location: "Chennai, India", ip: "192.168.1.45", active: true },
    { id: "s2", device: "iPhone 15 Pro", location: "Chennai, India", ip: "192.168.1.102", active: false }
  ]);

  useEffect(() => {
    if (user?.email) {
      const defaultName = user.email.split("@")[0];
      setDisplayName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    } else {
      setDisplayName("Scholar");
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 3000);
  };

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppShell eyebrow="User Account" title="Profile Dashboard">
      <div className="grid gap-6 py-6 xl:grid-cols-[0.95fr_1.05fr]">
        
        {/* User Card & Settings */}
        <div className="space-y-6">
          
          {/* Profile Overview Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl overflow-hidden glass-panel p-6 text-white shadow-surface flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            
            {/* Avatar block */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-gradient-ai flex items-center justify-center text-4xl font-extrabold shadow-glow border-2 border-white/10 group-hover:scale-105 transition-transform duration-300">
                {displayName ? displayName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-success flex items-center justify-center border-2 border-[#13131A] shadow-inner text-[10px] text-white">
                ✓
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold truncate text-white">{displayName}</h2>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                  PRO Scholar
                </span>
              </div>
              <p className="text-sm text-textMuted mt-1 truncate">{user?.email || "scholar@snaplearn.edu"}</p>
              
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-textMuted">
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-warning" />
                  <span className="font-bold text-white">7 days</span> streak
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-success" />
                  <span className="font-bold text-white">82%</span> avg score
                </div>
                <div className="flex items-center gap-1.5">
                  <Hourglass size={14} className="text-secondary" />
                  <span className="font-bold text-white">18.5h</span> studied
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Edit Form */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl glass-panel p-6 shadow-surface"
          >
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <User size={18} className="text-primary" />
              <span>Personal Settings</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <User size={16} className="absolute left-3.5 top-3.5 text-textMuted/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || "scholar@snaplearn.edu"}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white/5 text-sm text-textMuted/60 cursor-not-allowed outline-none"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-textMuted/40" />
                </div>
                <p className="text-[10px] text-textMuted/50 mt-1">To change email, contact school administrator.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Learning Preference</label>
                <select 
                  value={studyPreferences} 
                  onChange={(e) => setStudyPreferences(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option>Visual (Mind Maps & Timelines)</option>
                  <option>Conversational (Podcasts & RAG Chat)</option>
                  <option>Testing (Interactive Quizzes)</option>
                  <option>Traditional (Summarized PDFs & Notes)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primaryHover text-white text-sm font-bold transition-all shadow-glow flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </motion.div>

        </div>

        {/* Gamified Achievements & Device Control */}
        <div className="space-y-6">
          
          {/* Achievements (Gamification) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl glass-panel p-6 shadow-surface"
          >
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Award size={18} className="text-secondary animate-pulse" />
              <span>Unlocked Milestones</span>
            </h3>

            {/* Badges Grid */}
            <div className="grid grid-cols-5 gap-3.5 justify-items-center">
              {INITIAL_BADGES.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all relative border ${
                    badge.unlocked 
                      ? "bg-gradient-to-br from-white/5 to-white/0 border-white/10 hover:scale-110 shadow-glow" 
                      : "bg-[#111116] border-dashed border-white/5 opacity-40 cursor-help"
                  }`}
                >
                  <span>{badge.icon}</span>
                  {!badge.unlocked && (
                    <div className="absolute inset-0 bg-[#0B0B0F]/70 rounded-2xl flex items-center justify-center">
                      <Lock size={12} className="text-white/60" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Badge Dialog / Drawer Detail */}
            <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/5 min-h-[90px] flex items-center justify-between">
              {selectedBadge ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedBadge.icon}</span>
                    <h4 className="text-sm font-bold text-white">{selectedBadge.name}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                      selectedBadge.unlocked ? "bg-success/15 text-success border border-success/20" : "bg-white/5 text-textMuted border border-white/5"
                    }`}>
                      {selectedBadge.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted mt-1.5 leading-relaxed">{selectedBadge.desc}</p>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 text-xs text-textMuted py-4">
                  <HelpCircle size={14} className="text-primary" />
                  <span>Click any badge above to see details and unlock criteria</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Interactive Goals & Notification Toggles */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl glass-panel p-6 shadow-surface"
          >
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-warning" />
              <span>Target & Preferences</span>
            </h3>

            {/* Daily study hours slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                <span>Daily Study Goal</span>
                <span className="text-primary font-extrabold">{dailyGoalHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary border-none outline-none"
              />
              <div className="flex justify-between text-[9px] text-textMuted/50 mt-1.5">
                <span>1h (Casual)</span>
                <span>8h (Extreme)</span>
              </div>
            </div>

            {/* Notification toggle buttons */}
            <div className="grid gap-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Email Study Alerts</p>
                  <p className="text-xs text-textMuted mt-0.5">Receive summary highlights directly in inbox.</p>
                </div>
                <button 
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className="text-textMuted hover:text-white transition-colors"
                >
                  {emailAlerts ? <ToggleRight size={38} className="text-primary" aria-label="Toggle email alerts on" /> : <ToggleLeft size={38} aria-label="Toggle email alerts off" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Weekly Performance Reports</p>
                  <p className="text-xs text-textMuted mt-0.5">Track statistics against class benchmarks.</p>
                </div>
                <button 
                  onClick={() => setWeeklyReminders(!weeklyReminders)}
                  className="text-textMuted hover:text-white transition-colors"
                >
                  {weeklyReminders ? <ToggleRight size={38} className="text-primary" aria-label="Toggle weekly alerts on" /> : <ToggleLeft size={38} aria-label="Toggle weekly alerts off" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Active Sessions Control */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-2xl glass-panel p-6 shadow-surface"
          >
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-success" />
              <span>Login Security</span>
            </h3>

            <div className="grid gap-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <Laptop size={16} className={session.active ? "text-primary" : "text-textMuted"} />
                    <div>
                      <p className="font-bold text-white">{session.device}</p>
                      <p className="text-textMuted/60 mt-0.5">{session.location} • {session.ip}</p>
                    </div>
                  </div>
                  {!session.active && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-error/10 hover:text-error hover:border-error/20 border border-white/10 text-textMuted font-bold text-[10px] uppercase transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>

      {/* Floating Save Notification Toast */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 transform z-50 bg-[#16A34A] text-white border border-[#22C55E]/30 rounded-xl px-5 py-3 shadow-glow flex items-center gap-2 text-sm font-semibold"
          >
            <Check size={16} />
            <span>Profile and learning preferences updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
