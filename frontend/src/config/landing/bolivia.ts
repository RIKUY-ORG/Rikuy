// src/config/landing/bolivia.ts
import { CountryConfig } from "./types";

export const boliviaConfig: CountryConfig = {
  hero: {
    title: "La verdad no necesita rostro",
    subtitle:
      "Denuncia sin miedo. Evidencia anónima e inmutable, atendida por aliados (ONGs, periodistas, auditores). Hecho en Bolivia.",
    primaryCta: { label: "Denunciar anónimamente", href: "/denunciar" },
    secondaryCta: { label: "Cómo funciona", href: "/como-funciona" },
    missionNote:
      "Rikuy busca que ninguna denuncia quede olvidada. Tus evidencias se registran de forma segura, preservando el anonimato y evitando la manipulación.",
  },
  problem: {
    headline: "El silencio protege al crimen",
    items: [
      { title: "Miedo a represalias", description: "El riesgo personal y la desconfianza institucional frenan la denuncia." },
      { title: "Evidencia que desaparece", description: "Reportes se archivan o se borran por corrupción y manipulación." },
      { title: "Comunidades sin voz", description: "Sin presión social o mediática, los casos reales quedan invisibles." },
    ],
  },
  solution: {
    headline: "Rikuy rompe el ciclo del silencio",
    points: [
      { label: "Anonimato real", description: "Nadie puede rastrearte, ni siquiera nosotros." },
      { label: "Evidencia inmutable", description: "Tus pruebas no pueden ser borradas por nadie." },
      { label: "Atención y presión", description: "Aliados verifican y empujan acciones concretas." },
    ],
  },
  howItWorks: {
    headline: "Cómo funciona",
    steps: [
      { title: "Captura y envía", description: "Sube foto/video con contexto básico, sin datos personales." },
      { title: "Anonimiza y asegura", description: "Limpiamos metadatos y registramos evidencia inmutable." },
      { title: "Verificación comunitaria", description: "Vecinos validan de forma anónima para evitar fraudes." },
      { title: "Activamos acciones", description: "Alertas a ONGs, periodistas y autoridades no corruptas." },
      { title: "Recompensa secundaria", description: "Hay incentivo; el foco es que tu denuncia importe." },
    ],
  },
  trust: {
    headline: "Confianza y transparencia",
    notes: [
      "No necesitas entender crypto: usa correo o Google.",
      "Tus denuncias no se pueden borrar ni alterar.",
      "El foco es tu seguridad y el impacto real del caso.",
    ],
    badges: [{ label: "Anonimato garantizado" }, { label: "Evidencia inmutable" }],
  },
};
