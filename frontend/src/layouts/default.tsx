// src/layouts/default.tsx (versión completa)
import { useState, useEffect } from "react";
import { Navbar as StandardNavbar } from "@/components/navbar";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Footer } from "@/components/footer";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { useLocation, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { LANDING_ROUTES } from "@/config/site";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-default-500">Cargando RIKUY...</p>
      </div>
    </div>
  );
}

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { authenticated, ready } = usePrivy();
  const { isVerified, isLoading: identityLoading } = useIdentityStatus();
  const [isDesktop, setIsDesktop] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const segments = location.pathname.split("/").filter(Boolean);
  const isLandingRoute = LANDING_ROUTES.includes(location.pathname);

  // Detectar si es desktop
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Esperar a que todo esté listo
  useEffect(() => {
    if (ready && !identityLoading) {
      setTimeout(() => setShowContent(true), 100);
    }
  }, [ready, identityLoading]);

  const formatSegment = (seg: string) =>
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const shouldShowFloatingNavbar = authenticated && isVerified;
  const shouldShowFooter = !authenticated || isLandingRoute;

  if (!showContent) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      {/* Navbar condicional */}
      {shouldShowFloatingNavbar ? (
        <FloatingNavbar key="floating" isDesktop={isDesktop} />
      ) : (
        <StandardNavbar key="standard" />
      )}

      {/* Contenido principal */}
      <main className={`
        flex-grow w-full mx-auto px-4 sm:px-6 transition-all duration-300
        ${shouldShowFloatingNavbar 
          ? isDesktop 
            ? 'pt-24'
            : 'pb-20'
          : 'pt-16'
        }
        ${!shouldShowFooter ? 'pb-8' : ''} // padding extra si no hay footer
      `}>
        {/* Breadcrumbs solo para landing */}
        {segments.length > 0 && !shouldShowFloatingNavbar && (
          <div className="max-w-7xl mx-auto mb-4">
            <Breadcrumbs variant="bordered">
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
          </div>
        )}

        {/* Contenido de la página */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer condicional */}
      {shouldShowFooter && <Footer />}
    </div>
  );
}