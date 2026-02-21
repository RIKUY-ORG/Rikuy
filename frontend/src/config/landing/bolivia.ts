// src/config/landing/bolivia.ts
import { CountryConfig } from "./types";

export const boliviaConfig: CountryConfig = {
  hero: {
    title: "La verdad no necesita rostro",
    subtitle: "Denuncia sin miedo. Evidencia anónima e inmutable, atendida por aliados (ONGs, periodistas, auditores). Hecho en Bolivia.",
    primaryCta: { label: "Denunciar anónimamente", href: "/denunciar" },
    secondaryCta: { label: "Cómo funciona", href: "/como-funciona" },
    missionNote: "Rikuy busca que ninguna denuncia quede olvidada. Tus evidencias se registran de forma segura, preservando el anonimato y evitando la manipulación.",
  },
  problem: {
    headline: "El silencio protege al crimen",
    items: [
      { 
        title: "Miedo a represalias", 
        description: "El riesgo personal y la desconfianza institucional frenan la denuncia. La mayoría prefiere quedarse callada." 
      },
      { 
        title: "Evidencia que desaparece", 
        description: "Los reportes se archivan o se borran por corrupción y manipulación. Las pruebas se pierden para siempre." 
      },
      { 
        title: "Comunidades sin voz", 
        description: "Sin presión social o mediática, los casos reales quedan invisibles. Las comunidades rurales son ignoradas." 
      },
    ],
  },
  solution: {
    headline: "Rikuy rompe el ciclo del silencio",
    points: [
      { 
        label: "Anonimato real", 
        description: "Nadie puede rastrearte, ni siquiera nosotros. Tu identidad está protegida por tecnología de punta." 
      },
      { 
        label: "Evidencia inmutable", 
        description: "Tus pruebas no pueden ser borradas por nadie. Quedan registradas en blockchain para siempre." 
      },
      { 
        label: "Atención y presión", 
        description: "Aliados verifican y empujan acciones concretas. Tu denuncia llega a quienes pueden actuar." 
      },
    ],
  },
  howItWorks: {
    headline: "Cómo funciona",
    steps: [
      { 
        title: "Te registras una sola vez", 
        description: "Solo para verificar que eres una persona real. Nadie verá tu nombre ni tus datos. Jamás." 
      },
      { 
        title: "Tomas la evidencia", 
        description: "Una foto, un video, una descripción. Lo que tengas. No necesitas ser experto." 
      },
      { 
        title: "Eliges la categoría", 
        description: "Infraestructura, corrupción, seguridad, medio ambiente... lo que corresponda." 
      },
      { 
        title: "Envías tu denuncia", 
        description: "En segundos queda registrada. Permanente. Verificada. Anónima." 
      },
      { 
        title: "Decides qué pasa después", 
        description: "Comparte tu caso con abogados, medios u organizaciones, sin revelar quién eres." 
      },
    ],
  },
  trust: {
    headline: "Nuestras garantías",
    notes: [
      "Anónimo: Nadie sabrá que fuiste tú. Ni Rikuy.",
      "Permanente: Tu denuncia no puede borrarse ni alterarse.",
      "Verificado: Cada reporte pasa por revisión antes de publicarse.",
      "Accesible: Desde cualquier celular, en cualquier rincón de Bolivia.",
    ],
    badges: [
      { label: "Anonimato garantizado" },
      { label: "Evidencia inmutable" },
      { label: "Verificado por IA" },
      { label: "Sin rastreo" },
    ],
  },
};