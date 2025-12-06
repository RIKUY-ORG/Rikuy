import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

export default function TerminosPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="max-w-3xl text-left">
          <h1 className={title()}>Términos y Condiciones</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Al acceder y utilizar RIKUY, aceptas los siguientes términos y condiciones.
            Esta plataforma está diseñada para permitir denuncias anónimas y seguras,
            con el objetivo de promover la transparencia y combatir la corrupción en
            Latinoamérica.
          </p>

          <h2 className="mt-6 font-semibold">Uso de la plataforma</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            El usuario se compromete a utilizar RIKUY de manera responsable, evitando
            abusos, spam o denuncias falsas que puedan afectar a terceros.
          </p>

          <h2 className="mt-6 font-semibold">Responsabilidad del contenido</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            Cada denuncia publicada es responsabilidad exclusiva del usuario que la
            emite. RIKUY no verifica ni garantiza la veracidad de las denuncias, y
            actúa únicamente como un medio tecnológico para su publicación.
          </p>

          <h2 className="mt-6 font-semibold">Limitaciones de responsabilidad</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            RIKUY no se responsabiliza por daños directos o indirectos derivados del
            uso de la plataforma. Tampoco garantiza que las denuncias generen acciones
            legales o institucionales.
          </p>

          <h2 className="mt-6 font-semibold">Acceso y disponibilidad</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            El servicio puede estar sujeto a interrupciones temporales por mantenimiento
            o mejoras. Nos esforzamos por mantener la disponibilidad y accesibilidad
            en todo momento.
          </p>

          <h2 className="mt-6 font-semibold">Derechos de los usuarios</h2>
          <ul className="list-disc list-inside text-sm text-ink/80 dark:text-milk/80 mt-2">
            <li>Acceder a la plataforma de manera libre y anónima.</li>
            <li>Usar RIKUY sin discriminación ni restricciones injustificadas.</li>
            <li>Confiar en que sus denuncias serán publicadas de forma transparente en la red Scroll.</li>
          </ul>

          <h2 className="mt-6 font-semibold">Modificaciones</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            RIKUY se reserva el derecho de modificar estos términos en cualquier momento.
            Las actualizaciones serán publicadas en esta misma página.
          </p>

          <h2 className="mt-6 font-semibold">Contacto</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            Si tienes dudas sobre estos términos, puedes escribirnos a: contacto@rikuy.org
          </p>

          <p className="mt-6 text-sm text-default-400">
            Última actualización: Diciembre 2025
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
