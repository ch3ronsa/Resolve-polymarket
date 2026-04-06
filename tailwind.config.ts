import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10222d",
        mist: "#f3f6f8",
        dune: "#f6f0e8",
        tide: "#d7ebe7",
        slate: "#6a7a84",
        signal: "#1b5f5a",
        caution: "#a55f2c",
        danger: "#9f3848"
      },
      boxShadow: {
        calm: "0 18px 60px -30px rgba(16, 34, 45, 0.35)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"],
        serif: ["Iowan Old Style", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;

