// src/pages/landing/Problem.tsx
import { ProblemConfig } from "@/config/landing/types";

export function Problem({ config }: { config: ProblemConfig }) {
  return (
    <section
      className="
        min-h-screen                /* ocupa toda la altura del viewport */
        flex flex-col justify-center 
        mx-auto max-w-5xl px-4 py-12 md:py-24
        scroll-snap-align-start     /* engancha al inicio en scroll */
      "
      aria-label="Problema que aborda Rikuy"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center">
        {config.headline}
      </h2>

      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {config.items.map((item) => (
          <li
            key={item.title}
            className="bg-ink/5 dark:bg-milk/10 rounded-lg p-6 flex flex-col"
          >
            <p className="font-semibold text-ink dark:text-milk mb-2">
              {item.title}
            </p>
            <p className="text-ink/80 dark:text-milk/80">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
