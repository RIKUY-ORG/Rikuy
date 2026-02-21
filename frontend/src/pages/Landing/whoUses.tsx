// src/pages/landing/ForWho.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { 
  Users, 
  Building2, 
  User,
  Heart,
  Eye,
  Mic,
  Globe,
  BarChart3,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Importar todos los avatares
import { AguilaAvatar } from "@/components/avatars/aguila";
import { AlconAvatar } from "@/components/avatars/alcon";
import { BufeoAvatar } from "@/components/avatars/bufeo";
import { BuhoAvatar } from "@/components/avatars/buho";
import { CondorAvatar } from "@/components/avatars/condor";
import { GatoAvatar } from "@/components/avatars/gato";
import { HormigueroAvatar } from "@/components/avatars/hormiguero";
import { JaguarAvatar } from "@/components/avatars/jaguar";
import { OsoAvatar } from "@/components/avatars/oso";
import { PumaAvatar } from "@/components/avatars/puma";
import { QuirquinchoAvatar } from "@/components/avatars/quirquincho";
import { RanaAvatar } from "@/components/avatars/rana";
import { SuriAvatar } from "@/components/avatars/suri";
import { VicuñaAvatar } from "@/components/avatars/vicuña";
import { ZorroAvatar } from "@/components/avatars/zorro";

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

// Lista de avatares disponibles
const avatarComponents = [
  AguilaAvatar, AlconAvatar, BufeoAvatar, BuhoAvatar, CondorAvatar, GatoAvatar, HormigueroAvatar, 
  JaguarAvatar, OsoAvatar, PumaAvatar, QuirquinchoAvatar, RanaAvatar, SuriAvatar, VicuñaAvatar, ZorroAvatar
];

// Configuración de las dos categorías principales
const categories = [
  {
    id: "usuario",
    title: "Para ciudadanos",
    subtitle: "Tu voz protegida",
    description: "Denuncia sin miedo. Tu identidad permanece anónima mientras tu evidencia queda registrada para siempre.",
    icon: Users,
    color: "primary",
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    stats: [
      { label: "Denuncias", value: "120+" },
      { label: "Comunidades", value: "15" }
    ],
    features: [
      "Anonimato total",
      "Evidencia inmutable",
      "Sin represalias",
      "Gratuito para siempre"
    ]
  },
  {
    id: "cliente",
    title: "Para organizaciones",
    subtitle: "Datos que transforman",
    description: "Accede a información verificada en tiempo real para tomar decisiones basadas en evidencia.",
    icon: Building2,
    color: "success",
    gradient: "from-green-500 to-emerald-500",
    lightBg: "bg-green-50 dark:bg-green-950/30",
    stats: [
      { label: "Aliados", value: "5" },
      { label: "Reportes", value: "2.5K" }
    ],
    features: [
      "Datos verificados",
      "Exportación PDF/CSV",
      "Alertas en tiempo real",
      "Branding personalizado"
    ]
  }
];

// Actores (usuarios) con avatares aleatorios de tus mascotas
const userActors = [
  {
    name: "El vecino del barrio",
    role: "Ciudadano",
    description: "Que lleva meses reportando el mismo hoyo en la calle y nadie le hace caso.",
    city: "El Alto, La Paz",
    icon: User,
    avatarIndex: 0, // Se asignará aleatoriamente después
    position: { x: 20, y: 30 }
  },
  {
    name: "El testigo de corrupción",
    role: "Denunciante",
    description: "Que vio algo que no debía y no quiere meterse en problemas.",
    city: "Santa Cruz",
    icon: Eye,
    avatarIndex: 1,
    position: { x: 45, y: 60 }
  },
  {
    name: "La comunidad rural",
    role: "Colectivo",
    description: "Que tiene problemas reales pero queda lejos de cualquier institución.",
    city: "Potosí",
    icon: Heart,
    avatarIndex: 2,
    position: { x: 70, y: 20 }
  },
  {
    name: "El joven conectado",
    role: "Activista digital",
    description: "Que confía más en su celular que en una oficina del gobierno.",
    city: "Cochabamba",
    icon: Mic,
    avatarIndex: 3,
    position: { x: 85, y: 75 }
  }
];

// Asignar avatares aleatorios a los actores
const actorsWithAvatars = userActors.map((actor, index) => ({
  ...actor,
  AvatarComponent: avatarComponents[index % avatarComponents.length]
}));

