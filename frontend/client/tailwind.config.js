/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Orbitron"', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        'sybil-bg': '#0d1117',
        'sybil-panel': '#161b22',
        'sybil-accent': '#00fff7',
        'sybil-danger': '#ff4d4f',
        'sybil-text': '#c9d1d9',
        'sybil-glow': '#00e0ff',
      },
      boxShadow: {
        'sybil-glow': '0 0 10px #00fff7, 0 0 20px #00fff7',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
