// src/pages/landing/Hero.tsx
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { RikuyLogo } from "@/components/rikuyLogo";
import { HeroConfig } from "@/config/landing/types";
import { usePrivy } from "@privy-io/react-auth";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { DenunciarButton } from "@/components/denunciarButton";

export function Hero({ config }: { config: HeroConfig }) {
  const { authenticated, login } = usePrivy();
  const { isVerified, isLoading } = useIdentityStatus();


  return (
    <section
      className="
        min-h-screen                /* ocupa toda la altura de la ventana */
        flex flex-col items-center justify-center 
        gap-6 px-4 py-12 md:py-24   /* padding adaptable */
        scroll-snap-align-start     /* engancha al inicio en scroll */
      "
      aria-label="Introducción a RIKUY"
    >
      <div className="max-w-2xl text-center">
        <RikuyLogo size={180} className="mx-auto mb-4" />
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-ink dark:text-milk">
          <span className="text-green-600 dark:text-green-400">RIKUY</span>: {config.title}
        </h1>
        <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
          {config.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* <Link
          href={config.primaryCta.href}
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
            size: "lg",
          })}
        >
          {config.primaryCta.label}
        </Link> */}
        <DenunciarButton
          authenticated={authenticated}
          isVerified={isVerified}
          isLoading={isLoading}
          login={login}
        />
        {config.secondaryCta && (
          <Link
            href={config.secondaryCta.href}
            className={buttonStyles({
              variant: "bordered",
              radius: "full",
              size: "lg",
            })}
          >
            {config.secondaryCta.label}
          </Link>
        )}
      </div>

      {config.missionNote && (
        <div className="max-w-3xl text-center mt-6">
          <p className="text-sm md:text-base text-ink/70 dark:text-milk/70">
            {config.missionNote}
          </p>
        </div>
      )}
    </section>
  );
}
