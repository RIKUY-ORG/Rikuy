import { useEffect } from "react";
import { Input } from "@heroui/input";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, connectWallet, logout, user, authenticated, ready } = usePrivy();
  const navigate = useNavigate();

  // 👇 Redirige automáticamente al home si ya está autenticado
  useEffect(() => {
    if (authenticated && user) {
      navigate("/denunciar");
    }
  }, [authenticated, user, navigate]);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <h1 className={title()}>Iniciar sesión en Rikuy</h1>
      <p className={subtitle({ class: "text-center max-w-md" })}>
        Elige cómo ingresar: con tu wallet si eres usuario avanzado, 
        o con Google si prefieres una experiencia sencilla.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Input opcional para mostrar dirección de wallet */}
        <Input
          type="text"
          label="Dirección de tu wallet"
          placeholder="0x1234..."
        />

        {/* Botón para Web3 */}
        <button
          onClick={() => connectWallet()}
          disabled={!ready}
          className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
        >
          Conectar Wallet / ENS
        </button>

        {/* Botón para Web2 (Google) */}
        <button
          onClick={() => login()} // 👈 abre el modal con Google habilitado
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
