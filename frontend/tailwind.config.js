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
        green: "#10b981", // verde más moderno
        blue: "#3b82f6",
        red: "#ef4444",
        yellow: "#f59e0b", // ámbar más cálido
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
            background: "#f8fafc", // azul muy claro
            foreground: "#0f172a", // slate oscuro
            primary: { 
              DEFAULT: "#2563eb", // azul vibrante
              foreground: "#ffffff" 
            },
            secondary: { 
              DEFAULT: "#7c3aed", // violeta
              foreground: "#ffffff" 
            },
            success: { 
              DEFAULT: "#10b981", // verde esmeralda
              foreground: "#ffffff" 
            },
            warning: { 
              DEFAULT: "#f59e0b", // ámbar
              foreground: "#ffffff" 
            },
            danger: { 
              DEFAULT: "#dc2626", // rojo
              foreground: "#ffffff" 
            },
            // Colores de superficie para cards
            content1: "#ffffff",
            content2: "#f1f5f9",
            content3: "#e2e8f0",
            content4: "#cbd5e1",
          },
        },
        dark: {
          colors: {
            background: "#0f172a", // slate oscuro
            foreground: "#f1f5f9", // gris claro
            primary: { 
              DEFAULT: "#60a5fa", // azul claro
              foreground: "#0f172a" 
            },
            secondary: { 
              DEFAULT: "#a78bfa", // violeta claro
              foreground: "#0f172a" 
            },
            success: { 
              DEFAULT: "#34d399", // verde claro
              foreground: "#0f172a" 
            },
            warning: { 
              DEFAULT: "#fbbf24", // amarillo
              foreground: "#0f172a" 
            },
            danger: { 
              DEFAULT: "#f87171", // rojo claro
              foreground: "#0f172a" 
            },
            // Colores de superficie para cards (tonos más oscuros)
            content1: "#1e293b",
            content2: "#334155",
            content3: "#475569",
            content4: "#64748b",
          },
        },
      },
    }),
  ],
};

export default config;