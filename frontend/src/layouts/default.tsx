import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { useLocation, Link } from "react-router-dom";

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Formatea los segmentos: "como-funciona" → "Como Funciona"
  const formatSegment = (seg: string) =>
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow">
        {/* Breadcrumbs dinámicos: solo se muestran si hay segmentos */}
        {segments.length > 0 && (
          <Breadcrumbs variant="bordered" className="mb-4">
            <BreadcrumbItem key="home">
              <Link to="/">Inicio</Link>
            </BreadcrumbItem>
            {segments.map((seg, idx) => {
              const path = "/" + segments.slice(0, idx + 1).join("/");
              const isLast = idx === segments.length - 1;
              return (
                <BreadcrumbItem key={path}>
                  {isLast ? (
                    <span className="text-default-500">{formatSegment(seg)}</span>
                  ) : (
                    <Link to={path}>{formatSegment(seg)}</Link>
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumbs>
        )}

        {children}
      </main>
      <Footer />
    </div>
  );
}
