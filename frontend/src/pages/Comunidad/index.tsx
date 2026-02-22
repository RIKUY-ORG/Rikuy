// src/pages/comunidades/index.tsx
import { motion, Variants } from "motion/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { 
  Users, 
  Shield, 
  Eye, 
  MapPin,
  Award,
  Globe,
  ArrowRight,
  CheckCircle,
  Vote,
  FileCheck,
  Star,
} from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

// Importar avatares de comunidades
import { CondorAvatar } from "@/components/avatars/condor";
import { JaguarAvatar } from "@/components/avatars/jaguar";
import { BuhoAvatar } from "@/components/avatars/buho";
import { RanaAvatar } from "@/components/avatars/rana";
import { SuriAvatar } from "@/components/avatars/suri";

// Datos de comunidades activas
const activeCommunities = [
  {
    id: 1,
    name: "El Alto",
    department: "La Paz",
    members: 234,
    verifiedReports: 45,
    avatar: CondorAvatar,
    color: "primary",
    description: "Comunidad vigilante del altiplano",
    achievements: ["100% verificación", "Alta participación"],
    active: true
  },
  {
    id: 2,
    name: "Plan 3000",
    department: "Santa Cruz",
    members: 189,
    verifiedReports: 32,
    avatar: JaguarAvatar,
    color: "success",
    description: "Jóvenes organizados por su barrio",
    achievements: ["Rápida respuesta", "Cobertura nocturna"],
    active: true
  },
  {
    id: 3,
    name: "Cerro Verde",
    department: "Potosí",
    members: 156,
    verifiedReports: 28,
    avatar: SuriAvatar,
    color: "warning",
    description: "Defensores de la comunidad minera",
    achievements: ["Denuncias laborales", "Protección ambiental"],
    active: true
  },
  {
    id: 4,
    name: "Tiquipaya",
    department: "Cochabamba",
    members: 203,
    verifiedReports: 37,
    avatar: BuhoAvatar,
    color: "secondary",
    description: "Vecinos organizados por el medio ambiente",
    achievements: ["Guardianes del río", "Reforestación"],
    active: true
  },
  {
    id: 5,
    name: "Riberalta",
    department: "Beni",
    members: 112,
    verifiedReports: 19,
    avatar: RanaAvatar,
    color: "primary",
    description: "Comunidad amazónica en acción",
    achievements: ["Protección de la selva", "Denuncias ambientales"],
    active: true
  },
  {
    id: 6,
    name: "Villa 1ro de Mayo",
    department: "Santa Cruz",
    members: 167,
    verifiedReports: 24,
    avatar: JaguarAvatar,
    color: "success",
    description: "Vecinos unidos por la seguridad",
    achievements: ["Patrullaje ciudadano", "Alertas tempranas"],
    active: false
  }
];

// Beneficios de ser parte de una comunidad
const benefits = [
  {
    icon: Shield,
    title: "Protección colectiva",
    description: "Entre todos nos cuidamos. Una red de apoyo mutuo que amplifica tu voz y protege tu identidad.",
    color: "primary"
  },
  {
    icon: Eye,
    title: "Verificación ciudadana",
    description: "Cada denuncia es revisada por la comunidad, garantizando que solo la información veraz llegue a los aliados.",
    color: "secondary"
  },
  {
    icon: Vote,
    title: "Gobernanza participativa",
    description: "Las decisiones importantes se toman entre todos. Cada miembro tiene voz y voto en el futuro de la comunidad.",
    color: "success"
  },
  {
    icon: Award,
    title: "Reconocimiento",
    description: "Los miembros más activos ganan reputación y pueden acceder a beneficios exclusivos dentro de la plataforma.",
    color: "warning"
  }
];

