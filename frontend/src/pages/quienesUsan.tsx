import { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useAvatarContext } from "@/context/avatarContext";

interface Actor {
  titulo: string;
  descripcion: string;
  avatarIndex: number;
}

const actores: Actor[] = [
  { titulo: "Barrios", descripcion: "Los vecinos pueden reportar irregularidades de forma anónima y segura.", avatarIndex: 0 },
  { titulo: "Organizaciones civiles", descripcion: "ONGs y colectivos pueden registrar casos con trazabilidad verificable.", avatarIndex: 1 },
  { titulo: "Medios comunitarios", descripcion: "Medios locales pueden dar voz a denuncias con respaldo tecnológico.", avatarIndex: 2 },
  { titulo: "Niños", descripcion: "Flujos simples y accesibles para denunciar con ayuda.", avatarIndex: 3 },
  { titulo: "Jóvenes", descripcion: "Interfaz moderna y clara para participar activamente.", avatarIndex: 4 },
  { titulo: "Adultos", descripcion: "Sin conocimientos técnicos: pasos claros y guía.", avatarIndex: 5 },
  { titulo: "Personas mayores", descripcion: "Diseño legible y accesible con pasos guiados.", avatarIndex: 6 },
  { titulo: "Periodistas", descripcion: "Evidencias con trazabilidad y anonimato.", avatarIndex: 7 },
  { titulo: "Activistas", descripcion: "Denunciar y dar seguimiento con respaldo.", avatarIndex: 8 },
  { titulo: "Auditores", descripcion: "Verificación y transparencia en las denuncias.", avatarIndex: 9 },
];

export default function QuienesUsan() {
  const [paused, setPaused] = useState(false);
  const { avatars } = useAvatarContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Duplicamos los actores para crear el efecto infinito
  const items = [...actores, ...actores];

  useEffect(() => {
    if (paused || !scrollRef.current) return;

    const container = scrollRef.current;
    const interval = setInterval(() => {
      container.scrollLeft += 1; // velocidad

      // Cuando llegamos al final de la primera tanda, reiniciamos suave
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [paused]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center mb-6">
        Para quién está pensado
      </h2>

      <div ref={scrollRef} className="relative overflow-hidden">
        <div className="flex gap-6 min-w-max">
          {items.map((actor, idx) => {
            const ActorAvatar = avatars[actor.avatarIndex].component;
            return (
              <Card
                key={idx}
                isPressable
                onPress={() => setPaused((prev) => !prev)}
                className="min-w-[250px] snap-center"
              >
                <CardHeader className="text-center font-semibold">
                  {actor.titulo}
                </CardHeader>
                <CardBody className="flex flex-col items-center text-center gap-3">
                  <ActorAvatar size={64} title={actor.titulo} />
                  <p className="text-sm text-ink/80 dark:text-milk/80">
                    {actor.descripcion}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
