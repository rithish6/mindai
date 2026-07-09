"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
    
    if (ref.current) {
      // Clear previous chart to force a re-render
      ref.current.removeAttribute("data-processed");
      ref.current.innerHTML = chart;
      try {
        mermaid.contentLoaded();
      } catch (e) {
        console.error("Mermaid error:", e);
      }
    }
  }, [chart]);

  return <div className="mermaid flex justify-center w-full" ref={ref} />;
}
