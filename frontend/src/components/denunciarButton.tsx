// src/components/denunciarButton.tsx
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { button as buttonStyles } from "@heroui/theme";
import { cn } from "@heroui/theme"; // Opcional: si tienes la función cn de HeroUI

interface DenunciarButtonProps {
  authenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  login: () => void;
  className?: string;  // 👈 AÑADIDO
}

export function DenunciarButton({
  authenticated,
  isVerified,
  isLoading,
  login,
  className = "",  // 👈 VALOR POR DEFECTO
}: DenunciarButtonProps) {
  // Usuario NO logueado
  if (!authenticated) {
    return (
      <Button
        onClick={login}
        className={cn(
          buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            size: "lg",
          }),
          className  // 👈 CLASE PERSONALIZADA
        )}
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
        <div className={className}>  {/* 👈 CLASE EN EL CONTENEDOR */}
          <Button
            as={Link}
            href="/verificar-identidad"
            className={buttonStyles({
              color: "default",
              radius: "full",
              variant: "flat",
              size: "lg",
              className: "opacity-50 cursor-not-allowed bg-[#888] text-white hover:bg-[#888] hover:text-white"  // 👈 ESTILOS TAILWIND
            })}
            isDisabled={isLoading}
            aria-label="Verificar identidad para denunciar"
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
      className={cn(
        buttonStyles({
          color: "primary",
          radius: "full",
          variant: "shadow",
          size: "lg",
        }),
        className  // 👈 CLASE PERSONALIZADA
      )}
      aria-label="Comenzar una denuncia anónima"
    >
      Denunciar anónimamente
    </Link>
  );
}