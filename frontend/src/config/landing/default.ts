// src/config/landing/default.ts
import { CountryConfig } from "./types";

export const defaultConfig: CountryConfig = {
  hero: {
    title: "Denuncia sin miedo",
    subtitle: "Anonimato, evidencia inmutable y atención real a tu caso.",
    primaryCta: { label: "Denunciar anónimamente", href: "/denunciar" },
    secondaryCta: { label: "Cómo funciona", href: "/como-funciona" },
    missionNote: "Tu evidencia se registra de forma segura, anónima e inmutable.",
  },
  problem: {
    headline: "El problema",
    items: [
      { title: "Riesgo personal", description: "El miedo impide denunciar." },
      { title: "Evidencia frágil", description: "Reportes se pierden o manipulan." },
    ],
  },
  solution: {
    headline: "La solución",
    points: [
      { label: "Anonimato", description: "Tu identidad nunca se revela." },
      { label: "Inmutabilidad", description: "Nadie puede borrar tu evidencia." },
    ],
  },
  howItWorks: {
    headline: "Cómo funciona",
    steps: [
      { title: "Reporta", description: "Captura y envía tu evidencia." },
      { title: "Verifica", description: "La comunidad valida y prioriza." },
      { title: "Actúa", description: "Se activan aliados y alertas." },
    ],
  },
  trust: {
    headline: "Confianza",
    notes: ["Simple, seguro y accesible."],
  },
};
