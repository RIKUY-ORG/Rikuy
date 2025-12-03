import { title, subtitle } from "@/components/primitives";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";

const mockReports = [
  { id: "R-001", tipo: "Foto", estado: "Pendiente", comunidad: "La Paz" },
  { id: "R-002", tipo: "Audio", estado: "Validado", comunidad: "Cochabamba" },
  { id: "R-003", tipo: "Video", estado: "Escalado", comunidad: "Santa Cruz" },
];

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-5xl mx-auto">
      <h1 className={title()}>Panel institucional</h1>
      <p className={subtitle({ class: "text-gray-600" })}>
        Visualiza el estado de los reportes comunitarios. Esta vista está pensada para moderadores y autoridades.
      </p>

      <Table aria-label="Tabla de reportes">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Tipo</TableColumn>
          <TableColumn>Estado</TableColumn>
          <TableColumn>Comunidad</TableColumn>
        </TableHeader>
        <TableBody>
          {mockReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.id}</TableCell>
              <TableCell>{report.tipo}</TableCell>
              <TableCell>{report.estado}</TableCell>
              <TableCell>{report.comunidad}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
