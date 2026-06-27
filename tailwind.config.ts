import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: "var(--brand-accent)",
          "accent-hover": "var(--brand-accent-hover)",
          "accent-soft": "var(--brand-accent-soft)",
        },
        surface: {
          bg: "var(--surface-bg)",
          card: "var(--surface-card)",
        },
        status: {
          todo: "var(--status-todo)",
          progress: "var(--status-progress)",
          done: "var(--status-done)",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
