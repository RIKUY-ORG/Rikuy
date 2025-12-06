import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Link } from "@heroui/link";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { FaGithub, FaInstagram, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// Data del equipo
const team = [
  {
    name: "Daniel (alias Firrton)",
    role: "Web3 Developer",
    location: { country: "México", flag: "🇲🇽" },
    bio: "Boliviano que actualmente reside en México gracias a becas de estudio. Fue quien impulsó la idea de RIKUY, inspirado en la necesidad de denunciar la corrupción agravada en su país y en la región.",
    techStack: ["Scroll", "Arkiv", "Smart Contracts", "Web3"],
    contributions: ["Arquitecto", "DevOps", "Frontend", "Backend"],
    avatar: "https://github.com/firrton.png",
    socials: {
      twitter: "https://x.com/FirrtonH",
      instagram: "https://www.instagram.com/daniel.h1298",
      github: "https://github.com/Firrton",
    },
  },
  {
    name: "Julio (alias Tomoki977)",
    role: "Full-stack Web2 Developer",
    location: { country: "Bolivia", flag: "🇧🇴" },
    bio: "Desarrollador full-stack enfocado en accesibilidad y experiencia de usuario. Lidera el frontend de RIKUY, asegurando que la plataforma sea sencilla, inclusiva y usable por cualquier persona.",
    techStack: ["React", "Vite", "HeroUI", "Privi"],
    contributions: ["Arquitecto", "Frontend", "Backend", "Accesibilidad", "DevOps"],
    avatar: "https://github.com/tomoki977.png",
    socials: {
      twitter: "https://x.com/TomoKi977",
      instagram: "https://www.instagram.com/rasec56",
      github: "https://github.com/TOMOKI977",
    },
  },
  {
    name: "Isra (alias IsraStreet)",
    role: "Content Creator",
    location: { country: "Bolivia", flag: "🇧🇴" },
    bio: "Creador de contenido en TikTok, enfocado en soluciones Web3 y fintech para pagos internacionales. Su experiencia viajando y mostrando cómo la banca boliviana limitó el uso de dólares y tarjetas en el exterior lo motivó a promover alternativas descentralizadas.",
    techStack: ["Comunicación", "Difusión", "Accesibilidad", "Lluvia de ideas"],
    contributions: ["Difusión", "Accesibilidad", "Lluvia de ideas"],
    avatar: "https://github.com/israstreet.png",
    socials: {
      twitter: "https://x.com/israstreetbo",
      instagram: "https://www.instagram.com/isra.street",
      github: "https://github.com/israstreet",
      tiktok: "https://www.tiktok.com/@isra.street",
    },
  },
];

export default function AboutPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Sobre nosotros</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            RIKUY nació en la hackathon Ethereum Argentina y en la Devconnect 2025,
            como una idea para combatir la corrupción en Latinoamérica. Somos un
            equipo de tres bolivianos que creemos en la transparencia, el anonimato
            y la accesibilidad para todos. Nuestro stack combina tecnologías Web2 y
            Web3 para ofrecer una plataforma segura y confiable.
          </p>
        </div>

        {/* Cards del equipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-5xl">
          {team.map((member, idx) => (
            <Card key={idx} className="shadow-lg">
              <CardHeader className="flex gap-3 items-center">
                <Avatar src={member.avatar} alt={member.name} size="lg" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">{member.name}</p>
                  <p className="text-sm text-ink/70 dark:text-milk/70">
                    {member.role} · {member.location.flag} {member.location.country}
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink/80 dark:text-milk/80">{member.bio}</p>
                <p className="text-xs text-ink/60 dark:text-milk/60 mt-2">
                  <strong>Tecnologías:</strong> {member.techStack.join(", ")}
                </p>
                <p className="text-xs text-ink/60 dark:text-milk/60">
                  <strong>Contribuciones:</strong> {member.contributions.join(", ")}
                </p>
              </CardBody>
              <CardFooter className="flex gap-3">
                {member.socials.twitter && (
                  <Link isExternal href={member.socials.twitter} aria-label="Twitter">
                    <FaXTwitter />
                  </Link>
                )}
                {member.socials.instagram && (
                  <Link isExternal href={member.socials.instagram} aria-label="Instagram">
                    <FaInstagram />
                  </Link>
                )}
                {member.socials.github && (
                  <Link isExternal href={member.socials.github} aria-label="GitHub">
                    <FaGithub />
                  </Link>
                )}
                {member.socials.tiktok && (
                  <Link isExternal href={member.socials.tiktok} aria-label="TikTok">
                    <FaTiktok />
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </DefaultLayout>
  );
}
