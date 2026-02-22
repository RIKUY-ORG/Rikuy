// src/pages/landing/Hero.tsx
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import { RikuyLogo } from "@/components/rikuyLogo";
import { HeroConfig } from "@/config/landing/types";
import { usePrivy } from "@privy-io/react-auth";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { DenunciarButton } from "@/components/denunciarButton";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      setMatches(media.matches);
      
      const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
      media.addEventListener('change', listener);
      
      return () => media.removeEventListener('change', listener);
    }
  }, [query]);

  return matches;
}

export function Hero({ config }: { config: HeroConfig }) {
  const { authenticated, login } = usePrivy();
  const { isVerified, isLoading } = useIdentityStatus();
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 md:py-16 scroll-snap-align-start overflow-hidden bg-gradient-to-b from-background via-background to-green-50/30 dark:to-green-950/10"
      aria-label="Introducción a RIKUY"
    >
      {/* Chip de lanzamiento */}
      <Chip
        as="header"
        color="success"
        variant="flat"
        size={isMobile ? "sm" : "md"}
        classNames={{
          base: "mb-4 md:mb-6 max-w-[90vw] sm:max-w-none h-auto py-1.5 sm:py-1 z-10",
          content: "font-medium whitespace-normal text-center"
        }}
        startContent={<span className="text-base mr-1 shrink-0 self-start mt-0.5" role="img" aria-label="cohete">🚀</span>}
      >
        <span className="block sm:inline leading-tight">
          Oferta de lanzamiento: 3 meses gratis para primeros aliados
        </span>
      </Chip>

      {/* Contenedor principal */}
      <article className="max-w-4xl text-center w-full relative z-10">
        {/* Logo */}
        <header className="mb-4 md:mb-6">
          <RikuyLogo
            size={isMobile ? 140 : 180}
            className="mx-auto"
            aria-label="Logo de RIKUY - Cóndor vigilante"
          />
        </header>

        {/* Título principal con badge BETA al borde de la Y */}
        <hgroup aria-label="Propuesta de valor de RIKUY" className="space-y-4 md:space-y-6">
          {/* Contenedor con el ancho exacto del texto */}
          <div className="relative inline-flex">
            {/* Texto RIKUY */}
            <h1 className="text-3xl sm:text-3xl md:text-5xl font-bold tracking-tight">
              <span className="text-green-600 dark:text-green-400">RIKUY</span>
            </h1>

            {/* Badge BETA posicionado absolutamente respecto al contenedor */}
            <Badge
              content="BETA"
              color="warning"
              placement="top-right"
              size={isMobile ? "sm" : "md"}
              classNames={{
                base: "absolute -top-2 -right-3 md:-top-3 md:-right-4",
                badge: "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-none font-black tracking-tighter text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2 md:py-1"
              }}
            >
              {/* El Badge necesita un hijo, pero como ya tenemos el texto arriba, 
                  usamos un span vacío que no ocupa espacio */}
              <span className="sr-only">RIKUY con badge BETA</span>
            </Badge>
          </div>
          
          {/* Subtítulo */}
          <div className="pt-4 md:pt-6">
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground">
              Tu voz protegida, tu denuncia imborrable
            </p>
          </div>

          <Divider className="w-12 h-0.5 mx-auto my-2 md:my-3 bg-green-500/30" />

          <p className="text-base sm:text-lg md:text-xl text-default-600 dark:text-default-400 font-normal max-w-2xl mx-auto px-2">
            {config.subtitle || "Datos ciudadanos verificados para organizaciones, medios e instituciones"}
          </p>
        </hgroup>

        {/* Estadísticas */}
        <div className="mt-8 md:mt-10">
          <h2 className="sr-only">Estadísticas de impacto de RIKUY</h2>
          <ul className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs sm:text-sm">
            <li className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-default-600">
                <strong className="text-foreground">120+</strong> denuncias ciudadanas
              </span>
            </li>
            
            <li className="hidden sm:block" aria-hidden="true">
              <Divider orientation="vertical" className="h-4 w-px bg-default-300" />
            </li>
            
            <li>
              <span className="text-default-600">
                <strong className="text-foreground">15</strong> comunidades activas
              </span>
            </li>
            
            <li className="hidden sm:block" aria-hidden="true">
              <Divider orientation="vertical" className="h-4 w-px bg-default-300" />
            </li>
            
            <li>
              <span className="text-default-600">
                <strong className="text-foreground">5</strong> aliados verificados
              </span>
            </li>
          </ul>
        </div>
      </article>

      {/* Navegación de acciones principales */}
      <nav className="w-full max-w-2xl mx-auto mt-10 md:mt-12 px-4 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Acción para ciudadanos */}
          <div className="w-full sm:w-1/2 text-center">
            <DenunciarButton
              authenticated={authenticated}
              isVerified={isVerified}
              isLoading={isLoading}
              login={login}
              className="w-full px-6 py-3 text-base"
            />
            <p className="text-xs text-default-400 mt-1.5" aria-label="Para">
              Para ciudadanos
            </p>
          </div>

          {/* Acción para profesionales */}
          <div className="w-full sm:w-1/2 text-center">
            <Button
              as={Link}
              to={config.secondaryCta?.href || "/profesionales"}
              variant="bordered"
              radius="full"
              size="lg"
              className="w-full px-6 py-3 text-base border-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
              aria-label="Acceso para profesionales: ONGs, Prensa, Instituciones"
            >
              Acceso para profesionales
            </Button>
            <p className="text-xs text-default-400 mt-1.5" aria-hidden="true">
              ONGs · Prensa · Instituciones
            </p>
          </div>
        </div>
      </nav>

      {/* Misión */}
      {config.missionNote && (
        <footer className="max-w-2xl text-center mt-10 md:mt-12 px-4">
          <figure>
            <blockquote>
              <p className="text-xs sm:text-sm text-default-500 italic">
                "{config.missionNote}"
              </p>
            </blockquote>
            <figcaption className="sr-only">Misión de RIKUY</figcaption>
          </figure>
        </footer>
      )}

      {/* Indicador de scroll */}
      {!isMobile && (
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          aria-label="Indicador de scroll - desplázate hacia abajo para más información"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-5 h-8 border-2 border-green-500/30 rounded-full flex justify-center">
              <div className="w-1 h-2 bg-green-500 rounded-full mt-2 animate-pulse" />
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}