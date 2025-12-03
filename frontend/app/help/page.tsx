import { title } from "@/components/primitives";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function HelpPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className={title()}>Ayuda y Preguntas Frecuentes</h1>

      <Accordion variant="bordered">
        <AccordionItem key="1" aria-label="¿Cómo hago una denuncia?" title="¿Cómo hago una denuncia?">
          Desde la sección Acciones puedes elegir foto, video o audio. Tu identidad estará protegida.
        </AccordionItem>
        <AccordionItem key="2" aria-label="¿Qué significa anonimidad?" title="¿Qué significa anonimidad?">
          Rikuy nunca guarda tu información personal. Solo se registra tu denuncia de forma trazable.
        </AccordionItem>
        <AccordionItem key="3" aria-label="¿Cómo cambio de comunidad?" title="¿Cómo cambio de comunidad?">
          En la sección Comunidad puedes seleccionar otra ciudad o grupo y mantener tu historial.
        </AccordionItem>
        <AccordionItem key="4" aria-label="¿Qué son las recompensas?" title="¿Qué son las recompensas?">
          Son reconocimientos cuando tu denuncia ayuda a resolver un caso mayor o llega a conclusión verificable.
        </AccordionItem>
      </Accordion>
    </section>
  );
}
