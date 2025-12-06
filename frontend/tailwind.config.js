import { heroui } from "@heroui/theme";
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
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        scroll: "scroll 30s linear infinite",
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
        // dark: {
        //   colors: {
        //     background: "#1a1a1a",
        //     foreground: "#f8f9f7",
        //     primary: { DEFAULT: "#3b82f6", foreground: "#ffffff" },
        //     secondary: { DEFAULT: "#4caf50", foreground: "#ffffff" },
        //     success: { DEFAULT: "#4caf50", foreground: "#ffffff" }, // antes era #05230b
        //     warning: { DEFAULT: "#facc15", foreground: "#000000" }, // antes era #251500
        //     danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        //   },
        // },
        dark: {
          colors: {
            background: "#121212", // más suave
            foreground: "#e0e0e0", // menos brillante
            primary: { DEFAULT: "#60a5fa", foreground: "#ffffff" }, // azul pastel
            secondary: { DEFAULT: "#34d399", foreground: "#ffffff" }, // verde jade
            success: { DEFAULT: "#22c55e", foreground: "#ffffff" }, // verde accesible
            warning: { DEFAULT: "#fbbf24", foreground: "#1a1a1a" }, // amarillo cálido
            danger: { DEFAULT: "#f87171", foreground: "#ffffff" }, // rojo suave
          },
        },
      },
    }),
  ],
};

export default config;
