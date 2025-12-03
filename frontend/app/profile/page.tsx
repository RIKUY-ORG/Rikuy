"use client";

import { title, subtitle } from "@/components/primitives";
import { Card, CardBody } from "@heroui/card";
import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

export default function ProfilePage() {
  const { user, authenticated, ready } = usePrivy();

  if (!ready) return null;

  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className={title()}>Mi perfil</h1>
      <p className={subtitle({ class: "text-gray-600" })}>
        Aquí puedes ver tu wallet invisible, comunidad actual y recompensas acumuladas.
      </p>

      {authenticated && user ? (
        <Card shadow="sm">
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Wallet className="text-primary" />
              <span className="font-semibold">Wallet:</span>
              <span className="text-gray-500">
                {user.wallet?.address ?? "No disponible"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Comunidad actual:</span>
              <span className="text-gray-500">La Paz</span> {/* ← esto lo podés conectar a tu backend si lo tenés */}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Recompensas acumuladas:</span>
              <span className="text-gray-500">3 tokens</span> {/* ← también puede venir de tu backend */}
            </div>
          </CardBody>
        </Card>
      ) : (
        <p className="text-center text-sm text-red-500">
          Debes iniciar sesión para ver tu perfil.
        </p>
      )}
    </section>
  );
}
