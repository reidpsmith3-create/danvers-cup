import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        danvers: {
          background: "#0a0f0a",
          surface: "#111827",
          surface2: "#172033",
          border: "#1f2937",
          green: "#3f7d4c",
          greenDark: "#2d5a27",
          gold: "#d4af37",
          text: "#f8fafc",
          muted: "#94a3b8",
        },
      },
      backgroundImage: {
        "danvers-radial":
          "radial-gradient(circle at top, rgba(63,125,76,0.28), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;