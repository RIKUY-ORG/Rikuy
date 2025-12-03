"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";

export default function HomePage() {
  const { user, authenticated, ready } = usePrivy();

  if (!ready) return null;

  if (!authenticated || !user) {
    return (
      <section className="flex flex-col items-center justify-center py-20">
        <h1 className={title()}>Acceso restringido</h1>
        <p className={subtitle({ class: "text-center max-w-md" })}>
          Debes iniciar sesión para acceder a esta página.
        </p>
        <Link
          href="/login"
          className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
        >
          Ir al login
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-6 py-12 md:py-20">
      <h1 className={title()}>
        Bienvenido {String(user.email ?? user.wallet?.address)}
      </h1>
      <p className={subtitle({ class: "text-center max-w-md" })}>
        Elige a dónde quieres ir:
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/actions"
          className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
        >
          Ir a Acciones
        </Link>

        <Link
          href="/community"
          className={buttonStyles({ color: "secondary", radius: "full", variant: "shadow" })}
        >
          Ir a Comunidades
        </Link>

        <Link
          href="/profile"
          className={buttonStyles({ color: "success", radius: "full", variant: "shadow" })}
        >
          Ver Perfil
        </Link>

        <Link
          href="/help"
          className={buttonStyles({ color: "warning", radius: "full", variant: "shadow" })}
        >
          Ayuda
        </Link>
      </div>
    </section>
  );
}
