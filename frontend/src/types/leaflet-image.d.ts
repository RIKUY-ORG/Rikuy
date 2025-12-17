declare module "leaflet-image" {
  import type L from "leaflet";

  // La función principal recibe un mapa y un callback
  export default function leafletImage(
    map: L.Map,
    callback: (err: Error | null, canvas: HTMLCanvasElement) => void
  ): void;
}
