// src/pages/perfil/components/SocialLinks.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { siteConfig } from "@/config/site";
import { FaGithub, FaXTwitter, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa6";

const socialLinks = [
  { icon: FaXTwitter, href: siteConfig.links.twitter, label: "Twitter/X", color: "hover:text-default-800" },
  { icon: FaInstagram, href: siteConfig.links.instagram, label: "Instagram", color: "hover:text-pink-600" },
  { icon: FaTiktok, href: siteConfig.links.tiktok, label: "TikTok", color: "hover:text-black" },
  { icon: FaFacebook, href: siteConfig.links.facebook, label: "Facebook", color: "hover:text-blue-600" },
  { icon: FaGithub, href: siteConfig.links.github, label: "GitHub", color: "hover:text-default-800" },
];

export function SocialLinks() {
  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-xl font-semibold">Síguenos</h2>
      </CardHeader>
      <CardBody>
        <div className="flex flex-wrap justify-center gap-4">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full bg-default-100 dark:bg-default-800 hover:scale-110 transition-all ${social.color}`}
                aria-label={social.label}
              >
                <Icon size={20} />
              </a>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}