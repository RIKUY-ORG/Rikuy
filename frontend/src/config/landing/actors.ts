// src/config/landing/actors.ts
export interface Actor {
  title: string;
  description: string;
  avatarIndex: number;
}

export const boliviaActors: Actor[] = [
  { title: "Barrios", description: "Los vecinos pueden reportar irregularidades de forma anónima y segura.", avatarIndex: 0 },
  { title: "Organizaciones civiles", description: "ONGs y colectivos pueden registrar casos con trazabilidad verificable.", avatarIndex: 1 },
  { title: "Medios comunitarios", description: "Medios locales pueden dar voz a denuncias con respaldo tecnológico.", avatarIndex: 2 },
  { title: "Jóvenes", description: "Interfaz moderna y clara para participar activamente.", avatarIndex: 3 },
  { title: "Adultos", description: "Sin conocimientos técnicos: pasos claros y guía.", avatarIndex: 4 },
  { title: "Personas mayores", description: "Diseño legible y accesible con pasos guiados.", avatarIndex: 5 },
  { title: "Periodistas", description: "Evidencias con trazabilidad y anonimato.", avatarIndex: 6 },
  { title: "Activistas", description: "Denunciar y dar seguimiento con respaldo.", avatarIndex: 7 },
  { title: "Auditores", description: "Verificación y transparencia en las denuncias.", avatarIndex: 8 },
];