// Datos de ejemplo para gráfica de clientes
const clientData = [
  { month: "Ene", value: 65 },
  { month: "Feb", value: 85 },
  { month: "Mar", value: 120 },
  { month: "Abr", value: 150 },
  { month: "May", value: 180 },
  { month: "Jun", value: 220 }
];

export default function ForWho() {
  const [selectedCategory, setSelectedCategory] = useState<"usuario" | "cliente">("usuario");
  const [expandedMobile, setExpandedMobile] = useState<"usuario" | "cliente" | null>("usuario");
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center mx-auto max-w-7xl px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-purple-50/30 dark:to-purple-950/10"
      aria-label="Para quién está pensado Rikuy"
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-10 md:mb-16">
          <Chip
            color="secondary"
            variant="flat"
            size="lg"
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<Users size={18} className="mr-1" />}
          >
            Dos formas de usar Rikuy
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Para quién está pensado
          </h2>
          
          <p className="text-default-500 max-w-2xl mx-auto mt-4 text-lg">
            Rikuy sirve tanto a ciudadanos que buscan justicia como a organizaciones que necesitan datos confiables
          </p>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-purple-500/30 rounded-full" />
        </div>

        {!isMobile ? (
          /* VERSIÓN DESKTOP - Grid estilo bento */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - 2 cuadrados */}
            <div className="lg:col-span-1 space-y-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card
                    isPressable
                    onPress={() => setSelectedCategory(category.id as "usuario" | "cliente")}
                    className={`
                      border-2 transition-all duration-300
                      ${selectedCategory === category.id 
                        ? `border-${category.color}-500 shadow-lg` 
                        : 'border-default-200 dark:border-default-800 hover:border-default-300'
                      }
                    `}
                    shadow={selectedCategory === category.id ? "lg" : "sm"}
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient}`}>
                          <category.icon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-foreground">
                              {category.title}
                            </h3>
                            {selectedCategory === category.id && (
                              <Chip size="sm" color={category.color as any} variant="flat">
                                Seleccionado
                              </Chip>
                            )}
                          </div>
                          <p className="text-sm text-default-600 dark:text-default-400 mb-3">
                            {category.subtitle}
                          </p>
                          
                          {/* Stats rápidas */}
                          <div className="flex gap-4 mt-3">
                            {category.stats.map((stat, i) => (
                              <div key={i}>
                                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                                <p className="text-xs text-default-500">{stat.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Features list */}
                          <div className="mt-4 space-y-1">
                            {category.features.map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-default-500">
                                <div className={`w-1 h-1 rounded-full bg-${category.color}-500`} />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Columna derecha - Visualización */}
            <div className="lg:col-span-2">
              <Card className="h-full min-h-[500px] border-2 border-default-200 dark:border-default-800">
                <CardBody className="p-6">
                  <AnimatePresence mode="wait">
                    {selectedCategory === "usuario" ? (
                      <ConstelacionView actors={actorsWithAvatars} />
                    ) : (
                      <DashboardView clientData={clientData} />
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          /* VERSIÓN MOBILE - Cards apiladas con acordeón */
          <div className="space-y-6">
            {/* Card de Usuarios */}
            <Card className="border-2 border-primary-500/30 overflow-hidden">
              <CardBody className="p-0">
                {/* Header clickeable */}
                <div 
                  className="p-6 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedMobile(expandedMobile === "usuario" ? null : "usuario")}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Users size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Para ciudadanos</h3>
                      <p className="text-sm text-default-500">Tu voz protegida</p>
                    </div>
                  </div>
                  {expandedMobile === "usuario" ? (
                    <ChevronUp className="text-primary-500" />
                  ) : (
                    <ChevronDown className="text-default-400" />
                  )}
                </div>

                {/* Contenido expandible */}
                <AnimatePresence>
                  {expandedMobile === "usuario" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Divider />
                      <div className="p-6">
                        {/* Stats */}
                        <div className="flex gap-6 mb-4">
                          <div>
                            <p className="text-2xl font-bold text-primary-600">120+</p>
                            <p className="text-xs text-default-500">Denuncias</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-primary-600">15</p>
                            <p className="text-xs text-default-500">Comunidades</p>
                          </div>
                        </div>

                        {/* Versión mobile de la constelación (vertical) */}
                        <div className="space-y-4 mt-4">
                          {actorsWithAvatars.map((actor, index) => {
                            const Icon = actor.icon;
                            return (
                              <motion.div
                                key={actor.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-4 p-3 bg-default-50 dark:bg-default-100/5 rounded-lg"
                              >
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 p-0.5">
                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                                      <actor.AvatarComponent size={32} />
                                    </div>
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-500 border-2 border-background flex items-center justify-center">
                                    <Icon size={10} className="text-white" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{actor.name}</p>
                                  <p className="text-xs text-default-500">{actor.city}</p>
                                  <p className="text-xs text-default-400 mt-1">{actor.description}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {categories[0].features.map((feature, i) => (
                            <div key={i} className="text-xs text-default-500 flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-primary-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardBody>
            </Card>

            {/* Card de Clientes */}
            <Card className="border-2 border-success-500/30 overflow-hidden">
              <CardBody className="p-0">
                {/* Header clickeable */}
                <div 
                  className="p-6 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedMobile(expandedMobile === "cliente" ? null : "cliente")}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Para organizaciones</h3>
                      <p className="text-sm text-default-500">Datos que transforman</p>
                    </div>
                  </div>
                  {expandedMobile === "cliente" ? (
                    <ChevronUp className="text-success-500" />
                  ) : (
                    <ChevronDown className="text-default-400" />
                  )}
                </div>

                {/* Contenido expandible */}
                <AnimatePresence>
                  {expandedMobile === "cliente" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Divider />
                      <div className="p-6">
                        {/* Stats */}
                        <div className="flex gap-6 mb-4">
                          <div>
                            <p className="text-2xl font-bold text-success-600">5</p>
                            <p className="text-xs text-default-500">Aliados</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-success-600">2.5K</p>
                            <p className="text-xs text-default-500">Reportes</p>
                          </div>
                        </div>

                        {/* Gráfica de barras simplificada para mobile */}
                        <div className="h-32 flex items-end justify-around gap-1 mt-4">
                          {clientData.map((item, index) => (
                            <div key={item.month} className="flex flex-col items-center gap-1 flex-1">
                              <motion.div
                                className="w-full bg-gradient-to-t from-success-500 to-emerald-400 rounded-t"
                                initial={{ height: 0 }}
                                animate={{ height: (item.value / 220) * 80 }}
                                transition={{ delay: index * 0.1 }}
                              />
                              <span className="text-[10px] text-default-500">{item.month}</span>
                            </div>
                          ))}
                        </div>

                        {/* Features grid */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <div className="p-3 bg-default-50 dark:bg-default-100/5 rounded-lg">
                            <Download size={16} className="text-success-500 mb-1" />
                            <p className="font-semibold text-xs">Exportación</p>
                            <p className="text-[10px] text-default-500">PDF · CSV</p>
                          </div>
                          <div className="p-3 bg-default-50 dark:bg-default-100/5 rounded-lg">
                            <Filter size={16} className="text-success-500 mb-1" />
                            <p className="font-semibold text-xs">Filtros</p>
                            <p className="text-[10px] text-default-500">Por categoría</p>
                          </div>
                          <div className="p-3 bg-default-50 dark:bg-default-100/5 rounded-lg">
                            <Calendar size={16} className="text-success-500 mb-1" />
                            <p className="font-semibold text-xs">Tiempo real</p>
                            <p className="text-[10px] text-default-500">Alertas</p>
                          </div>
                          <div className="p-3 bg-default-50 dark:bg-default-100/5 rounded-lg">
                            <Globe size={16} className="text-success-500 mb-1" />
                            <p className="font-semibold text-xs">Cobertura</p>
                            <p className="text-[10px] text-default-500">9 deptos</p>
                          </div>
                        </div>

                        {/* Resumen */}
                        <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                          <p className="text-xs text-success-600 dark:text-success-400">Crecimiento anual</p>
                          <p className="text-xl font-bold text-success-600 dark:text-success-400">+85%</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Mensaje de cierre */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
            <Heart size={18} className="text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-default-600 dark:text-default-400">
              <span className="font-semibold text-purple-600 dark:text-purple-400">Rikuy</span> conecta ciudadanos y organizaciones por un mismo objetivo: justicia y transparencia
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Componente de constelación para desktop
function ConstelacionView({ actors }: { actors: any[] }) {
  return (
    <motion.div
      key="usuario"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="text-primary-500" />
        Comunidad de ciudadanos
      </h3>
      
      {/* Mapa de constelación */}
      <div className="relative w-full h-[400px] bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-950/20 rounded-xl overflow-hidden">
        {/* Fondo de mapa de Bolivia */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <path
            d="M200,100 L250,150 L300,120 L350,180 L280,220 L200,200 L150,150 L200,100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-500"
          />
        </svg>

        {/* Líneas de conexión entre actores */}
        <svg className="absolute inset-0 w-full h-full">
          {actors.map((actor, i) => 
            actors.slice(i + 1).map((other, j) => (
              <motion.line
                key={`${i}-${j}`}
                x1={`${actor.position.x}%`}
                y1={`${actor.position.y}%`}
                x2={`${other.position.x}%`}
                y2={`${other.position.y}%`}
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            ))
          )}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Actores con avatares de mascotas */}
        {actors.map((actor, index) => {
          const Icon = actor.icon;
          const AvatarComponent = actor.AvatarComponent;
          return (
            <motion.div
              key={actor.name}
              className="absolute"
              style={{
                left: `${actor.position.x}%`,
                top: `${actor.position.y}%`,
                transform: "translate(-50%, -50%)"
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.15
              }}
              whileHover={{ scale: 1.2, zIndex: 50 }}
            >
              <div className="relative group">
                {/* Avatar de mascota */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 p-0.5 shadow-lg overflow-hidden">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <AvatarComponent size={48} />
                  </div>
                </div>

                {/* Ciudad (tooltip) */}
                <motion.div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  <div className="bg-background rounded-lg shadow-lg p-2 text-center">
                    <p className="text-xs font-medium">{actor.city}</p>
                  </div>
                </motion.div>

                {/* Icono de rol */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 border-2 border-background flex items-center justify-center">
                  <Icon size={12} className="text-white" />
                </div>

                {/* Tooltip con información */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-0 -translate-y-full mt-2 w-48 p-2 bg-background rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="font-semibold text-sm">{actor.name}</p>
                  <p className="text-xs text-default-500 mt-1">{actor.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Partículas */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <p className="text-sm text-default-500 mt-4 text-center">
        {actors.length} ciudadanos conectados en una red de protección mutua
      </p>
    </motion.div>
  );
}

// Componente de dashboard para desktop
function DashboardView({ clientData }: { clientData: any[] }) {
  return (
    <motion.div
      key="cliente"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="text-success-500" />
        Dashboard de insights
      </h3>

      {/* Gráfica de barras animada */}
      <div className="relative w-full h-[300px] bg-gradient-to-b from-success-50/50 to-transparent dark:from-success-950/20 rounded-xl p-6">
        <div className="flex items-end justify-between h-[250px] gap-2">
          {clientData.map((item, index) => (
            <div
              key={item.month}
              className="flex flex-col items-center gap-2 flex-1 group"
            >
              <motion.div
                className="w-full bg-gradient-to-t from-success-500 to-emerald-400 rounded-t-lg cursor-pointer relative"
                initial={{ height: 0 }}
                animate={{ height: (item.value / 220) * 200 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                  delay: index * 0.1
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Chip size="sm" color="success" variant="flat">
                    {item.value} reportes
                  </Chip>
                </div>
              </motion.div>
              <span className="text-xs text-default-500">{item.month}</span>
            </div>
          ))}
        </div>

        {/* Línea de tendencia */}
        <motion.svg
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.path
            d={`M ${clientData.map((d, i) => {
              const x = (i + 0.5) * (100 / clientData.length);
              const y = 100 - (d.value / 220) * 80;
              return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}`}
            stroke="url(#trendGradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="5,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
          <defs>
            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      {/* Features adicionales */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Download size={16} className="text-success-500" />
            <span className="font-semibold text-sm">Exportación</span>
          </div>
          <p className="text-xs text-default-500">PDF · CSV · Excel</p>
        </div>
        <div className="p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-success-500" />
            <span className="font-semibold text-sm">Filtros</span>
          </div>
          <p className="text-xs text-default-500">Por ciudad · categoría · fecha</p>
        </div>
        <div className="p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-success-500" />
            <span className="font-semibold text-sm">Tiempo real</span>
          </div>
          <p className="text-xs text-default-500">Alertas instantáneas</p>
        </div>
        <div className="p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-success-500" />
            <span className="font-semibold text-sm">Cobertura</span>
          </div>
          <p className="text-xs text-default-500">9 departamentos</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-success-600 dark:text-success-400">Crecimiento anual</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">+85%</p>
          </div>
          <div>
            <p className="text-xs text-success-600 dark:text-success-400">Reportes procesados</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">2,547</p>
          </div>
          <div>
            <p className="text-xs text-success-600 dark:text-success-400">Organizaciones</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">5</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}