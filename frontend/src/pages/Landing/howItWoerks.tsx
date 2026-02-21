// src/pages/landing/HowItWorks.tsx
import { useRef } from "react";
import { motion, useInView, Variants } from "motion/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { 
  Camera,
  Shield,
  Users,
  Bell,
  Award,
  ChevronRight
} from "lucide-react";

import { HowItWorksConfig } from "@/config/landing/types";

// Mapeo de iconos para cada paso
const stepIcons = [
  Camera,    // Paso 1: Captura
  Shield,    // Paso 2: Anonimiza
  Users,     // Paso 3: Verificación comunitaria
  Bell,      // Paso 4: Activamos acciones
  Award,     // Paso 5: Recompensa
];

// Colores para cada paso (gradientes)
const stepColors = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
  "from-yellow-500 to-amber-500",
];

// Variantes de animación tipadas correctamente
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
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

export function HowItWorks({ config }: { config: HowItWorksConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center mx-auto max-w-7xl px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-primary-50/30 dark:to-primary-950/10"
      aria-label="Cómo funciona Rikuy"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary-500/5 rounded-full blur-3xl" />
        
        {/* Líneas decorativas */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 L40 20 M20 0 L20 40" stroke="currentColor" strokeWidth="1" className="text-primary-500" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern)" />
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
            startContent={<span className="mr-1">📱</span>}
          >
            Proceso simple y seguro
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {config.headline}
          </h2>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-primary-500/30 rounded-full" />
        </motion.div>

        {/* Grid de pasos */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={containerVariants}
        >
          {config.steps.map((step, index) => {
            const IconComponent = stepIcons[index % stepIcons.length];
            const gradientColor = stepColors[index % stepColors.length];
            
            return (
              <motion.div
                key={step.title}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                className="h-full"
              >
                <Card 
                  className="h-full group relative overflow-hidden"
                  shadow="md"
                  isPressable
                  onPress={() => {}}
                >
                  {/* Número de paso decorativo */}
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-500" />
                  
                  <CardHeader className="flex flex-col items-start gap-3 pb-0 pt-6 px-6">
                    {/* Indicador de paso con gradiente */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} p-0.5`}>
                      <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                        <IconComponent size={24} className="text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    
                    {/* Número y título */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-bold">
                        {index + 1}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                  </CardHeader>
                  
                  <CardBody className="px-6 pb-6">
                    <p className="text-default-600 dark:text-default-400 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Línea de tiempo visual (solo en desktop) */}
                    {index < config.steps.length - 1 && (
                      <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                        <ChevronRight 
                          size={24} 
                          className="text-primary-300 dark:text-primary-700"
                        />
                      </div>
                    )}
                  </CardBody>
                  
                  {/* Barra de progreso inferior */}
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Resumen visual del flujo (solo desktop) */}
        <motion.div 
          className="hidden lg:flex items-center justify-center gap-2 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {config.steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-500' : 'bg-default-300'}`} />
              {index < config.steps.length - 1 && (
                <div className="w-12 h-0.5 bg-default-300 mx-1" />
              )}
            </div>
          ))}
          <span className="text-xs text-default-400 ml-2">5 pasos simples</span>
        </motion.div>

        {/* Mensaje de confianza */}
        <motion.div 
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Chip
            color="secondary"
            variant="flat"
            size="sm"
            classNames={{
              base: "border-none",
              content: "text-xs"
            }}
          >
            🕒 Todo el proceso toma menos de 5 minutos
          </Chip>
          
          <p className="text-default-500 max-w-2xl mx-auto text-sm mt-4">
            Sin registros complicados, sin esperas. Solo tú, tu evidencia y la protección de Rikuy.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}