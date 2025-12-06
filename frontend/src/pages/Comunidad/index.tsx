import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody } from "@heroui/card";

export default function ComunidadesPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Comunidades</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Las comunidades en RIKUY serán el corazón de la verificación. 
            Su rol será ayudar a filtrar denuncias irrelevantes, falsas alarmas 
            o pruebas poco claras, garantizando que la información publicada 
            sea confiable y útil para todos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-5xl">
          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Verificación comunitaria</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Los miembros de la comunidad revisarán denuncias y decidirán 
                si aportan valor o son falsas alarmas. Esto asegura que 
                la información tenga relevancia social.
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Transparencia</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Todas las decisiones quedarán registradas en la blockchain, 
                asegurando trazabilidad y confianza en el proceso de verificación.
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Futuro: DAO</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                En el futuro, las comunidades podrán organizarse como DAO 
                (Organización Autónoma Descentralizada), donde cada miembro 
                tendrá voz y voto para decidir colectivamente.
              </p>
            </CardBody>
          </Card>
        </div>

        <p className="mt-8 text-sm text-default-400">
          Funcionalidad en desarrollo — próximamente disponible.
        </p>
      </section>
    </DefaultLayout>
  );
}
