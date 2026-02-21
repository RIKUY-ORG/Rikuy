// src/pages/landing/Problem.tsx
import { useState, useEffect, useRef } from "react";
import { motion, useInView, Variants } from "motion/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { ProblemConfig } from "@/config/landing/types";

// Hook personalizado de media query (sin dependencias externas)
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

// Iconos para cada problema
const problemIcons = {
  "Miedo a represalias": "😨",
  "Evidencia que desaparece": "🗑️",
  "Comunidades sin voz": "🔇",
  default: "⚠️"
};

// Variantes de animación tipadas correctamente
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const titleVariants: Variants = {
  hidden: { y: -30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export function Problem({ config }: { config: ProblemConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLLIElement | null)[]>([]);
  
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center mx-auto max-w-7xl px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden"
      aria-label="Problema que aborda Rikuy"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={!prefersReducedMotion ? containerVariants : undefined}
    >
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Encabezado con chip contextual */}
        <motion.div 
          className="text-center mb-10 md:mb-16"
          variants={!prefersReducedMotion ? titleVariants : undefined}
        >
          <Chip
            color="danger"
            variant="flat"
            size={isMobile ? "sm" : "md"}
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<span className="mr-1">⚡</span>}
          >
            La realidad que enfrentamos
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {config.headline}
          </h2>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-danger/30 rounded-full" />
        </motion.div>

        {/* Grid de problemas */}
        <motion.ul 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          variants={!prefersReducedMotion ? containerVariants : undefined}
        >
          {config.items.map((item, index) => {
            const icon = problemIcons[item.title as keyof typeof problemIcons] || problemIcons.default;
            
            return (
              <motion.li
                key={item.title}
                ref={(el) => { cardsRef.current[index] = el; }}
                variants={!prefersReducedMotion ? itemVariants : undefined}
                whileHover={!isMobile && !prefersReducedMotion ? { 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                } : undefined}
                className="h-full"
              >
                <Card 
                  className="h-full bg-gradient-to-b from-background to-danger-50/20 dark:to-danger-950/20 border-none shadow-lg hover:shadow-xl transition-shadow"
                  isPressable={!isMobile}
                  onPress={() => {}}
                >
                  <CardHeader className="flex flex-col items-start gap-2 pb-0 pt-6 px-6">
                    {/* Icono grande y emotivo */}
                    {!prefersReducedMotion ? (
                      <motion.div
                        className="text-5xl md:text-6xl mb-2"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      >
                        {icon}
                      </motion.div>
                    ) : (
                      <div className="text-5xl md:text-6xl mb-2">{icon}</div>
                    )}
                    
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {item.title}
                    </h3>
                  </CardHeader>
                  
                  <CardBody className="px-6 pb-6">
                    <p className="text-default-600 dark:text-default-400 leading-relaxed">
                      {item.description}
                    </p>
                    
                    {/* Indicador visual de gravedad */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-danger/50" />
                      <span className="text-xs text-danger/70 font-medium">
                        Problema crítico
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Mensaje de llamado a la acción sutil */}
        {!prefersReducedMotion ? (
          <motion.div 
            className="text-center mt-12 md:mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base">
              Estos problemas no son nuevos, pero hasta ahora no tenían solución. 
              <span className="block mt-2 font-medium text-danger">Rikuy está aquí para cambiarlo.</span>
            </p>
          </motion.div>
        ) : (
          <div className="text-center mt-12 md:mt-16">
            <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base">
              Estos problemas no son nuevos, pero hasta ahora no tenían solución. 
              <span className="block mt-2 font-medium text-danger">Rikuy está aquí para cambiarlo.</span>
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}