import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@heroui/button";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useAvatarContext } from "@/context/avatarContext";
import { addToast } from "@heroui/toast";

export default function PerfilPage() {
  const { user, authenticated } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const { AvatarComp, avatars, currentName, setSelectedIndex, currentIndex } =
    useAvatarContext();
  const [copied, setCopied] = useState(false);

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
            <div className="flex flex-col items-center gap-4 mt-6">
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
