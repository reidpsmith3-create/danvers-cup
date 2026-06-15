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
          background: "#08110d",
          surface: "#101612",
          surface2: "#18231c",
          border: "#26342b",
          green: "#2f6b45",
          greenDark: "#183d2a",
          brass: "#b08d45",
          gold: "#b08d45",
          text: "#f4f1e8",
          muted: "#a7b0a6",
        },
      },
      backgroundImage: {
        "danvers-radial":
          "radial-gradient(circle at top, rgba(47,107,69,0.28), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;