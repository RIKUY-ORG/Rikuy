// src/pages/landing/Available.tsx
import { useState, useEffect, useRef } from "react";
import { motion, useInView, Variants } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Globe, Smartphone, Sparkles, Download } from "lucide-react";

// Font Awesome para iconos de tiendas
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGooglePlay, faAppStore, IconDefinition } from "@fortawesome/free-brands-svg-icons";

// Hook para detectar mobile
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

// Hook personalizado para detectar si la app está siendo usada como PWA instalada
function usePWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si la app se ejecuta en modo standalone (instalada como PWA)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);
  }, []);

  return isStandalone;
}

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

// Tipos para las plataformas
type Platform = {
  name: string;
  store: "pwa" | "android" | "ios";
  url: string;
  available: boolean;
  description: string;
  badge: string;
  color: "primary" | "success" | "secondary";
  iconType: "lucide" | "fontawesome";
  lucideIcon?: typeof Globe;
  fontAwesomeIcon?: IconDefinition;
};

export function Available() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isPWAInstalled = usePWAStatus();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Configuración de las plataformas
  const platforms: Platform[] = [
    {
      name: "PWA (Web App)",
      store: "pwa",
      url: "/",
      available: true,
      description: "Instálala como una app nativa desde tu navegador",
      badge: "Disponible ahora",
      color: "primary",
      iconType: "lucide",
      lucideIcon: Globe
    },
    {
      name: "Google Play",
      store: "android",
      url: "https://play.google.com/store/apps/details?id=com.rikuy.app",
      available: false,
      description: "Próximamente en Android",
      badge: "Próximamente",
      color: "success",
      iconType: "fontawesome",
      fontAwesomeIcon: faGooglePlay
    },
    {
      name: "App Store",
      store: "ios",
      url: "https://apps.apple.com/app/rikuy/id123456789",
      available: false,
      description: "Próximamente en iOS",
      badge: "Próximamente",
      color: "secondary",
      iconType: "fontawesome",
      fontAwesomeIcon: faAppStore
    }
  ];

  // Función para manejar el clic en PWA
  const handlePWAInstall = async () => {
    if ('beforeinstallprompt' in window) {
      // Para navegadores que soportan instalación PWA
      const promptEvent = new Event('beforeinstallprompt') as any;
      if (promptEvent) {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA instalada correctamente');
        }
      }
    } else {
      // Fallback: abrir instrucciones de instalación
      window.open('/como-instalar-pwa', '_blank');
    }
  };

  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-purple-50/30 dark:to-purple-950/10"
      aria-label="Plataformas disponibles"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl" />
        
        {/* Patrón de dispositivos */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <pattern id="device-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect x="15" y="10" width="30" height="40" rx="6" stroke="currentColor" strokeWidth="1" fill="none" className="text-purple-500" />
            <circle cx="30" cy="55" r="3" fill="currentColor" className="text-purple-500" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#device-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Encabezado */}
        <motion.div 
          className="text-center mb-10 md:mb-16"
          variants={itemVariants}
        >
          <Chip
            color="secondary"
            variant="flat"
            size={isMobile ? "md" : "lg"}
            classNames={{
              base: "mb-4 max-w-[90vw] mx-auto h-auto py-2 px-3",
              content: "font-medium whitespace-normal text-center"
            }}
            startContent={<Smartphone size={18} className="mr-1 flex-shrink-0" />}
          >
            <span className="block sm:inline">
              Disponible en tus plataformas favoritas
            </span>
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Lleva Rikuy contigo
          </h2>
          
          <p className="text-default-500 max-w-2xl mx-auto mt-4 text-lg">
            Elige la plataforma que prefieras y denuncia de forma segura desde cualquier lugar
          </p>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-purple-500/30 rounded-full" />
        </motion.div>

        {/* Grid de plataformas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
        >
          {platforms.map((platform) => {
            return (
              <motion.div
                key={platform.name}
                variants={itemVariants}
                whileHover={platform.available ? { 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                } : {}}
                className="h-full"
              >
                <Tooltip
                  content={platform.available ? "Haz clic para instalar" : "Próximamente disponible"}
                  placement="top"
                  color={platform.available ? "primary" : "default"}
                >
                  <Card 
                    className={`h-full group border ${
                      platform.available 
                        ? 'border-purple-500/30 hover:border-purple-500/60 cursor-pointer' 
                        : 'border-default-200 dark:border-default-800 opacity-70'
                    } transition-all duration-300`}
                    shadow="md"
                    isPressable={platform.available}
                    onPress={platform.available ? (platform.store === 'pwa' ? handlePWAInstall : () => window.open(platform.url, '_blank')) : undefined}
                  >
                    <CardBody className="p-8 text-center">
                      {/* Badge de estado */}
                      <div className="flex justify-center mb-4">
                        <Chip
                          color={platform.color}
                          variant="flat"
                          size="sm"
                          classNames={{
                            base: "mb-2",
                            content: "font-medium text-xs"
                          }}
                          startContent={<Sparkles size={12} className="mr-1" />}
                        >
                          {platform.badge}
                        </Chip>
                      </div>

                      {/* Icono de la plataforma */}
                      <div className="flex justify-center mb-6">
                        <div className={`p-5 rounded-2xl ${
                          platform.available 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-default-300 dark:bg-default-700'
                        }`}>
                          {platform.iconType === "lucide" && platform.lucideIcon && (
                            <platform.lucideIcon 
                              size={48} 
                              className="text-white"
                            />
                          )}
                          {platform.iconType === "fontawesome" && platform.fontAwesomeIcon && (
                            <FontAwesomeIcon 
                              icon={platform.fontAwesomeIcon} 
                              className="text-white"
                              style={{ width: '48px', height: '48px' }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Nombre de la plataforma */}
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {platform.name}
                      </h3>
                      
                      {/* Descripción */}
                      <p className="text-default-600 dark:text-default-400 text-sm mb-4">
                        {platform.description}
                      </p>
                      
                      {/* Indicador de PWA instalada (si aplica) */}
                      {platform.store === 'pwa' && isPWAInstalled && (
                        <div className="mt-4 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Ya tienes Rikuy instalado
                          </p>
                        </div>
                      )}
                      
                      {/* Botón de acción (solo para PWA disponible) */}
                      {platform.available && platform.store === 'pwa' && !isPWAInstalled && (
                        <div className="mt-6">
                          <Button
                            color="primary"
                            size="sm"
                            radius="full"
                            variant="flat"
                            className="font-medium"
                            onPress={handlePWAInstall}
                          >
                            Instalar ahora
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Tooltip>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mensaje de instalación PWA */}
        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-full max-w-[90vw] mx-auto">
            <Globe size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <p className="text-sm text-default-600 dark:text-default-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">¿Sabías que?</span> Puedes instalar Rikuy como una app nativa desde tu navegador
            </p>
          </div>
        </motion.div>

        {/* Instrucciones rápidas para PWA - MEJORADAS */}
        <motion.div 
          className="flex flex-col items-center gap-6 mt-12 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
              <p className="text-3xl mb-2">1️⃣</p>
              <p className="text-xs text-default-500">Abre el menú del navegador</p>
            </div>
            <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
              <p className="text-3xl mb-2">2️⃣</p>
              <p className="text-xs text-default-500">Selecciona "Instalar app"</p>
            </div>
            <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
              <p className="text-3xl mb-2">3️⃣</p>
              <p className="text-xs text-default-500">¡Listo! Úsala como app nativa</p>
            </div>
          </div>

          {/* Mensaje adicional */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Download size={16} className="text-purple-600 dark:text-purple-400" />
              <p className="text-sm text-purple-600 dark:text-purple-400">
                <span className="font-medium">O presiona el botón "Instalar ahora"</span> — ¡todo es fácil con Rikuy!
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}