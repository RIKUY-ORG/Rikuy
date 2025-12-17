import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { button as buttonStyles } from "@heroui/theme";

interface DenunciarButtonProps {
  authenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  login: () => void;
}

export function DenunciarButton({
  authenticated,
  isVerified,
  isLoading,
  login,
}: DenunciarButtonProps) {
  // Usuario NO logueado
  if (!authenticated) {
    return (
      <Button
        onClick={login}
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

  // Usuario logueado pero NO verificado
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
              cursor: "not-allowed",
              backgroundColor: "#888",
              color: "#fff",
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
      href="/denunciar"
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
}
