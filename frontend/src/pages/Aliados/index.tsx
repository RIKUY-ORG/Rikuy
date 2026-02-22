// src/pages/aliados/index.tsx
import { motion, Variants } from "motion/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  Scale, 
  Newspaper, 
  Heart, 
  Building2, 
  Globe, 
  TrendingUp,
  Users,
//   FileText,
//   Map,
//   Download,
//   Filter,
//   Bell,
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

// Configuración de categorías de aliados
const allyCategories = [
  {
    id: "legal",
    label: "Abogados & Investigadores",
    icon: Scale,
    description: "Para casos que requieren acción legal o investigación profesional",
    color: "primary",
    gradient: "from-blue-500 to-cyan-500",
    allies: [
      {
        name: "Bufetes de abogados",
        description: "Acceso a casos verificados para litigios de interés público",
        features: ["Casos con evidencia inmutable", "Seguimiento legal", "Pruebas validadas"],
        price: "Desde $35/mes",
        cta: "Acceso Profesional",
        popular: true
      },
      {
        name: "Investigadores privados",
        description: "Material verificado para investigaciones de corrupción",
        features: ["Datos geolocalizados", "Historial de casos", "Exportación de pruebas"],
        price: "Desde $15/mes",
        cta: "Comenzar",
        popular: false
      },
      {
        name: "Firmas legales",
        description: "Suscripciones institucionales para equipos completos",
        features: ["Múltiples usuarios", "Reportes personalizados", "Soporte prioritario"],
        price: "Enterprise",
        cta: "Contactar",
        popular: false
      }
    ]
  },
  {
    id: "media",
    label: "Medios & Periodistas",
    icon: Newspaper,
    description: "Historias reales con datos verificados antes que la competencia",
    color: "secondary",
    gradient: "from-purple-500 to-pink-500",
    allies: [
      {
        name: "Medios nacionales",
        description: "Acceso a tendencias y casos de alto impacto",
        features: ["Alertas en tiempo real", "Datos exclusivos", "Entrevistas con denunciantes"],
        price: "Desde $149/mes",
        cta: "Suscripción Media",
        popular: true
      },
      {
        name: "Periodistas independientes",
        description: "Para investigación periodística con fuentes verificadas",
        features: ["Mapa de casos", "Descarga de evidencia", "Verificación de datos"],
        price: "Desde $49/mes",
        cta: "Acceso Reportero",
        popular: false
      },
      {
        name: "Medios regionales",
        description: "Cobertura local con datos de tu región",
        features: ["Filtros por ciudad", "Reportes comunitarios", "Branding local"],
        price: "Desde $80/mes",
        cta: "Plan Regional",
        popular: false
      }
    ]
  },
  {
    id: "ngo",
    label: "ONGs & DDHH",
    icon: Heart,
    description: "Evidencia cuantificable para informes y campañas de incidencia",
    color: "success",
    gradient: "from-green-500 to-emerald-500",
    allies: [
      {
        name: "ONGs internacionales",
        description: "Datos verificados para reportes globales",
        features: ["Estándares internacionales", "Exportación PDF/CSV", "Datos históricos"],
        price: "Desde $149/mes",
        cta: "Plan ONG",
        popular: true
      },
      {
        name: "Organizaciones locales",
        description: "Para incidencia territorial con datos reales",
        features: ["Foco en comunidades", "Mapas de calor", "Alertas configurables"],
        price: "Desde $49/mes",
        cta: "Acceso Local",
        popular: false
      },
      {
        name: "Defensorías",
        description: "Protección de derechos con evidencia inmutable",
        features: ["Casos priorizados", "Soporte legal", "Certificación blockchain"],
        price: "Desde $80/mes",
        cta: "Plan Defensoría",
        popular: false
      }
    ]
  },
  {
    id: "government",
    label: "Gobiernos & Municipios",
    icon: Building2,
    description: "Inteligencia territorial para tomar decisiones basadas en datos",
    color: "warning",
    gradient: "from-orange-500 to-red-500",
    allies: [
      {
        name: "Municipios",
        description: "Prioriza inversión pública con datos ciudadanos",
        features: ["Mapa de incidencias", "Reportes periódicos", "Dashboard exclusivo"],
        price: "Desde $149/mes",
        cta: "Plan Municipal",
        popular: true
      },
      {
        name: "Gobernaciones",
        description: "Visión departamental de problemáticas sociales",
        features: ["Estadísticas regionales", "Comparativas", "Alertas tempranas"],
        price: "Desde $800/mes",
        cta: "Contactar",
        popular: false
      }
    ]
  },
  {
    id: "international",
    label: "Organismos Internacionales",
    icon: Globe,
    description: "Datos confiables para cooperación y desarrollo",
    color: "primary",
    gradient: "from-indigo-500 to-blue-500",
    allies: [
      {
        name: "PNUD, OEA, etc.",
        description: "Información verificada para programas de cooperación",
        features: ["Datos abiertos", "Informes personalizados", "Reuniones periódicas"],
        price: "Enterprise",
        cta: "Solicitar demo",
        popular: true
      }
    ]
  },
  {
    id: "consulting",
    label: "Consultoras",
    icon: TrendingUp,
    description: "Due diligence territorial antes de inversiones",
    color: "secondary",
    gradient: "from-pink-500 to-rose-500",
    allies: [
      {
        name: "Firmas de consultoría",
        description: "Evaluación de contexto de riesgo con datos verificados",
        features: ["Análisis territorial", "Datos históricos", "Exportación avanzada"],
        price: "Desde $149/mes",
        cta: "Plan Consultoría",
        popular: false
      }
    ]
  }
];

