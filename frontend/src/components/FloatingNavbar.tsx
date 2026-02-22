// src/components/FloatingNavbar.tsx
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Home, FileText, Users, Map, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface FloatingNavbarProps {
  isDesktop: boolean;
}

export function FloatingNavbar({ isDesktop }: FloatingNavbarProps) {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemDimensions, setItemDimensions] = useState<{ width: number; left: number; height: number }[]>([]);
  
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const navItems = [
    { to: "/", icon: Home, label: "Inicio" },
    { to: "/denunciar", icon: FileText, label: "Denunciar" },
    { to: "/aliados", icon: Users, label: "Aliados" },
    { to: "/mapa", icon: Map, label: "Mapa" },
    { to: "/perfil", icon: User, label: "Perfil" },
  ];

  // Actualizar índice activo cuando cambia la ruta
  useEffect(() => {
    const index = navItems.findIndex(item => item.to === location.pathname);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  // Función para medir dimensiones de los items
  const measureItems = () => {
    const dimensions = navItems.map((_, index) => {
      const element = itemRefs.current[index];
      if (element) {
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement?.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left - (parentRect?.left || 0),
        };
      }
      return { width: 0, height: 0, left: 0 };
    });
    setItemDimensions(dimensions);
  };

  // Medir dimensiones después del renderizado
  useEffect(() => {
    measureItems();
  }, [isDesktop, activeIndex]);

  // Re-medir en resize
  useEffect(() => {
    window.addEventListener('resize', measureItems);
    return () => window.removeEventListener('resize', measureItems);
  }, []);

  return (
    <nav className={`
      fixed z-50
      ${isDesktop 
        ? 'top-4 left-1/2 transform -translate-x-1/2' 
        : 'bottom-4 left-0 right-0 px-2'
      }
    `}>
      <div className={`
        bg-background/80 backdrop-blur-lg border border-default-200 dark:border-default-800 shadow-lg
        ${isDesktop 
          ? 'rounded-full px-2 py-1.5' 
          : 'rounded-2xl py-2'
        }
      `}>
        <div className="flex items-center relative">
          {/* Indicador de foco animado - ADAPTATIVO */}
          {itemDimensions[activeIndex] && (
            <motion.div
              className={`
                absolute bg-primary-100 dark:bg-primary-900/30
                ${isDesktop ? 'rounded-full' : 'rounded-lg'}
              `}
              initial={false}
              animate={{
                x: itemDimensions[activeIndex].left,
                width: itemDimensions[activeIndex].width,
                height: itemDimensions[activeIndex].height,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          {/* Items de navegación */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            
            return (
              <Link
                key={item.to}
                ref={el => itemRefs.current[index] = el}
                to={item.to}
                className={`
                  relative flex items-center gap-2 z-10 transition-colors
                  ${isDesktop 
                    ? 'px-4 py-2 rounded-full flex-1' 
                    : 'flex-1 flex-col py-2 px-1'
                  }
                  ${isActive 
                    ? 'text-primary-600' 
                    : 'text-default-500 hover:text-default-800 hover:bg-default-100 dark:hover:bg-default-800'
                  }
                `}
              >
                <Icon size={isDesktop ? 18 : 20} />
                <span className={`
                  font-medium whitespace-nowrap
                  ${isDesktop ? 'text-sm' : 'text-[10px]'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}