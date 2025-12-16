// src/pages/landing/MetricsSummary.tsx
export function MetricsSummary() {
  const metrics = [
    { label: "Denuncias registradas", value: "120+" },
    { label: "Comunidades activas", value: "15" },
    { label: "Aliados verificados", value: "5" },
  ];

  return (
    <section
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 md:py-24 scroll-snap-align-start"
      aria-label="Indicadores de Rikuy"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-ink dark:text-milk text-center mb-8">
        Nuestro impacto
      </h2>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl w-full">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg bg-ink/5 dark:bg-milk/10 p-6 text-center"
          >
            <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
              {m.value}
            </p>
            <p className="mt-2 text-ink/80 dark:text-milk/80">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <a
          href="/mapa"
          className="px-6 py-3 rounded-full border border-ink/20 dark:border-milk/20 text-ink dark:text-milk hover:bg-green-600 hover:text-white transition"
        >
          Ver mapa interactivo
        </a>
      </div>
    </section>
  );
}
