// src/pages/landing/HowItWorks.tsx
import { HowItWorksConfig } from "@/config/landing/types";

export function HowItWorks({ config }: { config: HowItWorksConfig }) {
  return (
    <section
      className="
        min-h-screen                /* ocupa toda la altura del viewport */
        flex flex-col justify-center 
        mx-auto max-w-5xl px-4 py-12 md:py-24
        scroll-snap-align-start     /* engancha al inicio en scroll */
      "
      aria-label="Cómo funciona Rikuy"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center">
        {config.headline}
      </h2>

      <ol className="mt-8 grid gap-6 md:grid-cols-2">
        {config.steps.map((s, i) => (
          <li
            key={s.title}
            className="rounded-lg bg-ink/5 dark:bg-milk/10 p-6 flex flex-col"
          >
            <p className="font-semibold text-ink dark:text-milk mb-2">
              {i + 1}. {s.title}
            </p>
            <p className="text-ink/80 dark:text-milk/80">
              {s.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