// Productos principales
const products = [
  {
    name: "RIKUY Connect",
    icon: Users,
    description: "Marketplace de casos verificados",
    features: [
      "Publica anuncios indicando qué casos te interesan",
      "Ciudadanos eligen contactarte directamente",
      "Solo recibes contacto si el denunciante decide",
      "Privacidad garantizada en todo momento"
    ],
    tiers: [
      { name: "Básico", price: "$15/mes", cta: "Comenzar", features: ["1 anuncio", "Hasta 3 filtros", "Posicionamiento estándar", "Email soporte"] },
      { name: "Profesional", price: "$35/mes", cta: "Seleccionar", features: ["Hasta 3 anuncios", "Hasta 8 filtros", "Posicionamiento destacado", "Métricas básicas"], popular: true },
      { name: "Institucional", price: "$80/mes", cta: "Contactar", features: ["Anuncios ilimitados", "Filtros ilimitados", "Máxima visibilidad", "Métricas detalladas", "Soporte prioritario"] }
    ]
  },
  {
    name: "RIKUY Insights",
    icon: TrendingUp,
    description: "Inteligencia de datos ciudadanos",
    features: [
      "Mapa de calor completo de denuncias",
      "Filtros por ciudad, categoría y período",
      "Exportación PDF/CSV con formato estándar",
      "Alertas configurables en tiempo real"
    ],
    tiers: [
      { name: "Basic", price: "$49/mes", cta: "Comenzar", features: ["Mapa público", "Exportación hasta 3/mes", "Filtros básicos"] },
      { name: "Pro", price: "$149/mes", cta: "Seleccionar", features: ["Exportación ilimitada", "Alertas configurables", "Filtros avanzados", "Soporte prioritario"], popular: true },
      { name: "Enterprise", price: "Desde $800/mes", cta: "Contactar", features: ["Branding propio", "Vistas exclusivas", "Reportes periódicos", "Reuniones de revisión", "SLA dedicado"] }
    ]
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

export default function AliadosPage() {
  return (
    <DefaultLayout>
      <motion.section
        className="flex flex-col items-center justify-center py-12 md:py-20 px-4"
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
            color="primary"
            variant="flat"
            size="lg"
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<Sparkles size={18} className="mr-1" />}
          >
            Aliados de Rikuy
          </Chip>
          
          <h1 className={title()}>Inteligencia ciudadana.<br />Datos reales. Decisiones que impactan.</h1>
          
          <p className="text-lg text-default-600 dark:text-default-400 mt-4">
            Accede a reportes ciudadanos verificados, en tiempo real, desde cualquier rincón de Bolivia. 
            Información que no existe en ningún otro lugar.
          </p>
          
          <Divider className="w-24 h-1 mx-auto mt-6 bg-primary-500/30 rounded-full" />
        </motion.div>

        {/* Stats rápidas */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">120+</p>
            <p className="text-sm text-default-500">Denuncias verificadas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">15</p>
            <p className="text-sm text-default-500">Comunidades activas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">5</p>
            <p className="text-sm text-default-500">Aliados actuales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">9</p>
            <p className="text-sm text-default-500">Departamentos</p>
          </div>
        </motion.div>

        {/* Beneficios principales */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20"
          variants={itemVariants}
        >
          <Card className="border border-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10">
            <CardBody className="text-center p-6">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 w-fit mx-auto mb-4">
                <CheckCircle size={24} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Datos verificados</h3>
              <p className="text-default-500 text-sm">Cada reporte pasa por revisión con IA antes de publicarse. No hay spam ni denuncias falsas.</p>
            </CardBody>
          </Card>
          
          <Card className="border border-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10">
            <CardBody className="text-center p-6">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 w-fit mx-auto mb-4">
                <CheckCircle size={24} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Evidencia inmutable</h3>
              <p className="text-default-500 text-sm">Los reportes se registran en blockchain. Nadie, ni Rikuy, puede borrarlos o modificarlos.</p>
            </CardBody>
          </Card>
          
          <Card className="border border-primary-500/20 bg-primary-50/50 dark:bg-primary-900/10">
            <CardBody className="text-center p-6">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 w-fit mx-auto mb-4">
                <CheckCircle size={24} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Geolocalizados</h3>
              <p className="text-default-500 text-sm">Cada denuncia tiene ubicación aproximada. Sabes exactamente de qué zona viene la información.</p>
            </CardBody>
          </Card>
        </motion.div>

        {/* Productos principales */}
        <motion.div 
          className="w-full max-w-6xl mb-20"
          variants={itemVariants}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Dos formas de trabajar con RIKUY
          </h2>
          <p className="text-center text-default-500 mb-12 max-w-2xl mx-auto">
            Elige el producto que mejor se adapte a las necesidades de tu organización
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {products.map((product) => (
              <Card key={product.name} className="border border-primary-500/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6">
                  <div className="flex items-center gap-3">
                    <product.icon size={32} />
                    <div>
                      <h3 className="text-2xl font-bold">{product.name}</h3>
                      <p className="text-white/80">{product.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <ul className="space-y-3 mb-6">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={18} className="text-success-500 flex-shrink-0 mt-0.5" />
                        <span className="text-default-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {product.tiers.map((tier) => (
                      <Card key={tier.name} className={`border ${tier.popular ? 'border-primary-500 shadow-lg' : 'border-default-200'}`}>
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Chip color="primary" size="sm" variant="solid">Más popular</Chip>
                          </div>
                        )}
                        <CardBody className="p-4 text-center">
                          <h4 className="font-bold text-lg">{tier.name}</h4>
                          <p className="text-2xl font-bold text-primary-600 mt-2">{tier.price}</p>
                          <ul className="text-xs text-default-500 space-y-1 mt-4">
                            {tier.features.map((f, i) => (
                              <li key={i}>✓ {f}</li>
                            ))}
                          </ul>
                          <Button 
                            color={tier.popular ? "primary" : "default"}
                            variant={tier.popular ? "solid" : "bordered"}
                            size="sm"
                            className="mt-4 w-full"
                            as="a"
                            href="/contacto"
                          >
                            {tier.cta}
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Categorías de aliados con Tabs */}
        <motion.div 
          className="w-full max-w-6xl"
          variants={itemVariants}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Para quién es RIKUY?
          </h2>
          <p className="text-center text-default-500 mb-12 max-w-2xl mx-auto">
            Organizaciones de todos los tamaños pueden beneficiarse de datos ciudadanos verificados
          </p>

          <Tabs 
            aria-label="Categorías de aliados"
            color="primary"
            variant="underlined"
            size="lg"
            classNames={{
              tabList: "flex flex-wrap justify-center gap-2",
              cursor: "w-full bg-primary-500",
              tab: "max-w-fit px-4",
            }}
          >
            {allyCategories.map((category) => (
              <Tab
                key={category.id}
                title={
                  <div className="flex items-center gap-2">
                    <category.icon size={18} />
                    <span className="text-sm">{category.label}</span>
                  </div>
                }
              >
                <div className="mt-8">
                  <div className="text-center mb-8">
                    <Chip color={category.color as any} variant="flat" size="lg">
                      {category.description}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.allies.map((ally, index) => (
                      <motion.div
                        key={ally.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className={`h-full border ${ally.popular ? 'border-primary-500' : 'border-default-200'} hover:shadow-lg transition-all`}>
                          {ally.popular && (
                            <div className="absolute top-0 right-0">
                              <Chip color="primary" size="sm" variant="solid" classNames={{ base: "rounded-tr-lg rounded-bl-none" }}>
                                Recomendado
                              </Chip>
                            </div>
                          )}
                          <CardBody className="p-6">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} mb-4 flex items-center justify-center`}>
                              <category.icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{ally.name}</h3>
                            <p className="text-default-500 text-sm mb-4">{ally.description}</p>
                            <ul className="space-y-2 mb-6">
                              {ally.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs">
                                  <CheckCircle size={14} className="text-success-500 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="font-bold text-primary-600">{ally.price}</span>
                              <Button 
                                size="sm" 
                                color="primary" 
                                variant="light"
                                endContent={<ArrowRight size={14} />}
                                as="a"
                                href="/contacto"
                              >
                                {ally.cta}
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Tab>
            ))}
          </Tabs>
        </motion.div>

        {/* Oferta de lanzamiento */}
        <motion.div 
          className="mt-20 w-full max-w-4xl mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white text-center"
          variants={itemVariants}
        >
          <h3 className="text-3xl font-bold mb-4">🚀 Oferta de lanzamiento</h3>
          <p className="text-xl mb-6">El primer cliente Enterprise de cada producto accede a 3 meses completamente gratuitos con todas las funcionalidades activas.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              color="default"
              variant="solid"
              className="font-semibold bg-white text-primary-600"
              as="a"
              href="/contacto"
            >
              Solicitar demo personalizada
            </Button>
            <Button
              size="lg"
              color="default"
              variant="bordered"
              className="font-semibold text-white border-white hover:bg-white/10"
              as="a"
              href="/precios"
            >
              Ver precios
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-6">
            * Válido por tiempo limitado. Aplica a primer cliente Enterprise de cada producto.
          </p>
        </motion.div>

        {/* Descuentos por fidelidad */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full"
          variants={itemVariants}
        >
          <Card className="border border-primary-500/20">
            <CardBody className="text-center p-6">
              <p className="text-3xl font-bold text-primary-600">15%</p>
              <p className="text-lg font-semibold mb-2">3 meses por adelantado</p>
              <p className="text-sm text-default-500">15% de descuento sobre el precio mensual</p>
            </CardBody>
          </Card>
          <Card className="border border-primary-500/20">
            <CardBody className="text-center p-6">
              <p className="text-3xl font-bold text-primary-600">25%</p>
              <p className="text-lg font-semibold mb-2">6 meses por adelantado</p>
              <p className="text-sm text-default-500">25% de descuento sobre el precio mensual</p>
            </CardBody>
          </Card>
          <Card className="border border-primary-500/20 bg-primary-50 dark:bg-primary-900/10">
            <CardBody className="text-center p-6">
              <p className="text-3xl font-bold text-primary-600">3 meses gratis</p>
              <p className="text-lg font-semibold mb-2">Primer cliente Enterprise</p>
              <p className="text-sm text-default-500">A cambio de testimonio o caso de uso publicable</p>
            </CardBody>
          </Card>
        </motion.div>

        {/* CTA Final */}
        <motion.div 
          className="mt-20 text-center"
          variants={itemVariants}
        >
          <h3 className="text-2xl font-bold mb-4">¿Listo para trabajar con datos que marcan la diferencia?</h3>
          <p className="text-default-500 mb-8 max-w-2xl mx-auto">
            Contáctanos para una demo personalizada según las necesidades de tu organización.
          </p>
          <Button
            size="lg"
            color="primary"
            radius="full"
            className="font-semibold px-8"
            as="a"
            href="/contacto"
          >
            Solicitar demo
          </Button>
        </motion.div>
      </motion.section>
    </DefaultLayout>
  );
}