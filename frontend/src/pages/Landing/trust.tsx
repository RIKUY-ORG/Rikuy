// src/pages/landing/Trust.tsx
import { TrustConfig } from "@/config/landing/types";

export function Trust({ config }: { config: TrustConfig }) {
  return (
    <section
      className="
        min-h-screen                /* ocupa toda la altura del viewport */
        flex flex-col justify-center 
        mx-auto max-w-5xl px-4 py-12 md:py-24
        scroll-snap-align-start     /* engancha al inicio en scroll */
      "
      aria-label="Confianza y transparencia en Rikuy"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center">
        {config.headline}
      </h2>

      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {config.notes.map((n) => (
          <li
            key={n}
            className="rounded-lg border border-ink/10 dark:border-milk/15 p-6 text-ink/80 dark:text-milk/80"
          >
            {n}
          </li>
        ))}
      </ul>
    </section>
  );
}
