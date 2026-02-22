// src/components/footer.tsx
import { Link } from "react-router-dom";
import { 
  FaGithub, 
  FaXTwitter, 
  FaFacebook, 
  FaInstagram, 
  FaTiktok, 
  FaEnvelope,
} from "react-icons/fa6";
import { GoHeartFill } from "react-icons/go";
import { siteConfig } from "@/config/site";
import { RikuyLogo } from "@/components/rikuyLogo";

// Array de redes sociales usando siteConfig (TODOS EXTERNOS)
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

export const Footer = () => {
  return (
    <footer className="w-full border-t border-default-200 py-6 px-4 text-sm text-default-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Logo, texto, redes y copyright */}
        <div className="flex flex-col items-center gap-4 col-span-1">
          <RikuyLogo size={100} title="Logo de RIKUY" />
          <span className="font-semibold text-default-600">{siteConfig.name}</span>
          
          {/* Redes sociales principales - EXTERNAS */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transition-colors duration-200 ${social.color}`}
                  aria-label={social.label}
                >
                  <Icon className="size-5" />
                </a>
              );
            })}
          </div>

          {/* Copyright - Desktop */}
          <div className="hidden md:block mt-4 text-center text-xs text-default-400">
            © {new Date().getFullYear()} {siteConfig.name}.<br />Todos los derechos reservados.
          </div>
        </div>

        {/* Institucional - INTERNOS */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Institucional</h3>
          {siteConfig.institutional.map((item) => (
            <Link 
              key={item.href} 
              to={item.href} 
              className="hover:text-primary transition-colors text-default-500"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ayuda y soporte - INTERNOS */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Ayuda y Soporte</h3>
          {siteConfig.help.map((item) => (
            <Link 
              key={item.href} 
              to={item.href} 
              className="hover:text-primary transition-colors text-default-500"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Impacto y Comunidad - INTERNOS */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="font-semibold text-default-700 mb-2">Impacto</h3>
          {siteConfig.impact.map((item) => (
            <Link 
              key={item.href} 
              to={item.href} 
              className="hover:text-primary transition-colors text-default-500"
            >
              {item.label}
            </Link>
          ))}
          
          {/* Sponsor - EXTERNO */}
          <div className="mt-4 pt-4 border-t border-default-200 w-full">
            <a
              href={siteConfig.links.sponsor}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-danger hover:text-danger-600 transition-colors"
            >
              <GoHeartFill className="size-4" />
              Patrocinar {siteConfig.name}
            </a>
          </div>
        </div>
      </div>

      {/* Powered by RIKUY - EXTERNO */}
      <div className="mt-8 flex items-center justify-center">
        <a
          href="https://github.com/RIKUY-ORG?view_as=public"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-current hover:text-primary transition-colors"
          title={`${siteConfig.name} homepage`}
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary font-semibold">{siteConfig.name}</p>
        </a>
      </div>

      {/* Copyright - Mobile */}
      <div className="md:hidden mt-6 text-center text-xs text-default-400">
        © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
};