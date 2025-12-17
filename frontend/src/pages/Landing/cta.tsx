// src/pages/landing/CTA.tsx
import { DenunciarButton } from "@/components/denunciarButton";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { usePrivy } from "@privy-io/react-auth";

export function CTA() {
  const { authenticated, login } = usePrivy();
  const { isVerified, isLoading } = useIdentityStatus();

  return (
    <section className="flex flex-col items-center justify-center gap-4 px-4 py-12">
      <h3 className="text-xl md:text-2xl font-semibold text-ink dark:text-milk">Denuncia sin miedo. Tu verdad importa.</h3>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* <Link href="/denunciar" className={buttonStyles({ color: "primary", radius: "full", variant: "shadow", size: "lg" })}>
          Denunciar anónimamente
        </Link> */}
        <DenunciarButton
          authenticated={authenticated}
          isVerified={isVerified}
          isLoading={isLoading}
          login={login}
        />
        <Link href="/como-funciona" className={buttonStyles({ variant: "bordered", radius: "full", size: "lg" })}>
          Ver cómo funciona
        </Link>
      </div>
    </section>
  );
}
