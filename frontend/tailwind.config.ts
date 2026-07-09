import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        surface: "#13131A",
        border: "#272732",
        primary: "#8B5CF6", // Purple
        primaryHover: "#A78BFA",
        secondary: "#3B82F6", // Blue
        text: "#F8FAFC",
        textMuted: "#94A3B8",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.3)",
        surface: "0 4px 20px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        'gradient-ai': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
      }
    }
  },
  plugins: []
};

export default config;
