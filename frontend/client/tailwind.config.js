// tailwind.config.js
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Orbitron", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      colors: {
        "sybil-bg": "#0d1117",
        "sybil-panel": "#161b22",
        "sybil-accent": "#00fff7",
        "sybil-danger": "#ff4d4f",
        "sybil-text": "#c9d1d9",
        "sybil-glow": "#00e0ff",
      },
      boxShadow: {
        "sybil-glow": "0 0 10px #00fff7, 0 0 20px #00fff7",
      },
      typography: (theme) => ({
        invert: {
          css: {
            pre: {
              backgroundColor: theme("colors.sybil-panel"),
              border: `1px solid ${theme("colors.sybil-accent")}`,
              borderRadius: theme("borderRadius.lg"),
              padding: theme("spacing.4"),
              position: "relative",
            },
            "pre code": {
              color: theme("colors.sybil-text"),
              fontFamily: theme("fontFamily.mono").join(", "),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
