import { title, subtitle } from "@/components/primitives";
import { CheckCircle } from "lucide-react";

export default function RewardsPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className={title()}>Recompensas y trazabilidad</h1>
      <p className={subtitle({ class: "text-gray-600" })}>
        Rikuy premia a quienes contribuyen con reportes útiles. Las recompensas se otorgan cuando un caso ayuda a resolver otro mayor o llega a una conclusión verificable.
      </p>

      <ul className="mt-6 space-y-4">
        <li className="flex items-center gap-3">
          <CheckCircle className="text-success" />
          Recompensas condicionadas por impacto real
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="text-success" />
          Trazabilidad pública de cada denuncia
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="text-success" />
          Votación comunitaria para escalar casos
        </li>
      </ul>
    </section>
  );
}
