"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { title } from "@/components/primitives";
import { button as buttonStyles } from "@heroui/theme";

export default function ErrorPage({ error }: { error: Error }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-20">
      <h1 className={title({ color: "pink" })}>Algo salió mal</h1>
      <p className="text-gray-600 text-center max-w-md">
        Ocurrió un error inesperado. Puedes volver a la página principal o intentar más tarde.
      </p>
      <button
        onClick={() => router.push("/")}
        className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
      >
        Volver al inicio
      </button>
    </section>
  );
}
