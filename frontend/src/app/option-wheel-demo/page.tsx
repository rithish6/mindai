"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import OptionWheel from "@/components/OptionWheel";
import { Sliders, Settings2, Volume2 } from "lucide-react";

export default function OptionWheelDemoPage() {
  const [selectedIdx, setSelectedIdx] = useState(3);
  const [selectedLabel, setSelectedLabel] = useState("Jazz");
  
  // Custom props
  const [side, setSide] = useState<"left" | "right">("left");
  const [loop, setLoop] = useState(true);
  const [draggable, setDraggable] = useState(true);
  const [fontSize, setFontSize] = useState(2.8);
  const [spacing, setSpacing] = useState(1.4);
  const [curve, setCurve] = useState(1.1);
  const [tilt, setTilt] = useState(7);
  const [blur, setBlur] = useState(1.8);
  const [fade, setFade] = useState(0.25);
  const [minOpacity, setMinOpacity] = useState(0.08);
  const [smoothing, setSmoothing] = useState(220);
  const [inset, setInset] = useState(60);
  const [soundUrl, setSoundUrl] = useState("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
  const [soundVolume, setSoundVolume] = useState(0.4);

  const testItems = [
    "Ambient Ambient",
    "House Fusion",
    "Techno Beats",
    "Jazz & Blues",
    "Lo-Fi Study",
    "Synthwave Retro",
    "Trance Dreams",
    "Funk Classics",
    "Disco Fever",
    "Hip-Hop Vocals",
    "Chillwave Vibe",
    "Drum & Bass Rise"
  ];

  return (
    <AppShell eyebrow="Component Showcase" title="Interactive Option Wheel">
      <div className="grid h-[calc(100vh-140px)] gap-6 p-4 lg:grid-cols-[1fr_360px] overflow-hidden">
        
        {/* Visual Showcase Panel */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl bg-surface/30 border border-border/80 backdrop-blur-xl overflow-hidden group">
          {/* Neon background glows */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 group-hover:scale-110" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 group-hover:scale-110" />

          {/* Current Selection HUD overlay */}
          <div className="absolute top-8 left-8 z-10 rounded-2xl bg-black/40 border border-white/5 px-5 py-3 backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 block mb-0.5">
              Current Selection
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {selectedLabel}
              </span>
              <span className="text-xs text-textMuted font-mono">
                [idx: {selectedIdx}]
              </span>
            </div>
          </div>

          {/* Wheel Frame */}
          <div className="relative w-full h-[60vh] flex items-center">
            {/* Middle selection line indicator */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-full h-20 bg-gradient-to-r ${
                side === "left" 
                  ? "from-primary/10 via-transparent to-transparent border-l-4 border-primary"
                  : "to-primary/10 via-transparent from-transparent border-r-4 border-primary"
              } pointer-events-none`}
            />

            <OptionWheel
              items={testItems}
              defaultSelected={3}
              onChange={(idx, label) => {
                setSelectedIdx(idx);
                setSelectedLabel(label);
              }}
              textColor="#94a3b8"
              activeColor="#8b5cf6"
              side={side}
              fontSize={fontSize}
              spacing={spacing}
              curve={curve}
              tilt={tilt}
              blur={blur}
              fade={fade}
              minOpacity={minOpacity}
              smoothing={smoothing}
              inset={inset}
              loop={loop}
              draggable={draggable}
              soundUrl={soundUrl}
              soundVolume={soundVolume}
            />
          </div>

          {/* Instructional helper text */}
          <div className="absolute bottom-8 text-center pointer-events-none">
            <p className="text-xs text-textMuted">
              Use your <span className="text-white font-semibold">Mouse Wheel / Trackpad</span> scroll or <span className="text-white font-semibold">Drag</span> to rotate the wheel.
            </p>
            <p className="text-[10px] text-textMuted/70 mt-1">
              Supports Keyboard Up / Down arrows when focused
            </p>
          </div>
        </div>

        {/* Configuration Sidebar */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Layout & Core Config */}
          <div className="rounded-2xl glass-panel p-6 border border-border/80">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Settings2 size={16} className="text-primary" />
              Wheel Behavior
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textMuted font-medium">Wheel Alignment</span>
                <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/5">
                  <button
                    onClick={() => setSide("left")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      side === "left" ? "bg-primary text-white" : "text-textMuted hover:text-white"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => setSide("right")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      side === "right" ? "bg-primary text-white" : "text-textMuted hover:text-white"
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-textMuted font-medium">Infinite Loop</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-textMuted font-medium">Pointer Draggable</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draggable}
                    onChange={(e) => setDraggable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Aesthetics Sliders */}
          <div className="rounded-2xl glass-panel p-6 border border-border/80">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sliders size={16} className="text-primary" />
              Aesthetics & Math
            </h3>

            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Font Size (rem)</span>
                  <span className="text-white font-mono">{fontSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Spacing */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Spacing Factor</span>
                  <span className="text-white font-mono">{spacing}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={spacing}
                  onChange={(e) => setSpacing(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Curve */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">3D Curve Depth</span>
                  <span className="text-white font-mono">{curve}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={curve}
                  onChange={(e) => setCurve(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Tilt */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Tilt Angle (deg)</span>
                  <span className="text-white font-mono">{tilt}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={tilt}
                  onChange={(e) => setTilt(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Inset */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Horizontal Inset (px)</span>
                  <span className="text-white font-mono">{inset}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={inset}
                  onChange={(e) => setInset(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Focal Blur</span>
                  <span className="text-white font-mono">{blur}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={blur}
                  onChange={(e) => setBlur(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Fade */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Distance Fade</span>
                  <span className="text-white font-mono">{fade}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={fade}
                  onChange={(e) => setFade(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Smoothing */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Smoothing (ms)</span>
                  <span className="text-white font-mono">{smoothing}ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={smoothing}
                  onChange={(e) => setSmoothing(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Sound Controls */}
          <div className="rounded-2xl glass-panel p-6 border border-border/80">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Volume2 size={16} className="text-primary" />
              Tick Sound Feedback
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-textMuted block mb-1">Sound URL</label>
                <input
                  type="text"
                  value={soundUrl}
                  onChange={(e) => setSoundUrl(e.target.value)}
                  placeholder="sound URL"
                  className="w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white focus:border-primary outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted font-medium">Volume</span>
                  <span className="text-white font-mono">{soundVolume}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
