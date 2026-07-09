"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Loader2, Plus, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getStudyTasks, createStudyTask, StudyTask } from "@/lib/api";

export default function PlannerPage() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [status, setStatus] = useState("Loading planner...");
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  useEffect(() => {
    getStudyTasks()
      .then((items) => {
        setTasks(items);
        setStatus("Connected to backend");
      })
      .catch(() => setStatus("Backend is not reachable"));
  }, []);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !topic || !dueDate || !estimatedMinutes) return;
    
    setIsAdding(true);
    setStatus("Adding task...");
    
    try {
      const newTask = {
        title,
        topic,
        due_date: dueDate,
        estimated_minutes: parseInt(estimatedMinutes)
      };
      const created = await createStudyTask(newTask);
      setTasks(prev => [...prev, created]);
      
      // Reset form
      setTitle("");
      setTopic("");
      setDueDate("");
      setEstimatedMinutes("");
      setStatus("Task added successfully");
    } catch {
      setStatus("Failed to add task.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <AppShell eyebrow="Study planner" title="Planner">
      <section className="grid gap-6 py-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-surface">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Upcoming tasks</h2>
            <p className="text-[13px] font-medium text-success">{status}</p>
          </div>
          
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={`${task.title}-${task.due_date}`} className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                    <CalendarCheck size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{task.title}</p>
                    <p className="text-[13px] text-textMuted mt-1 capitalize">
                      {task.topic} • {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1.5 shadow-inner">
                  <Clock size={14} className="text-primary" />
                  <span className="text-[13px] font-semibold text-white">{task.estimated_minutes}m</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-4">
                  <CalendarCheck size={28} className="text-textMuted/50" />
                </div>
                <p className="text-sm text-textMuted">No tasks scheduled. Add one to get started.</p>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <aside className="rounded-2xl glass-panel p-6 shadow-surface">
            <h2 className="text-lg font-bold text-white mb-6">Add new task</h2>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Task Title</label>
                <input 
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white placeholder:text-textMuted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner" 
                  placeholder="e.g. Read Chapter 5"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Subject / Topic</label>
                <input 
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white placeholder:text-textMuted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner" 
                  placeholder="e.g. Operating Systems"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Due Date</label>
                  <input 
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner custom-date-input" 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Est. Minutes</label>
                  <input 
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-white placeholder:text-textMuted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner" 
                    type="number"
                    placeholder="45"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isAdding}
                className="mt-2 h-11 w-full rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-50"
              >
                {isAdding ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                Add Task
              </button>
            </form>
          </aside>

          <aside className="rounded-2xl glass-panel p-6 shadow-surface relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none" />
            <h2 className="text-lg font-bold text-white mb-2 relative z-10">Exam countdown</h2>
            <p className="mt-4 text-[42px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary relative z-10">21 days</p>
            <p className="mt-2 text-[13px] leading-relaxed text-textMuted relative z-10">Current plan keeps daily load below two hours. You are on track.</p>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
