"use client";

import { useEffect, useState } from "react";
import { AnalyticsSummary, getAnalyticsSummary } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

const weakTopics = ["Deadlocks", "Graph traversal", "Gradient descent"];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [status, setStatus] = useState("Loading analytics...");

  useEffect(() => {
    getAnalyticsSummary()
      .then((data) => {
        setSummary(data);
        setStatus("Connected to backend");
      })
      .catch(() => setStatus("Backend is not reachable"));
  }, []);

  const metrics = [
    ["Study hours", summary?.study_hours ?? "-", "This week"],
    ["Quiz score", summary?.quiz_score ?? "-", "Average"],
    ["Study streak", summary?.streak_days ?? "-", "Days"],
    ["Cards reviewed", summary?.cards_reviewed ?? "-", "Total"]
  ];

  return (
    <AppShell eyebrow="Progress analytics" title="Analytics">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[13px] font-medium text-success ml-1">{status}</p>
      </div>
      
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {metrics.map(([label, value, note], idx) => (
          <div key={label} className="rounded-2xl glass-panel p-6 shadow-surface relative overflow-hidden group">
            {/* Subtle gradient hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${idx === 1 ? 'from-secondary/10' : idx === 2 ? 'from-success/10' : idx === 3 ? 'from-warning/10' : ''}`} />
            
            <div className="relative z-10">
              <p className="text-sm font-medium text-textMuted group-hover:text-white transition-colors">{label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{value}</p>
              <p className="mt-2 text-xs font-medium text-textMuted/70 uppercase tracking-wider">{note}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-surface">
          <h2 className="text-lg font-bold text-white mb-8">Weekly activity</h2>
          <div className="mt-5 flex h-64 items-end gap-3 border-b border-border pb-3 px-2">
            {[42, 66, 52, 78, 61, 88, 72].map((height, index) => (
              <div key={index} className="flex flex-1 items-end group">
                <div 
                  className="w-full rounded-t-lg bg-white/10 group-hover:bg-primary/80 transition-colors shadow-inner relative overflow-hidden" 
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-2 mt-4 text-xs font-medium text-textMuted uppercase tracking-widest">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
        <aside className="rounded-2xl glass-panel p-6 sm:p-8 shadow-surface">
          <h2 className="text-lg font-bold text-white mb-6">Recommended focus</h2>
          <div className="grid gap-3">
            {weakTopics.map((topic, index) => (
              <div key={topic} className="flex items-center gap-4 rounded-xl border border-border bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-danger/10 border border-danger/20 text-danger flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <p className="font-medium text-white text-[15px]">
                  {topic}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
