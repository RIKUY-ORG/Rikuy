// src/pages/landing/Trust.tsx
import { useRef } from "react";
import { motion, useInView, Variants } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { 
  ShieldCheck,
  Lock,
  Eye,
  Globe,
  Clock,
  Award,
  CheckCircle,
  Users,
  FileCheck,
  Sparkles
} from "lucide-react";

import { TrustConfig } from "@/config/landing/types";

// Mapeo de iconos para cada nota de confianza
const trustIcons = [
  ShieldCheck,  // Seguridad
  Lock,         // Privacidad
  Eye,          // Transparencia
  Globe,        // Accesibilidad
  Clock,        // Permanencia
  Award,        // Verificación
  CheckCircle,  // Garantía
  Users,        // Comunidad
  FileCheck,    // Validez legal
  Sparkles,     // Innovación
];

// Variantes de animación
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
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

export function Trust({ config }: { config: TrustConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center mx-auto max-w-7xl px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-blue-50/30 dark:to-blue-950/10"
      aria-label="Confianza y transparencia en Rikuy"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Fondo decorativo con patrones de confianza */}
      <div className="absolute inset-0 -z-10">
        {/* Círculos decorativos */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        
        {/* Patrón de escudos (sutil) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
          <pattern id="shield-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 5 L50 15 L50 35 L30 45 L10 35 L10 15 L30 5" stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-500" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#shield-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Encabezado */}
        <motion.div 
          className="text-center mb-10 md:mb-16"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={titleVariants}
        >
          <Chip
            color="primary"
            variant="flat"
            size="lg"
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<ShieldCheck size={18} className="mr-1" />}
          >
            Confianza garantizada
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {config.headline}
          </h2>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-blue-500/30 rounded-full" />
        </motion.div>

        {/* Grid de notas de confianza */}
        <motion.ul 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {config.notes.map((note, index) => {
            const IconComponent = trustIcons[index % trustIcons.length];
            
            return (
              <motion.li
                key={note}
                variants={itemVariants}
                whileHover={{ 
                  y: -4,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                className="h-full"
              >
                <Card 
                  className="h-full group border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                  shadow="sm"
                  isPressable
                  onPress={() => {}}
                >
                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icono con efecto de brillo */}
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:bg-blue-500/30 transition-all duration-300" />
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                            <IconComponent size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Texto de la nota */}
                      <div className="flex-1">
                        <p className="text-default-700 dark:text-default-300 leading-relaxed">
                          {note}
                        </p>
                        
                        {/* Indicador de verificación (opcional) */}
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Garantizado
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Badges de garantías adicionales */}
        {config.badges && config.badges.length > 0 && (
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-3 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {config.badges.map((badge, index) => (
              <Badge
                key={badge.label}
                content="✓"
                color="success"
                placement="top-right"
                size="sm"
                classNames={{
                  badge: "bg-green-500 text-white text-[10px]"
                }}
              >
                <Chip
                  color="primary"
                  variant="flat"
                  size="lg"
                  classNames={{
                    base: "py-5 px-4 border border-blue-500/20",
                    content: "font-medium text-sm"
                  }}
                  startContent={index === 0 ? <ShieldCheck size={16} className="mr-1" /> : <Lock size={16} className="mr-1" />}
                >
                  {badge.label}
                </Chip>
              </Badge>
            ))}
          </motion.div>
        )}

        {/* Sello de confianza */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
            <ShieldCheck size={24} className="text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">
                Tus datos están seguros con nosotros
              </p>
              <p className="text-xs text-default-500">
                Tecnología blockchain · Pruebas ZK · Anonimato garantizado
              </p>
            </div>
          </div>
        </motion.div>

        {/* Métricas de confianza (opcional) */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</p>
            <p className="text-xs text-default-500">Anonimato</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">∞</p>
            <p className="text-xs text-default-500">Permanente</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</p>
            <p className="text-xs text-default-500">Disponible</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">✓</p>
            <p className="text-xs text-default-500">Verificado</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}