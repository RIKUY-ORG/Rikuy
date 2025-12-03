import { Card, CardBody } from "@heroui/card";
import { title, subtitle } from "@/components/primitives";
import { button as buttonStyles } from "@heroui/theme";

const communities = [
  { name: "La Paz", description: "Reportes y votaciones en La Paz" },
  { name: "Cochabamba", description: "Actividad comunitaria en Cochabamba" },
  { name: "Santa Cruz", description: "Denuncias y participación en Santa Cruz" },
];

export default function CommunityPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <h1 className={title()}>Comunidades</h1>
      <p className={subtitle({ class: "text-center max-w-md" })}>
        Elige tu comunidad para ver reportes, votar y participar. Puedes cambiarla cuando lo necesites.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full max-w-4xl">
        {communities.map((community) => (
          <Card key={community.name} shadow="sm">
            <CardBody className="flex flex-col items-center gap-2">
              <h3 className="text-lg font-semibold">{community.name}</h3>
              <p className="text-sm text-gray-500 text-center">{community.description}</p>
              <button
                className={buttonStyles({ color: "primary", radius: "full", variant: "flat" })}
              >
                Entrar
              </button>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
