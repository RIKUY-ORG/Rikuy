import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";

export default function PrivacidadPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="max-w-3xl text-left">
          <h1 className={title()}>Política de Privacidad</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            En RIKUY valoramos tu privacidad y nos comprometemos a proteger la
            información de todas las personas que utilizan nuestra plataforma.
            Esta política explica cómo manejamos los datos y cómo garantizamos
            el anonimato en cada denuncia.
          </p>

          <h2 className="mt-6 font-semibold">Información que recopilamos</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            RIKUY no recopila información personal de los usuarios. No pedimos
            nombres, correos electrónicos ni datos de identidad. El acceso y uso
            de la plataforma no requiere registro tradicional.
          </p>

          <h2 className="mt-6 font-semibold">Anonimato y seguridad</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            Las denuncias se publican utilizando tu billetera o tu ENS en la red
            Scroll. Esto asegura que la información quede registrada de forma
            transparente en la blockchain, sin comprometer tu identidad. El
            sistema está diseñado para que ninguna persona ni institución pueda
            rastrear quién realizó la denuncia.
          </p>

          <h2 className="mt-6 font-semibold">Derechos de los usuarios</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            Como usuario de RIKUY tienes derecho a:
          </p>
          <ul className="list-disc list-inside text-sm text-ink/80 dark:text-milk/80 mt-2">
            <li>Usar la plataforma de manera anónima.</li>
            <li>Acceder a la información publicada en la red sin restricciones.</li>
            <li>Confiar en que tus denuncias no serán modificadas ni eliminadas.</li>
            <li>Recibir una experiencia accesible y segura sin importar tu edad o nivel técnico.</li>
          </ul>

          <h2 className="mt-6 font-semibold">Cookies y tecnologías de terceros</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            RIKUY no utiliza cookies propias ni guarda información de navegación.
            En caso de que accedas mediante Privi, las cookies son gestionadas
            directamente por dicho servicio externo, bajo sus propias políticas.
          </p>

          <h2 className="mt-6 font-semibold">Contacto</h2>
          <p className="text-sm text-ink/80 dark:text-milk/80">
            Si tienes dudas sobre esta política o sobre cómo protegemos tu
            privacidad, puedes escribirnos a: contacto@rikuy.org
          </p>

          <p className="mt-6 text-sm text-default-400">
            Última actualización: Diciembre 2025
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
