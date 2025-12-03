import { title, subtitle } from "@/components/primitives";
import { Card, CardBody } from "@heroui/card";

const stats = [
  { label: "Denuncias registradas", value: "1,245" },
  { label: "Comunidades activas", value: "12" },
  { label: "Casos escalados", value: "87" },
  { label: "Usuarios activos", value: "3,560" },
];

export default function StatsPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-4xl mx-auto">
      <h1 className={title()}>Métricas públicas</h1>
      <p className={subtitle({ class: "text-gray-600" })}>
        Transparencia en números: aquí puedes ver la actividad de Rikuy en tiempo real.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {stats.map((stat) => (
          <Card key={stat.label} shadow="sm">
            <CardBody className="flex flex-col items-center gap-2">
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
              <span className="text-gray-500">{stat.label}</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
