import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zynex: {
          indigo: "#4F46E5",
          indigoHover: "#4338CA",
          ink: "#111827",
          muted: "#4C596C",
          line: "#E5E7EB"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  plugins: []
};

export default config;
