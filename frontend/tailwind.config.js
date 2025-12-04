import { heroui } from "@heroui/theme"
/** @type {import('tailwindcss').Config} */

const config = {
  content: [
    "./index.html",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "sans-serif"],
      },
      colors: {
        milk: "#f8f9f7",
        ink: "#1a1a1a",
        green: "#4caf50",
        blue: "#3b82f6",
        red: "#ef4444",
        yellow: "#facc15",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#f8f9f7",
            foreground: "#1a1a1a",
            primary: { DEFAULT: "#3b82f6", foreground: "#ffffff" },
            secondary: { DEFAULT: "#4caf50", foreground: "#ffffff" },
            success: { DEFAULT: "#4caf50", foreground: "#ffffff" },
            warning: { DEFAULT: "#facc15", foreground: "#1a1a1a" },
            danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
          },
        },
        dark: {
          colors: {
            background: "#1a1a1a",
            foreground: "#f8f9f7",
            primary: { DEFAULT: "#3b82f6", foreground: "#ffffff" },
            secondary: { DEFAULT: "#4caf50", foreground: "#ffffff" },
            success: { DEFAULT: "#4caf50", foreground: "#05230b" },
            warning: { DEFAULT: "#facc15", foreground: "#251500" },
            danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
          },
        },
      },
    }),
  ],
}

export default config
