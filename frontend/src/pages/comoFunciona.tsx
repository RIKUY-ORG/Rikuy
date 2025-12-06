import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody } from "@heroui/card";

export default function ComoFuncionaPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Cómo denunciar</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Denunciar en RIKUY es un proceso sencillo, seguro y completamente
            anónimo. A continuación te mostramos los pasos básicos para realizar
            tu denuncia en la plataforma.
          </p>
        </div>

        {/* Pasos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Paso 1: Conectar tu billetera o ENS</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Para garantizar tu anonimato y seguridad, primero debes conectar
                tu billetera Web3 o tu ENS. Esto permite que la denuncia se
                registre en la red Scroll sin revelar tu identidad.
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Paso 2: Seleccionar tipo de evidencia</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Puedes elegir entre subir fotografías, videos o audios como
                prueba de tu denuncia. Cada formato será tratado con seguridad
                y transparencia.
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Paso 3: Publicar en Scroll</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Una vez que confirmes tu denuncia, esta se registrará en la
                blockchain de Scroll. Esto asegura que la información sea
                inmutable y accesible públicamente.
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <p className="text-lg font-semibold">Paso 4: Confirmación</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Al finalizar, recibirás un hash o identificador único de tu
                denuncia. Este comprobante garantiza que tu reporte quedó
                registrado de forma transparente.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}
