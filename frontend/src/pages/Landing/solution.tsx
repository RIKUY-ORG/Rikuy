// src/pages/landing/Solution.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Shield, Lock, Users } from "lucide-react"; // Iconos de HeroUI/lucide

import { SolutionConfig } from "@/config/landing/types";

// Mapeo de iconos para cada solución (usando HeroUI compatible)
const solutionIcons = {
  "Anonimato real": Shield,
  "Evidencia inmutable": Lock,
  "Atención y presión": Users,
  default: Shield
};

export function Solution({ config }: { config: SolutionConfig }) {
  return (
    <section
      className="min-h-screen flex flex-col justify-center mx-auto max-w-7xl px-4 py-12 md:py-24 scroll-snap-align-start relative overflow-hidden bg-gradient-to-b from-background via-background to-green-50/30 dark:to-green-950/10"
      aria-label="Solución que ofrece Rikuy"
    >
      {/* Fondo decorativo sutil (solo CSS) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-10 md:mb-16">
          <Chip
            color="success"
            variant="flat"
            size="lg"
            classNames={{
              base: "mb-4",
              content: "font-medium"
            }}
            startContent={<span className="mr-1">✨</span>}
          >
            La solución
          </Chip>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {config.headline}
          </h2>
          
          <Divider className="w-24 h-1 mx-auto mt-4 bg-green-500/30 rounded-full" />
        </div>

        {/* Grid de soluciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {config.points.map((point) => {
            const IconComponent = solutionIcons[point.label as keyof typeof solutionIcons] || solutionIcons.default;
            
            return (
              <Card
                key={point.label}
                className="group bg-background/60 backdrop-blur-sm border border-green-500/20 hover:border-green-500/40 transition-all duration-300"
                shadow="md"
                isPressable
                onPress={() => {}}
              >
                <CardHeader className="flex flex-col items-center gap-4 pb-0 pt-8">
                  {/* Círculo decorativo con icono */}
                  <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors duration-300">
                    <IconComponent 
                      size={32} 
                      className="text-green-600 dark:text-green-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-foreground text-center">
                    {point.label}
                  </h3>
                </CardHeader>
                
                <CardBody className="text-center px-6 pb-8">
                  <p className="text-default-600 dark:text-default-400 leading-relaxed">
                    {point.description}
                  </p>
                  
                  {/* Línea decorativa inferior (opcional) */}
                  <div className="mt-6 w-12 h-0.5 bg-green-500/30 mx-auto rounded-full" />
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Mensaje de cierre (opcional) */}
        <div className="text-center mt-12 md:mt-16">
          <p className="text-default-500 max-w-2xl mx-auto text-sm md:text-base">
            Tres pilares que hacen de Rikuy una plataforma única en Bolivia.
          </p>
          
          {/* Badges de características adicionales */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Chip
              color="success"
              variant="bordered"
              size="sm"
              classNames={{
                base: "border-green-500/30",
                content: "text-xs"
              }}
            >
              ⚡ Verificado por IA
            </Chip>
            <Chip
              color="success"
              variant="bordered"
              size="sm"
              classNames={{
                base: "border-green-500/30",
                content: "text-xs"
              }}
            >
              🔒 Sin rastreo
            </Chip>
            <Chip
              color="success"
              variant="bordered"
              size="sm"
              classNames={{
                base: "border-green-500/30",
                content: "text-xs"
              }}
            >
              🎯 Impacto real
            </Chip>
          </div>
        </div>
      </div>
    </section>
  );
}