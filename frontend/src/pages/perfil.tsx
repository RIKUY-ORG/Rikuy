import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@heroui/button";
import { Copy, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAvatarContext } from "@/context/avatarContext";
import { addToast } from "@heroui/toast";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";

export default function PerfilPage() {
  const { user, authenticated } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const { AvatarComp, avatars, currentName, setSelectedIndex, currentIndex } =
    useAvatarContext();
  const [copied, setCopied] = useState(false);
  const { isVerified, isLoading } = useIdentityStatus();

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      addToast({
        title: "Dirección copiada",
        description: "La dirección de tu wallet se copió al portapapeles.",
        color: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <h1 className={title()}>Mi Perfil</h1>

        {!authenticated
          ? (
            <p className="text-sm text-ink/80 dark:text-milk/80">
              No has iniciado sesión. Por favor, accede desde la página de
              Login.
            </p>
          )
          : (
            <div className="flex flex-col items-center gap-6 mt-6 w-full max-w-2xl">
              {/* Sección de Verificación de Identidad */}
              <Card className="w-full">
                <CardHeader className="flex gap-3">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    ) : isVerified ? (
                      <ShieldCheck className="text-success" size={24} />
                    ) : (
                      <AlertTriangle className="text-warning" size={24} />
                    )}
                    <h2 className="text-xl font-semibold">Estado de Verificación</h2>
                  </div>
                </CardHeader>
                <CardBody className="gap-4">
                  {isLoading ? (
                    <p className="text-default-500">Verificando tu identidad...</p>
                  ) : isVerified ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
                        <p className="text-success-700 dark:text-success-300 font-semibold flex items-center gap-2">
                          <ShieldCheck size={20} />
                          Identidad Verificada
                        </p>
                        <p className="text-sm text-default-600 mt-2">
                          Tu identidad ha sido verificada con Zero-Knowledge Proofs.
                          Ahora puedes crear denuncias anónimas de forma segura.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                        <p className="text-warning-700 dark:text-warning-300 font-semibold flex items-center gap-2">
                          <AlertTriangle size={20} />
                          No Verificado
                        </p>
                        <p className="text-sm text-default-600 mt-2">
                          Necesitas verificar tu identidad para poder crear denuncias.
                          Este proceso usa tecnología ZK para proteger tu privacidad.
                        </p>
                      </div>
                      <Button
                        as={Link}
                        href="/verificar-identidad"
                        color="warning"
                        size="lg"
                        variant="shadow"
                        className="font-semibold"
                      >
                        Verificar mi Identidad
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Avatar + nombre */}
              <AvatarComp
                size={220}
                className="text-primary"
                title={currentName}
              />
              <p className=" text-default-500">{currentName}</p>

              {/* Wallet */}
              <p className="text-base text-ink dark:text-milk">
                <span className="font-semibold">Wallet:</span> {walletAddress
                  ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
                  : "No disponible"}
              </p>

              {/* Copiar */}
              <Button
                onClick={handleCopy}
                color="primary"
                variant="solid"
                className="flex items-center gap-2"
              >
                <Copy size={18} />
                {copied ? "Copiado!" : "Copiar dirección completa"}
              </Button>

              {/* Carrusel simple */}
              <div className="flex overflow-x-auto gap-4 pt-4 w-full max-w-md">
                {avatars.map((a, index) => {
                  const A = a.component;
                  const isSelected = index === currentIndex;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`flex flex-col items-center shrink-0 transition ${
                        isSelected ? "ring-2 ring-primary rounded-full" : ""
                      }`}
                    >
                      <A size={56} />
                      <span className="text-[11px] mt-1 text-default-500 text-center">
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => {
                  if (currentIndex !== null) {
                    setSelectedIndex(currentIndex);
                    addToast({
                      title: "Avatar actualizado",
                      description: "Tu avatar se guardó correctamente.",
                      color: "success",
                    });
                  }
                }}
                color="success"
                variant="solid"
                radius="full"
              >
                Guardar avatar
              </Button>
            </div>
          )}
      </section>
    </DefaultLayout>
  );
}
