import { title } from "@/components/primitives";

export default function TermsPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className={title()}>Términos y Condiciones</h1>
      <p className="text-gray-600">
        Al usar Rikuy, aceptas que tus reportes serán procesados de forma anónima y trazable. 
        La comunidad puede votar sobre los casos, y las autoridades recibirán los más relevantes.
      </p>
      <p className="text-gray-600">
        No se permite el uso malicioso de la plataforma. Las denuncias falsas o repetidas serán filtradas por IA y revisión comunitaria.
        Rikuy se reserva el derecho de auditar y mejorar el sistema para proteger a los usuarios.
      </p>
    </section>
  );
}
