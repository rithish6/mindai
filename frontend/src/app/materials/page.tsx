"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, FileText, Link2, Loader2, UploadCloud, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getMaterials, Material, uploadMaterial } from "@/lib/api";

const acceptedTypes = [
  { label: "PDF and documents", icon: FileText },
  { label: "Audio lectures", icon: FileAudio },
  { label: "Video classes", icon: Video },
  { label: "YouTube links", icon: Link2 }
];

export default function MaterialsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [status, setStatus] = useState("Loading materials...");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getMaterials()
      .then((items) => {
        setMaterials(items);
        setStatus("Connected to backend");
      })
      .catch(() => setStatus("Backend is not reachable"));
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus("Uploading material...");

    try {
      const uploaded = await uploadMaterial(file);
      setMaterials((current) => [uploaded, ...current]);
      setStatus("Upload queued for processing");
    } catch {
      setStatus("Upload failed. Check that the backend is running.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <AppShell eyebrow="Upload center" title="Materials">
      <section className="grid gap-6 py-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface/30 p-8 text-center hover:bg-surface/50 transition-colors group cursor-pointer relative overflow-hidden"
             onClick={() => !isUploading && inputRef.current?.click()}
        >
          {/* Subtle gradient hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <input ref={inputRef} className="hidden" type="file" onChange={handleFileChange} />
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-primary border border-white/5 group-hover:bg-primary/10 transition-colors shadow-surface">
              {isUploading ? <Loader2 size={28} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={28} aria-hidden="true" />}
            </div>
            <h2 className="mt-6 text-xl font-bold text-white">Add study material</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-textMuted">Upload class files, PDFs, or videos. The backend will automatically extract text or transcribe media.</p>
            <button
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-glow hover:bg-primaryHover transition-colors disabled:opacity-60"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Choose file"}
            </button>
            <p className="mt-5 text-[13px] font-medium text-success">{status}</p>
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-6 shadow-surface">
          <h2 className="text-lg font-bold text-white mb-6">Uploaded materials</h2>
          <div className="grid gap-4">
            {materials.map((material) => (
              <div key={material.id} className="border-t border-border py-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{material.title}</p>
                    <p className="mt-1 text-[13px] text-textMuted capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      {material.material_type} - {material.processing_status}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-textMuted bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    ID: {material.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
            {materials.length === 0 ? <p className="text-sm text-textMuted text-center py-8">No materials loaded yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl glass-panel p-6 shadow-surface mt-2">
        <h2 className="text-lg font-bold text-white mb-6">Accepted sources</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {acceptedTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.label} className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <p className="font-medium text-[15px] text-white">{type.label}</p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
