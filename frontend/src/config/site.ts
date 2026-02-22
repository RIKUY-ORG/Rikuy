// src/config/site.ts
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "RIKUY",
  description: "Plataforma de denuncias anónimas, seguras y accesibles para Latinoamérica.",

  // 🧭 Navegación principal (navbar)
  navItems: [
    { label: "Inicio", href: "/" },
    { label: "Denunciar", href: "/denunciar" },
    { label: "Cómo funciona", href: "/como-funciona" },
    { label: "Comunidades", href: "/comunidades" },
    { label: "Aliados", href: "/aliados" },
    { label: "Mapa", href: "/mapa" },
  ],

  // 🏛️ Institucional (footer)
  institutional: [
    { label: "Sobre nosotros", href: "/sobre-nosotros" },
    { label: "Políticas de privacidad", href: "/privacidad" },
    { label: "Términos y condiciones", href: "/terminos" },
    { label: "Contacto", href: "/contacto" },
    { label: "Denuncias", href: "/denuncias" },
  ],

  // 🆘 Ayuda y soporte
  help: [
    { label: "Tutorial", href: "/tutorial" },
    { label: "Ayuda", href: "/ayuda" },
    { label: "Soporte", href: "/soporte" },
    { label: "Preguntas frecuentes", href: "/faq" },
  ],

  // 👤 Cuenta
  account: [
    { label: "Perfil", href: "/perfil" },
    { label: "Inicio de sesión", href: "/login" },
    { label: "Cierre de sesión", href: "/logout" },
  ],

  // 📊 Secciones de impacto
  impact: [
    { label: "Ver denuncias", href: "/denuncias" },
    { label: "Ver comunidades", href: "/comunidades" },
    { label: "Ver aliados", href: "/aliados" },
    { label: "Ver mapa", href: "/mapa" },
  ],

  // 🔗 Redes sociales y enlaces externos
  links: {
    // Redes sociales
    twitter: "https://twitter.com/rikuy_app",
    instagram: "https://instagram.com/rikuy.app",
    tiktok: "https://tiktok.com/@rikuy_app",
    facebook: "https://www.facebook.com/people/Rikuy-App/61588152224751/",
    github: "https://github.com/RIKUY-ORG/Rikuy",
    email: "mailto:rikuy.app@gmail.com",
    
    // Sponsors y otros
    sponsor: "https://patreon.com/rikuy",
    discord: "https://discord.gg/rikuy", // Opcional
    linkedin: "https://linkedin.com/company/rikuy", // Opcional
  },

  // 📱 Información de contacto
  contact: {
    email: "rikuy.app@gmail.com",
    phone: "+591 12345678", // Opcional
    address: "Bolivia", // Opcional
  },
};

// src/config/site.ts (agregar esta constante)
export const LANDING_ROUTES = [
  '/',
  '/como-funciona',
  '/sobre-nosotros',
  '/privacidad',
  '/terminos',
  '/contacto',
  '/tutorial',
  '/ayuda',
  '/soporte',
  '/login',
  '/verificar-identidad',
];