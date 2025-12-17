import { useState, useRef } from "react";
import type L from "leaflet";
import DefaultLayout from "@/layouts/default";
import FiltrosDrawer from "@/components/mapa/filtrosDrawer";
import MapaDenuncias from "@/components/mapa/mapaDenuncias";

export default function MetricsFullPage() {
  const [filtros, setFiltros] = useState({});
  const mapRef = useRef<L.Map | null>(null);

  return (
    <DefaultLayout>
      <main className="min-h-screen px-4 py-12 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Mapa interactivo de denuncias
        </h1>
        <div className="flex flex-col gap-4">
          {/* Ahora FiltrosDrawer recibe también la instancia del mapa */}
          <FiltrosDrawer onFilter={setFiltros} map={mapRef} />

          <div
            id="map-container"
            className="bg-white p-4 rounded shadow w-full max-w-[1024px] mx-auto"
          >
            <MapaDenuncias
              filtros={filtros}
              onMapReady={(mapInstance) => {
                // console.log("Mapa listo en MetricsFullPage:", mapInstance);
                mapRef.current = mapInstance;
              }}
            />
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
}
