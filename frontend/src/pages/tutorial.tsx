import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function TutorialPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Tutorial</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Este tutorial te guiará paso a paso para realizar una denuncia en RIKUY.
            Aunque aún no implementamos todas las funciones, aquí puedes aprender
            cómo será el flujo dentro de la plataforma.
          </p>
        </div>

        {/* Acordeones de pasos */}
        <div className="w-full max-w-3xl mt-8">
          <Accordion variant="splitted">
            <AccordionItem key="1" aria-label="Paso 1" title="Paso 1: Conectar tu billetera o ENS">
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Haz clic en el botón “Conectar billetera” y selecciona tu wallet o ENS.
                Esto asegura que tu denuncia se registre en Scroll de manera anónima.
              </p>
            </AccordionItem>

            <AccordionItem key="2" aria-label="Paso 2" title="Paso 2: Seleccionar tipo de evidencia">
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Elige si deseas subir una fotografía, un video o un audio como prueba.
                Cada formato será tratado con seguridad y transparencia.
              </p>
            </AccordionItem>

            <AccordionItem key="3" aria-label="Paso 3" title="Paso 3: Confirmar y publicar">
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Revisa tu denuncia y confirma. El sistema la registrará en la blockchain
                de Scroll, garantizando que no pueda ser alterada.
              </p>
            </AccordionItem>

            <AccordionItem key="4" aria-label="Paso 4" title="Paso 4: Recibir comprobante">
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Al finalizar, recibirás un hash único como comprobante de tu denuncia.
                Este identificador asegura que tu reporte quedó registrado de forma transparente.
              </p>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </DefaultLayout>
  );
}
