// src/pages/landing/Solution.tsx
import { SolutionConfig } from "@/config/landing/types";

export function Solution({ config }: { config: SolutionConfig }) {
  return (
    <section
      className="
        min-h-screen                /* ocupa toda la altura del viewport */
        flex flex-col justify-center 
        mx-auto max-w-5xl px-4 py-12 md:py-24
        scroll-snap-align-start     /* engancha al inicio en scroll */
      "
      aria-label="Solución que ofrece Rikuy"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center">
        {config.headline}
      </h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {config.points.map((p) => (
          <div
            key={p.label}
            className="rounded-lg border border-ink/10 dark:border-milk/15 p-6 flex flex-col"
          >
            <p className="font-semibold text-ink dark:text-milk mb-2">
              {p.label}
            </p>
            <p className="text-ink/80 dark:text-milk/80">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