// Roadmap de evolución
const roadmap = [
  {
    phase: "Fase 1 - Actual",
    title: "Comunidades de verificación",
    description: "Los vecinos validan denuncias de forma anónima para evitar fraudes. Cada comunidad tiene su propio espacio.",
    icon: CheckCircle,
    color: "success",
    status: "active"
  },
  {
    phase: "Fase 2 - 2025",
    title: "Sistema de reputación",
    description: "Los miembros ganan puntos por participar. Los más activos obtienen roles de moderación y beneficios.",
    icon: Star,
    color: "primary",
    status: "upcoming"
  },
  {
    phase: "Fase 3 - 2026",
    title: "DAO comunitarias",
    description: "Las comunidades se convierten en Organizaciones Autónomas Descentralizadas con tesorería propia.",
    icon: Globe,
    color: "secondary",
    status: "upcoming"
  },
  {
    phase: "Fase 4 - 2027",
    title: "Grants comunitarios",
    description: "Fondos para que las comunidades financien sus propios proyectos de impacto local.",
    icon: Award,
    color: "warning",
    status: "upcoming"
  }
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

export default function ComunidadesPage() {
  return (
    <DefaultLayout>
      <motion.section
        className="flex flex-col items-center py-12 md:py-20 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          variants={itemVariants}
        >
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
            Comunidades Rikuy
          </Chip>
          
          <h1 className={title()}>El poder de la acción colectiva</h1>
          
          <p className="text-lg text-default-600 dark:text-default-400 mt-4">
            Las comunidades son el corazón de Rikuy. Vecinos organizados que verifican denuncias, 
            protegen su entorno y construyen un futuro más justo para todos.
          </p>
          
          <Divider className="w-24 h-1 mx-auto mt-6 bg-secondary-500/30 rounded-full" />
        </motion.div>

        {/* Stats de impacto comunitario */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto w-full"
          variants={itemVariants}
        >
          <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
            <p className="text-3xl font-bold text-secondary-600">15</p>
            <p className="text-sm text-default-500">Comunidades activas</p>
          </div>
          <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
            <p className="text-3xl font-bold text-secondary-600">1,247</p>
            <p className="text-sm text-default-500">Miembros registrados</p>
          </div>
          <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
            <p className="text-3xl font-bold text-secondary-600">342</p>
            <p className="text-sm text-default-500">Denuncias verificadas</p>
          </div>
          <div className="text-center p-4 bg-default-50 dark:bg-default-100/5 rounded-lg">
            <p className="text-3xl font-bold text-secondary-600">98%</p>
            <p className="text-sm text-default-500">Tasa de verificación</p>
          </div>
        </motion.div>

        {/* Mapa de comunidades (visualización simple) */}
        <motion.div 
          className="w-full max-w-5xl mb-16"
          variants={itemVariants}
        >
          <div className="relative w-full h-64 bg-gradient-to-br from-secondary-500/10 to-primary-500/10 rounded-2xl overflow-hidden border border-default-200 dark:border-default-800">
            {/* SVG simple de mapa de Bolivia con puntos */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <path
                d="M200,100 L250,150 L300,120 L350,180 L280,220 L200,200 L150,150 L200,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-secondary-500"
              />
            </svg>
            
            {/* Puntos de comunidades */}
            <div className="absolute top-[30%] left-[40%]">
              <div className="relative group">
                <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs bg-background px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  El Alto (234 miembros)
                </span>
              </div>
            </div>
            <div className="absolute top-[60%] left-[70%]">
              <div className="relative group">
                <div className="w-4 h-4 bg-success-500 rounded-full animate-pulse" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs bg-background px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Plan 3000 (189 miembros)
                </span>
              </div>
            </div>
            <div className="absolute top-[70%] left-[30%]">
              <div className="relative group">
                <div className="w-4 h-4 bg-warning-500 rounded-full animate-pulse" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs bg-background px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Cerro Verde (156 miembros)
                </span>
              </div>
            </div>
            <div className="absolute top-[40%] left-[55%]">
              <div className="relative group">
                <div className="w-4 h-4 bg-secondary-500 rounded-full animate-pulse" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs bg-background px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Tiquipaya (203 miembros)
                </span>
              </div>
            </div>
            <div className="absolute top-[20%] left-[20%]">
              <div className="relative group">
                <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse" />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs bg-background px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  Riberalta (112 miembros)
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-default-400 mt-2">15 comunidades activas en 7 departamentos</p>
        </motion.div>

        {/* Comunidades activas */}
        <motion.div 
          className="w-full max-w-6xl mb-20"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Comunidades activas</h2>
            <Button 
              color="secondary" 
              variant="flat" 
              endContent={<ArrowRight size={16} />}
              as="a"
              href="/comunidades/unirse"
            >
              Ver todas
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCommunities.filter(c => c.active).slice(0, 3).map((community) => {
              const AvatarComponent = community.avatar;
              return (
                <motion.div
                  key={community.id}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Card className="h-full border border-default-200 dark:border-default-800 hover:shadow-lg transition-all">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${community.color}-500 to-${community.color}-600 p-0.5`}>
                          <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                            <AvatarComponent size={32} />
                          </div>
                        </div>
                        <Chip size="sm" color="success" variant="flat">Activa</Chip>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-1">{community.name}</h3>
                      <p className="text-sm text-default-500 mb-3 flex items-center gap-1">
                        <MapPin size={14} /> {community.department}
                      </p>
                      <p className="text-sm text-default-600 mb-4">{community.description}</p>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Users size={16} className="text-default-400" />
                          <span>{community.members} miembros</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileCheck size={16} className="text-default-400" />
                          <span>{community.verifiedReports} denuncias</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {community.achievements.map((ach, i) => (
                          <Chip key={i} size="sm" variant="flat" color="secondary">
                            {ach}
                          </Chip>
                        ))}
                      </div>

                      <Button
                        color="secondary"
                        variant="bordered"
                        size="sm"
                        className="w-full"
                        endContent={<ArrowRight size={14} />}
                        as="a"
                        href={`/comunidades/${community.id}`}
                      >
                        Ver comunidad
                      </Button>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Cómo funciona la verificación comunitaria */}
        <motion.div 
          className="w-full max-w-5xl mb-20"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            ¿Cómo funciona la verificación comunitaria?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", icon: FileCheck, title: "Denuncia enviada", desc: "Un ciudadano reporta un incidente con evidencia" },
              { step: "2", icon: Users, title: "Revisión colectiva", desc: "La comunidad revisa la evidencia de forma anónima" },
              { step: "3", icon: Vote, title: "Votación", desc: "Se vota si la denuncia es válida o falsa alarma" },
              { step: "4", icon: Shield, title: "Publicación", desc: "Las denuncias validadas pasan a los aliados" }
            ].map((item, i) => (
              <Card key={i} className="border border-default-200 dark:border-default-800">
                <CardBody className="text-center p-6">
                  <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-secondary-600">{item.step}</span>
                  </div>
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-secondary-500" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-default-500">{item.desc}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Beneficios */}
        <motion.div 
          className="w-full max-w-6xl mb-20"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Beneficios de ser parte
          </h2>
          <p className="text-center text-default-500 mb-12 max-w-2xl mx-auto">
            Unirte a una comunidad te da voz y poder para transformar tu entorno
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <Card key={i} className="border border-default-200 dark:border-default-800">
                  <CardBody className="flex flex-row gap-4 p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${benefit.color}-500 to-${benefit.color}-600 flex-shrink-0 flex items-center justify-center`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                      <p className="text-sm text-default-600">{benefit.description}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Roadmap de evolución */}
        <motion.div 
          className="w-full max-w-5xl mb-20"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            El futuro de las comunidades
          </h2>
          <p className="text-center text-default-500 mb-12 max-w-2xl mx-auto">
            Estamos construyendo el camino hacia comunidades autónomas y sostenibles
          </p>

          <div className="space-y-6">
            {roadmap.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={`text-${item.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-medium text-default-400">{item.phase}</p>
                      {item.status === 'active' && (
                        <Chip size="sm" color="success" variant="flat">Activo</Chip>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-default-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA para unirse */}
        <motion.div 
          className="w-full max-w-4xl mx-auto bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl p-8 text-white text-center"
          variants={itemVariants}
        >
          <h3 className="text-3xl font-bold mb-4">¿Quieres crear una comunidad en tu barrio?</h3>
          <p className="text-xl mb-6 text-white/90">
            Te ayudamos a organizar a tus vecinos y empezar a transformar tu entorno.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              color="default"
              variant="solid"
              className="font-semibold bg-white text-secondary-600"
              as="a"
              href="/comunidades/crear"
            >
              Crear nueva comunidad
            </Button>
            <Button
              size="lg"
              color="default"
              variant="bordered"
              className="font-semibold text-white border-white hover:bg-white/10"
              as="a"
              href="/comunidades/unirse"
            >
              Unirme a una existente
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-6">
            Requisitos mínimos: 10 vecinos interesados y un espacio de reunión virtual o físico.
          </p>
        </motion.div>

        {/* Estadísticas adicionales */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-16 max-w-4xl mx-auto w-full"
          variants={itemVariants}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">15</p>
            <p className="text-xs text-default-500">Comunidades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">1.2k</p>
            <p className="text-xs text-default-500">Miembros</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">342</p>
            <p className="text-xs text-default-500">Denuncias</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">98%</p>
            <p className="text-xs text-default-500">Verificación</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">7</p>
            <p className="text-xs text-default-500">Departamentos</p>
          </div>
        </motion.div>
      </motion.section>
    </DefaultLayout>
  );
}