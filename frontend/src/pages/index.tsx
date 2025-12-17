import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import DefaultLayout from "@/layouts/default";
import { RikuyLogo } from "@/components/rikuyLogo";
import { usePrivy } from "@privy-io/react-auth";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";

const links = {
  empezar: "/denunciar",
  comoFunciona: "/como-funciona",
};

export default function IndexPage() {
  const { authenticated, login, ready } = usePrivy();
  const { isVerified, isLoading } = useIdentityStatus();

  // Determinar el comportamiento del botón "Denunciar"
  const getDenunciarButton = () => {
    // Usuario NO logueado
    if (!authenticated) {
      return (
        <Button
          onClick={login}
          disabled={!ready}
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            size: "lg",
          })}
          aria-label="Iniciar sesión para denunciar"
        >
          Inicia sesión para denunciar
        </Button>
      );
    }

    // Usuario logueado pero NO verificado - botón oscuro/deshabilitado
    if (!isVerified) {
      return (
        <Tooltip
          content="Primero debes verificar tu identidad boliviana para poder denunciar"
          color="warning"
          placement="bottom"
        >
          <div>
            <Button
              as={Link}
              href="/verificar-identidad"
              className={buttonStyles({
                color: "default",
                radius: "full",
                variant: "flat",
                size: "lg",
              })}
              isDisabled={isLoading}
              aria-label="Verificar identidad para denunciar"
              style={{
                opacity: 0.5,
                cursor: 'not-allowed',
                backgroundColor: '#888',
                color: '#fff'
              }}
            >
              {isLoading ? "Verificando..." : "🔒 Denunciar (requiere verificación)"}
            </Button>
          </div>
        </Tooltip>
      );
    }

    // Usuario logueado y VERIFICADO
    return (
      <Link
        href={links.empezar}
        className={buttonStyles({
          color: "primary",
          radius: "full",
          variant: "shadow",
          size: "lg",
        })}
        aria-label="Comenzar una denuncia anónima"
      >
        Denunciar anónimamente
      </Link>
    );
  };

  return (
    <DefaultLayout>
      {/* Hero principal */}
      <section
        className="flex flex-col items-center justify-center gap-6 py-10 md:py-16 px-4"
        aria-label="Introducción a RIKUY"
      >
        <div className="max-w-2xl text-center">
          <RikuyLogo size={320} className="mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-ink dark:text-milk">
            <span className="text-green-600 dark:text-green-400">RIKUY</span>: denuncias anónimas, seguras y accesibles
          </h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Una plataforma pensada para niños, jóvenes, adultos y personas mayores
            en Latinoamérica. Denuncia hechos de corrupción de forma anónima usando
            tecnología Web3, con datos inmutables y transparencia verificable.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {getDenunciarButton()}
          <Link
            href={links.comoFunciona}
            className={buttonStyles({
              variant: "bordered",
              radius: "full",
              size: "lg",
            })}
            aria-label="Aprender cómo funciona RIKUY"
          >
            Cómo funciona
          </Link>
        </div>

        {/* Mensaje breve de misión */}
        <div className="max-w-3xl text-center">
          <p className="text-sm md:text-base text-ink/70 dark:text-milk/70">
            RIKUY busca que ninguna denuncia quede olvidada. Tus evidencias
            (fotos, videos y audios) se registran de forma segura en Scroll,
            preservando el anonimato y evitando la manipulación de datos.
          </p>
        </div>
      </section>

      {/* Sección: Qué es RIKUY */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk">
          Qué es RIKUY
        </h2>
        <p className="mt-3 text-ink/80 dark:text-milk/80">
          RIKUY es una plataforma de denuncias anónimas que combina Web2 y Web3 para
          facilitar el reporte de casos de corrupción desde cualquier dispositivo.
          No necesitas conocimientos técnicos: puedes iniciar sesión con Google o
          conectar tu propia wallet si ya usas Ethereum.
        </p>
      </section>

      {/* Sección: Para quién está pensado */}
      {/* <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk">
          Para quién está pensado
        </h2>
        <ul className="mt-3 space-y-2">
          <li className="text-ink/80 dark:text-milk/80">
            <strong className="font-semibold">Comunidades locales:</strong>{" "}
            barrios, organizaciones civiles y medios comunitarios.
          </li>
          <li className="text-ink/80 dark:text-milk/80">
            <strong className="font-semibold">Ciudadanos de todas las edades:</strong>{" "}
            flujos simples que pueden usar niños, jóvenes, adultos y personas mayores.
          </li>
          <li className="text-ink/80 dark:text-milk/80">
            <strong className="font-semibold">Defensores y observadores:</strong>{" "}
            periodistas, activistas y auditores que requieren trazabilidad confiable.
          </li>
        </ul>
      </section> */}
    </DefaultLayout>
  );
}
