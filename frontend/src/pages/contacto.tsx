import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { FaXTwitter } from "react-icons/fa6";
import { addToast } from "@heroui/toast";

export default function ContactoPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Aquí iría tu lógica de envío (API, email, etc.)
    // Por ahora solo mostramos el toast de éxito
    addToast({
      title: "Mensaje enviado",
      description: "Tu solicitud de contacto fue recibida correctamente.",
      color: "success",
    });

    // En caso de error, podrías disparar un toast de error:
    // addToast({
    //   title: "Error",
    //   description: "No se pudo enviar tu mensaje. Intenta nuevamente.",
    //   color: "danger",
    // });
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Contacto</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Si tienes dudas, sugerencias o quieres colaborar con RIKUY, puedes
            escribirnos directamente mediante el formulario o hablar con
            nosotros en nuestra página de X.
          </p>
        </div>

        {/* Formulario de contacto */}
        <form className="w-full max-w-lg flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            type="text"
            isRequired
          />
          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            type="email"
            isRequired
          />
          <Textarea
            label="Mensaje"
            placeholder="Escribe tu mensaje aquí..."
            minRows={4}
            isRequired
          />
          <Button color="primary" type="submit">
            Enviar mensaje
          </Button>
        </form>

        {/* Card de contacto en X */}
        <Card className="max-w-lg shadow-lg mt-8">
          <CardHeader className="flex gap-3 items-center">
            <FaXTwitter className="text-xl text-default-500" />
            <div className="flex flex-col">
              <p className="text-lg font-semibold">Contáctanos en X</p>
              <p className="text-sm text-default-500">@rikuy_app</p>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink/80 dark:text-milk/80">
              También puedes escribirnos directamente en nuestra página oficial
              de X para consultas rápidas y actualizaciones.
            </p>
          </CardBody>
          <CardFooter>
            <Link
              isExternal
              href="https://x.com/rikuy_app"
              color="primary"
              className="font-medium"
            >
              Ir a nuestra página en X
            </Link>
          </CardFooter>
        </Card>
      </section>
    </DefaultLayout>
  );
}
