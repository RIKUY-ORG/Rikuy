// src/pages/landing/MetricsSummary.tsx
import { useState, useEffect, useRef } from "react";
import { motion, useInView, Variants } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Users, FileText, ArrowRight } from "lucide-react";

// Importar avatares
import { BufeoAvatar } from "@/components/avatars/bufeo";
import { BuhoAvatar } from "@/components/avatars/buho";
import { CondorAvatar } from "@/components/avatars/condor";
import { HormigueroAvatar } from "@/components/avatars/hormiguero";
import { JaguarAvatar } from "@/components/avatars/jaguar";
import { QuirquinchoAvatar } from "@/components/avatars/quirquincho";
import { RanaAvatar } from "@/components/avatars/rana";
import { SuriAvatar } from "@/components/avatars/suri";
import { VicuñaAvatar } from "@/components/avatars/vicuña";

// Lista de avatares para departamentos
const departamentoAvatars = [
  { nombre: "La Paz", avatar: CondorAvatar },
  { nombre: "Santa Cruz", avatar: JaguarAvatar },
  { nombre: "Cochabamba", avatar: BuhoAvatar },
  { nombre: "Oruro", avatar: QuirquinchoAvatar },
  { nombre: "Potosí", avatar: VicuñaAvatar },
  { nombre: "Tarija", avatar: SuriAvatar },
  { nombre: "Beni", avatar: BufeoAvatar },
  { nombre: "Pando", avatar: HormigueroAvatar },
  { nombre: "Chuquisaca", avatar: RanaAvatar },
];

// Hook personalizado para contador animado
function useCounter(endValue: string, duration: number = 2000) {
  const numericValue = parseInt(endValue.replace(/[^0-9]/g, ""));
  const hasPlus = endValue.includes("+");
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * numericValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, numericValue, duration]);

  return { ref, count, hasPlus, isInView };
}

// Componente de métrica animada
function AnimatedMetric({ label, value }: { label: string; value: string }) {
  const { ref, count, hasPlus, isInView } = useCounter(value);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="text-center w-full"
    >
      <p className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400">
        <span ref={ref}>{count}</span>
        {hasPlus && <span>+</span>}
      </p>
      <p className="mt-2 text-sm md:text-base text-default-600 dark:text-default-400">
        {label}
      </p>
    </motion.div>
  );
}

export function MetricsSummary() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const metrics = [
    { 
      label: "Denuncias registradas", 
      value: "120+", 
      icon: FileText,
      to: "/denuncias",
      color: "primary"
    },
    { 
      label: "Comunidades activas", 
      value: "15", 
      icon: Users,
      to: "/comunidades",
      color: "secondary"
    },
    { 
      label: "Aliados verificados", 
      value: "5", 
      icon: TrendingUp,
      to: "/aliados",
      color: "success"
    },
  ];

  // Variantes de animación
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
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

  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-green-50/30 dark:to-green-950/10"
      aria-label="Indicadores de impacto de Rikuy"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        
        {/* Líneas de tendencia */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <pattern id="trend-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 30 L10 20 L20 25 L30 10 L40 15" stroke="currentColor" strokeWidth="1" fill="none" className="text-green-500" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#trend-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Encabezado */}
        <motion.div 
          className="text-center mb-10 md:mb-16"
          variants={itemVariants}
        >
          <Chip
            color="success"
            variant="flat"
            size="lg"
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<TrendingUp size={18} className="mr-1" />}
          >
            Crecimiento constante
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Nuestro impacto
          </h2>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-green-500/30 rounded-full" />
        </motion.div>

        {/* Grid de métricas - CORREGIDO para mobile */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            
            return (
              <motion.div
                key={metric.label}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                className="w-full"
              >
                <Link 
                  to={metric.to} 
                  className="block w-full"
                >
                  <Card 
                    className="group border border-green-500/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer w-full"
                    shadow="md"
                  >
                    <CardBody className="p-6 md:p-8 text-center">
                      {/* Icono decorativo */}
                      <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors duration-300">
                          <Icon 
                            size={28} 
                            className="text-green-600 dark:text-green-400"
                          />
                        </div>
                      </div>
                      
                      {/* Métrica animada */}
                      <AnimatedMetric label={metric.label} value={metric.value} />
                      
                      {/* Indicador de enlace */}
                      <div className="flex items-center justify-center gap-1 mt-4 text-xs text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Ver detalles</span>
                        <ArrowRight size={12} />
                      </div>
                      
                      {/* Barra de progreso decorativa */}
                      <motion.div 
                        className="w-16 h-1 bg-green-500/30 rounded-full mx-auto mt-4"
                        initial={{ width: "0%" }}
                        animate={isInView ? { width: "100%" } : {}}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </CardBody>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mapa interactivo CTA */}
        <motion.div 
          className="flex flex-col items-center mt-16"
          variants={itemVariants}
        >
          {/* Badge de ubicaciones con AVATARES */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              {departamentoAvatars.slice(0, 5).map((depto, i) => {
                const AvatarComponent = depto.avatar;
                return (
                  <motion.div
                    key={depto.nombre}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="relative group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <AvatarComponent size={24} />
                      </div>
                    </div>
                    {/* Tooltip con nombre del departamento */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <Chip size="sm" variant="flat" color="success">
                        {depto.nombre}
                      </Chip>
                    </div>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 1.3 }}
                className="flex items-center"
              >
                <Chip color="success" variant="flat" size="lg">
                  +4 departamentos
                </Chip>
              </motion.div>
            </div>
            <span className="text-sm text-default-500">
              Presentes en 9 departamentos de Bolivia
            </span>
          </div>

          {/* Botón principal */}
          <Button
            as={Link}
            to="/mapa"
            color="success"
            size="lg"
            radius="full"
            endContent={<MapPin size={18} />}
            className="font-semibold px-8 shadow-lg hover:shadow-xl transition-all"
          >
            Ver mapa interactivo
          </Button>

          {/* Texto secundario */}
          <p className="text-xs text-default-400 mt-4">
            Explora las denuncias en tiempo real por región
          </p>
        </motion.div>

        {/* Estadísticas adicionales */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          <Link to="/departamentos" className="text-center group">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">9</p>
            <p className="text-xs text-default-500">Departamentos</p>
          </Link>
          <Link to="/disponibilidad" className="text-center group">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">24/7</p>
            <p className="text-xs text-default-500">Disponible</p>
          </Link>
          <Link to="/anonimato" className="text-center group">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">100%</p>
            <p className="text-xs text-default-500">Anónimo</p>
          </Link>
          <Link to="/verificacion" className="text-center group">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">✓</p>
            <p className="text-xs text-default-500">Verificado</p>
          </Link>
        </motion.div>

        {/* Call to action adicional para aliados */}
        <motion.div 
          className="text-center mt-8"
          variants={itemVariants}
        >
          <Link
            to="/aliados"
            className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Conoce a nuestros aliados verificados
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}