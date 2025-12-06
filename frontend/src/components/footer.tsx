import { Link } from "@heroui/link";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { GoHeartFill } from "react-icons/go";
import { siteConfig } from "@/config/site";
import { RikuyLogo } from "@/components/rikuyLogo";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-default-200 py-6 px-4 text-sm text-default-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6 items-start">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <RikuyLogo size={100} title="Logo de RIKUY" />
          <span className="font-semibold text-default-600">RIKUY</span>
        </div>

        {/* Institucional */}
        <div className="flex flex-col gap-2">
          {siteConfig.institutional.map((item) => (
            <Link key={item.href} href={item.href} color="foreground">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Ayuda y soporte */}
        <div className="flex flex-col gap-2">
          {siteConfig.help.map((item) => (
            <Link key={item.href} href={item.href} color="foreground">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Redes y sponsor */}
        <div className="flex flex-col gap-2">
          <Link isExternal href={siteConfig.links.github}>
            <FaGithub className="inline mr-2" />
            GitHub
          </Link>
          <Link isExternal href={siteConfig.links.twitter}>
            <FaXTwitter className="inline mr-2" />
            Twitter
          </Link>
          <Link
            isExternal
            href={siteConfig.links.sponsor}
            className="flex items-center gap-2 text-danger"
          >
            <GoHeartFill className="inline size-4" />
            Patrocinar RIKUY
          </Link>
        </div>
      </div>

      {/* Powered by HeroUI */}
      <div className="mt-6 flex items-center justify-center">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://github.com/RIKUY-ORG?view_as=public"
          title="RIKUY homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">RIKUY</p>
        </Link>
      </div>

      {/* Derechos reservados */}
      <div className="mt-2 text-center text-xs text-default-400">
        © {new Date().getFullYear()} RIKUY. Todos los derechos reservados.
      </div>
    </footer>
  );
};
