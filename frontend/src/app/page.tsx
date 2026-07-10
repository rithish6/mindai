"use client";

import { useEffect, useState } from "react";
import { FileUp, MessageSquareText, Play } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { modules } from "@/lib/mock-data";
import { getMaterials, getAnalyticsSummary, Material, AnalyticsSummary } from "@/lib/api";

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    getMaterials().then(setMaterials).catch(console.error);
    getAnalyticsSummary().then(setStats).catch(console.error);
  }, []);

  const weeklyStats = [
    { label: "Study hours", value: stats?.study_hours ?? "0" },
    { label: "Quiz score", value: stats?.quiz_score ?? "0%" },
    { label: "Streak", value: `${stats?.streak_days ?? 0} days` },
    { label: "Cards reviewed", value: stats?.cards_reviewed ?? "0" }
  ];

  return (
    <AppShell eyebrow="AI study dashboard" title="Welcome back!">
      <div className="grid gap-6 py-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="relative rounded-2xl overflow-hidden glass-panel p-8 text-white shadow-surface">
          {/* Subtle gradient background for the hero section */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next milestone</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Turn uploaded material into notes, quizzes, flashcards, and tutor-ready context.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-textMuted">
              Welcome to the fully connected Edumind platform. Upload a PDF or Video lecture to instantly generate AI study material.
            </p>
          </div>
          <div className="relative z-10 mt-8 flex flex-wrap gap-4">
            <Link href="/materials" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors">
              <FileUp size={18} aria-hidden="true" />
              Upload material
            </Link>
            <Link href="/tutor" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/15 transition-colors border border-white/5">
              <MessageSquareText size={18} aria-hidden="true" />
              Ask AI tutor
            </Link>
          </div>
        </section>

        <section className="rounded-2xl glass-panel p-6 shadow-surface">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Exam prep</h2>
            <button className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors" aria-label="Start exam mode">
              <Play size={16} className="ml-1" />
            </button>
          </div>
          <div className="grid gap-5">
            {[
              ["Operating Systems", 68, "bg-secondary"],
              ["Data Structures", 84, "bg-primary"]
            ].map(([name, value, color]) => (
              <div key={String(name)}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-white">{name}</span>
                  <span className="text-textMuted">{value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${color} shadow-[0_0_10px_currentColor]`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mt-2">
        {weeklyStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl glass-panel p-6 shadow-surface group hover:border-primary/50 transition-colors">
            <p className="text-sm font-medium text-textMuted group-hover:text-white transition-colors">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl glass-panel p-6 shadow-surface">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent materials</h2>
            <Link href="/materials" className="text-sm font-semibold text-primary hover:text-primaryHover transition-colors">View all</Link>
          </div>
          <div className="grid gap-4">
            {materials.length === 0 && (
              <p className="text-sm text-textMuted">No materials uploaded yet. Go upload some!</p>
            )}
            {materials.slice(0, 3).map((material) => (
              <div key={material.id} className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{material.title}</p>
                    <p className="mt-1 text-[13px] text-textMuted capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      {material.material_type.split("/")[1] || material.material_type} - {material.processing_status}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">100%</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-primary shadow-glow" style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

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
