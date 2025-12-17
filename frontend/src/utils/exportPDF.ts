// src/utils/exportPDF.ts
import jsPDF from "jspdf";
import leafletImage from "leaflet-image";
import type L from "leaflet";
import { denunciasMock } from "@/data/denunciasMock";

export interface Filtros {
  departamento?: string;
  tipo?: string;
  cantidadMin?: number;
}

/**
 * Exporta un PDF con filtros, tabla y mapa.
 * @param filtros Filtros aplicados
 * @param map Instancia del mapa Leaflet
 */
export async function exportPDF(filtros: Filtros, map: L.Map): Promise<void> {
  console.log("Entrando a exportPDF con filtros:", filtros, "y mapa:", map);

  // Espera a que el mapa esté cargado
  await new Promise<void>((resolve) => {
    if ((map as any)._loaded) {
    //   console.log("Mapa ya estaba cargado");
      resolve();
    } else {
      console.log("Mapa aún no cargado, esperando evento 'load'");
      map.once("load", () => {
        // console.log("Mapa terminó de cargar");
        resolve();
      });
    }
  });

  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth: number = pdf.internal.pageSize.getWidth();
  const pageHeight: number = pdf.internal.pageSize.getHeight();

  const logo: HTMLImageElement = new Image();
  logo.src = "/profile_rikuy_logo.png";

  logo.onload = () => {
    // Función para dibujar logo y texto en cada página
    const drawHeader = (): void => {
      pdf.addImage(logo, "PNG", pageWidth - 35, 5, 20, 20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Rikuy", pageWidth - 30, 30);
    };

    // 🧩 Página 1: encabezado + filtros + tabla
    drawHeader();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Filtros aplicados", 10, 15);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Departamento: ${filtros.departamento || "Todos"}`, 10, 22);
    pdf.text(`Tipo de caso: ${filtros.tipo || "Todos"}`, 100, 22);
    pdf.text(`Cantidad mínima: ${filtros.cantidadMin || 0}`, 190, 22);

    // ✅ Fallback: si no hay filtros, usar todos los datos
    const sinFiltros = Object.keys(filtros).length === 0;
    const datos = sinFiltros
      ? denunciasMock
      : denunciasMock.filter(
          (d) =>
            (!filtros.departamento || d.lugar === filtros.departamento) &&
            (!filtros.tipo || d.tipo === filtros.tipo) &&
            (!filtros.cantidadMin || d.count >= filtros.cantidadMin)
        );

    console.log("Denuncias filtradas:", datos.length, datos);

    let startY: number = 40;
    const rowHeight: number = 8;

    if (datos.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Denuncias listadas", 10, startY);

      startY += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      // Encabezado de tabla
      pdf.setFillColor(230, 230, 230);
      pdf.rect(10, startY - 6, pageWidth - 20, rowHeight, "F");
      pdf.text("Ubicación", 12, startY);
      pdf.text("Tipo", 80, startY);
      pdf.text("Cantidad", 160, startY);

      let currentY: number = startY + rowHeight;

      datos.forEach((d) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          drawHeader();

          currentY = 30;
          pdf.setFont("helvetica", "bold");
          pdf.text("Denuncias listadas (continuación)", 10, currentY);
          currentY += 6;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setFillColor(230, 230, 230);
          pdf.rect(10, currentY - 6, pageWidth - 20, rowHeight, "F");
          pdf.text("Ubicación", 12, currentY);
          pdf.text("Tipo", 80, currentY);
          pdf.text("Cantidad", 160, currentY);
          currentY += rowHeight;
        }

        pdf.text(d.lugar, 12, currentY);
        pdf.text(d.tipo, 80, currentY);
        pdf.text(d.count.toString(), 160, currentY);
        currentY += rowHeight;
      });
    } else {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(12);
      pdf.text("No hay denuncias que coincidan con los filtros aplicados.", 10, startY);
    }

    // 🧩 Página final: mapa completo
    pdf.addPage();
    drawHeader();

    // 👇 Espera medio segundo para que los puntos se dibujen
    setTimeout(() => {
      leafletImage(map, (err: Error | null, canvas: HTMLCanvasElement) => {
        if (err) {
          console.error("Error exportando mapa:", err);
          return;
        }
        // console.log("leafletImage devolvió un canvas:", canvas);

        const imgData: string = canvas.toDataURL("image/png");
        // console.log("Imagen del mapa generada, longitud base64:", imgData.length);

        pdf.addImage(imgData, "PNG", 10, 35, pageWidth - 20, pageHeight - 50);
        // console.log("Mapa agregado al PDF");

        pdf.setFontSize(10);
        pdf.text(`Generado el ${new Date().toLocaleString("es-BO")}`, 10, pageHeight - 10);

        pdf.save("denuncias-filtradas.pdf");
        // console.log("PDF guardado correctamente");
      });
    }, 500);
  };
}
