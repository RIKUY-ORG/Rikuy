// src/pages/mapa/index.tsx
import DefaultLayout from "@/layouts/default";
import { Feature } from "geojson";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

export default function MetricsFullPage() {
  return (
    <DefaultLayout>
      <main className="min-h-screen px-4 py-12 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Mapa interactivo de denuncias
        </h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Panel de filtros */}
          <aside className="md:w-1/4 bg-ink/5 dark:bg-milk/10 p-6 rounded-lg">
            <h2 className="font-semibold mb-4">Filtros</h2>
            <label className="block mb-2">Departamento</label>
            <select className="w-full p-2 rounded border">
              <option>Todos</option>
              <option>Cochabamba</option>
              <option>La Paz</option>
              <option>Santa Cruz</option>
            </select>
          </aside>

          {/* Mapa */}
          <div className="flex-1">
            <ComposableMap projection="geoMercator" width={600} height={400}>
              <Geographies geography="/bolivia-geo.json">
                {({ geographies }: { geographies: Feature[] }) =>
                  geographies.map((geo: Feature) => (
                    <Geography
                      key={geo.id || geo.properties?.name}
                      geography={geo}
                      fill="#38a169"
                      stroke="#fff"
                    />
                  ))
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
}
