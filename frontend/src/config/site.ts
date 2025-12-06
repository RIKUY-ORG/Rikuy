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
  ],

  // 🏛️ Institucional (footer o menú)
  institutional: [
    { label: "Sobre nosotros", href: "/sobre-nosotros" },
    { label: "Políticas de privacidad", href: "/privacidad" },
    { label: "Términos y condiciones", href: "/terminos" },
    { label: "Contacto", href: "/contacto" },
  ],

  // 🆘 Ayuda y soporte
  help: [
    { label: "Tutorial", href: "/tutorial" },
    { label: "Ayuda", href: "/ayuda" },
    { label: "Soporte", href: "/soporte" },
  ],

  // 👤 Cuenta
  account: [
    { label: "Perfil", href: "/perfil" },
    { label: "Inicio de sesión", href: "/login" },
    { label: "Cierre de sesión", href: "/logout" },
  ],

  // 🔗 Enlaces externos
  links: {
    github: "https://github.com/RIKUY-ORG/Rikuy",
    twitter: "https://twitter.com/rikuy_app",
    sponsor: "https://patreon.com/rikuy",
  },
};
