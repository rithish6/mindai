"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Brain, CalendarDays, FileText, GraduationCap, Home, Layers3, Settings, Sparkles, Upload, Podcast, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Materials", href: "/materials", icon: Upload },
  { label: "PDF Summary", href: "/summary", icon: BookOpen },
  { label: "AI Tutor", href: "/tutor", icon: Brain },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Flashcards", href: "/flashcards", icon: Layers3 },
  { label: "Podcast Studio", href: "/podcast", icon: Podcast },
  { label: "Mind Maps", href: "/mindmap", icon: Sparkles },
  { label: "Quizzes", href: "/quizzes", icon: GraduationCap },
  { label: "Doubt Solver", href: "/doubt", icon: Sparkles },
  { label: "Planner", href: "/planner", icon: CalendarDays },
  { label: "Analytics", href: "/analytics", icon: BarChart3 }
];

type AppShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function AppShell({ eyebrow, title, children }: AppShellProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="h-screen w-screen bg-background text-text overflow-hidden relative flex flex-col">
      {/* Decorative gradient blobs in the background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="grid h-full grid-cols-1 lg:grid-cols-[260px_1fr] relative z-10 flex-1 overflow-hidden">
        <aside className="border-b border-border bg-surface/50 backdrop-blur-xl px-4 py-6 lg:border-b-0 lg:border-r flex flex-col h-full">
          <Link href="/" className="flex items-center gap-3 px-2 mb-8">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-ai text-white shadow-glow">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold tracking-wide text-white leading-tight">SnapLearn</p>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">with EduMind</p>
            </div>
          </Link>

          <nav className="grid gap-1 flex-1 overflow-y-auto pr-2 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                      : "text-textMuted hover:bg-white/5 hover:text-text"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" className={isActive ? "text-primary" : "text-textMuted"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-border">
            <button 
              onClick={signOut}
              className="flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-textMuted hover:bg-white/5 hover:text-text transition-all duration-200"
            >
              <Settings size={18} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <section className="flex flex-col h-full overflow-hidden">
          <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10 border-b border-border bg-background/40 backdrop-blur-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{eyebrow}</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-full bg-surface border border-border text-textMuted hover:text-white transition-colors" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <div className="h-10 w-10 rounded-full bg-gradient-ai cursor-pointer shadow-glow border-2 border-surface" />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 lg:px-10 py-6">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
