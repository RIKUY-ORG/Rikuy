// src/components/footer.tsx
import { Link } from "@heroui/link";
import { 
  FaGithub, 
  FaXTwitter, 
  FaFacebook, 
  FaInstagram, 
  FaTiktok, 
  FaEnvelope,
  // FaDiscord,
  // FaLinkedin
} from "react-icons/fa6";
import { GoHeartFill } from "react-icons/go";
import { siteConfig } from "@/config/site";
import { RikuyLogo } from "@/components/rikuyLogo";

// Array de redes sociales usando siteConfig
const socialLinks = [
  { 
    icon: FaXTwitter, 
    href: siteConfig.links.twitter,
    label: "Twitter/X",
    color: "text-default-500 hover:text-default-800"
  },
  { 
    icon: FaInstagram, 
    href: siteConfig.links.instagram,
    label: "Instagram",
    color: "text-default-500 hover:text-pink-600"
  },
  { 
    icon: FaTiktok, 
    href: siteConfig.links.tiktok,
    label: "TikTok",
    color: "text-default-500 hover:text-black"
  },
  { 
    icon: FaFacebook, 
    href: siteConfig.links.facebook,
    label: "Facebook",
    color: "text-default-500 hover:text-blue-600"
  },
  { 
    icon: FaGithub, 
    href: siteConfig.links.github,
    label: "GitHub",
    color: "text-default-500 hover:text-default-800"
  },
  { 
    icon: FaEnvelope, 
    href: siteConfig.links.email,
    label: "Email",
    color: "text-default-500 hover:text-primary-600"
  }
] as const;

// Redes sociales adicionales (opcional)
// const extraSocialLinks = [
//   {
//     icon: FaDiscord,
//     href: siteConfig.links.discord,
//     label: "Discord",
//     color: "text-default-500 hover:text-indigo-600"
//   },
//   {
//     icon: FaLinkedin,
//     href: siteConfig.links.linkedin,
//     label: "LinkedIn",
//     color: "text-default-500 hover:text-blue-700"
//   }
// ];

export const Footer = () => {
  return (
    <footer className="w-full border-t border-default-200 py-6 px-4 text-sm text-default-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Logo, texto, redes y copyright */}
        <div className="flex flex-col items-center gap-4 col-span-1">
          <RikuyLogo size={100} title="Logo de RIKUY" />
          <span className="font-semibold text-default-600">{siteConfig.name}</span>
          
          {/* Redes sociales principales */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.label}
                  isExternal
                  href={social.href}
                  className={`transition-colors duration-200 ${social.color}`}
                  aria-label={social.label}
                >
                  <Icon className="size-5" />
                </Link>
              );
            })}
          </div>

          {/* Redes sociales adicionales (opcional, comentar si no se usan) */}
          {/* <div className="flex flex-wrap justify-center gap-3 mt-1">
            {extraSocialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.label}
                  isExternal
                  href={social.href}
                  className={`transition-colors duration-200 ${social.color}`}
                  aria-label={social.label}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div> */}

          {/* Copyright - Desktop */}
          <div className="hidden md:block mt-4 text-center text-xs text-default-400">
            © {new Date().getFullYear()} {siteConfig.name}.<br />Todos los derechos reservados.
          </div>
        </div>

        {/* Institucional */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Institucional</h3>
          {siteConfig.institutional.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              color="foreground" 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ayuda y soporte */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Ayuda y Soporte</h3>
          {siteConfig.help.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              color="foreground" 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Impacto y Comunidad */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Impacto</h3>
          {siteConfig.impact.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              color="foreground" 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
          
          {/* Sponsor */}
          <div className="mt-4 pt-4 border-t border-default-200 w-full">
            <Link
              isExternal
              href={siteConfig.links.sponsor}
              className="flex items-center gap-2 text-danger hover:text-danger-600 transition-colors"
            >
              <GoHeartFill className="size-4" />
              Patrocinar {siteConfig.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Powered by RIKUY */}
      <div className="mt-8 flex items-center justify-center">
        <Link
          isExternal
          className="flex items-center gap-1 text-current hover:text-primary transition-colors"
          href="https://github.com/RIKUY-ORG?view_as=public"
          title={`${siteConfig.name} homepage`}
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary font-semibold">{siteConfig.name}</p>
        </Link>
      </div>

      {/* Contacto rápido */}
      {/* <div className="mt-4 text-center text-xs text-default-400">
        <p>
          {siteConfig.contact.email} 
          {siteConfig.contact.phone && ` · ${siteConfig.contact.phone}`}
          {siteConfig.contact.address && ` · ${siteConfig.contact.address}`}
        </p>
      </div> */}

      {/* Copyright - Mobile */}
      <div className="md:hidden mt-6 text-center text-xs text-default-400">
        © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
};