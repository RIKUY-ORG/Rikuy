import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { denunciasMock } from "@/data/denunciasMock";
import { useRef, useEffect } from "react";
import L from "leaflet";

interface Filtros {
  departamento?: string;
  tipo?: string;
  cantidadMin?: number;
}

interface Props {
  filtros: Filtros;
  onMapReady?: (map: L.Map) => void;
}

export default function MapaDenuncias({ filtros, onMapReady }: Props): JSX.Element {
  const mapRef = useRef<L.Map | null>(null);

  // Renderer global de canvas
  const canvasRenderer = L.canvas();

  useEffect(() => {
    if (mapRef.current && onMapReady) {
      onMapReady(mapRef.current);
    }
  }, [onMapReady]);

  const filtrados = denunciasMock.filter(
    (d) =>
      (!filtros.departamento || d.lugar === filtros.departamento) &&
      (!filtros.tipo || d.tipo === filtros.tipo) &&
      (!filtros.cantidadMin || d.count >= filtros.cantidadMin)
  );

  return (
    <MapContainer
      center={[-17.0, -64.9]}
      zoom={6}
      style={{
        height: "700px",
        width: "800px",
        margin: "0 auto",
        backgroundColor: "#fff",
        position: "relative",
        zIndex: 0,
      }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {filtrados.map((d, i) => (
        <CircleMarker
          key={i}
          center={[d.lat, d.lon]}
          radius={Math.max(4, Math.sqrt(d.count) / 2)}
          pathOptions={{
            fillColor: "#e63946",
            color: "#9b2226",
            fillOpacity: 0.7,
            weight: 1,
          }}
          renderer={canvasRenderer}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            {`${d.lugar}: ${d.count} denuncias (${d.tipo})`}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
