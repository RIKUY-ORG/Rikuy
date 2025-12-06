import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { FaCamera, FaVideo, FaMicrophone } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";

export default function DenunciarPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Denunciar</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            En RIKUY puedes realizar denuncias anónimas de manera sencilla. 
            Actualmente ofrecemos tres formas básicas de compartir pruebas: 
            fotografías, videos y audios. Esta página explica cómo funcionará 
            cada opción en la plataforma.
          </p>
        </div>

        {/* Opciones de denuncia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-5xl">
          
          {/* Fotografías */}
          <Card as={Link} to="/denunciar/foto" className="shadow-lg hover:scale-[1.02] transition">
            <CardHeader className="flex gap-3 items-center">
              <FaCamera className="text-xl text-primary" />
              <p className="text-lg font-semibold">Fotografías</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Podrás subir imágenes como evidencia de tu denuncia. 
                El sistema garantizará que se mantenga tu anonimato 
                y que las fotografías se almacenen de forma segura.
              </p>
            </CardBody>
            <CardFooter>
              <Button as={Link} to="/denunciar/foto" color="primary" fullWidth>
                Sacar foto
              </Button>
            </CardFooter>
          </Card>

          {/* Videos */}
          <Card as={Link} to="/denunciar/video" className="shadow-lg hover:scale-[1.02] transition">
            <CardHeader className="flex gap-3 items-center">
              <FaVideo className="text-xl text-primary" />
              <p className="text-lg font-semibold">Videos</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                También podrás compartir videos como prueba. 
                Estos se registrarán en la red Scroll para asegurar 
                transparencia y trazabilidad sin comprometer tu identidad.
              </p>
            </CardBody>
            <CardFooter>
              <Button as={Link} to="/denunciar/video" color="primary" fullWidth>
                Grabar video
              </Button>
            </CardFooter>
          </Card>

          {/* Audios */}
          <Card as={Link} to="/denunciar/audio" className="shadow-lg hover:scale-[1.02] transition">
            <CardHeader className="flex gap-3 items-center">
              <FaMicrophone className="text-xl text-primary" />
              <p className="text-lg font-semibold">Audios</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink/80 dark:text-milk/80">
                Los audios serán otra forma de denuncia, permitiendo 
                registrar testimonios o pruebas verbales. 
                Todo se manejará con seguridad y anonimato.
              </p>
            </CardBody>
            <CardFooter>
              <Button as={Link} to="/denunciar/audio" color="primary" fullWidth>
                Grabar audio
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}
