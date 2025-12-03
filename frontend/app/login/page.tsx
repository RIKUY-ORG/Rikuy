"use client";

import { Input } from "@heroui/input";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { login, logout, user, authenticated, ready } = usePrivy();
  const router = useRouter();

  // 👇 Redirige automáticamente al home si ya está autenticado
  useEffect(() => {
    if (authenticated && user) {
      router.push("/home");
    }
  }, [authenticated, user, router]);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <h1 className={title()}>Iniciar sesión en Rikuy</h1>
      <p className={subtitle({ class: "text-center max-w-md" })}>
        Elige cómo ingresar: con tu wallet si eres usuario avanzado, 
        o con Google si prefieres una experiencia sencilla.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Input
          type="text"
          label="Dirección de tu wallet"
          placeholder="0x1234..."
        />

        <button
          onClick={login}
          disabled={!ready}
          className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
        >
          Iniciar con Wallet
        </button>

        <button
          onClick={login}
          disabled={!ready}
          className={buttonStyles({ color: "secondary", radius: "full", variant: "shadow" })}
        >
          Iniciar sesión con Google
        </button>

        {authenticated && user && (
          <div className="text-sm text-center text-green-500 mt-2">
            Sesión iniciada: {String(user.email ?? user.wallet?.address)}
            <br />
            <button
              onClick={logout}
              className="mt-2 text-xs underline text-red-500"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
