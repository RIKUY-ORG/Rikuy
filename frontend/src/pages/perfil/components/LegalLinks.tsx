// src/pages/perfil/components/LegalLinks.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "react-router-dom";
import { FileText, HelpCircle, BookOpen, MessageCircle } from "lucide-react";

const legalLinks = [
  { to: "/privacidad", icon: FileText, label: "Políticas de privacidad" },
  { to: "/terminos", icon: FileText, label: "Términos y condiciones" },
  { to: "/ayuda", icon: HelpCircle, label: "Ayuda" },
  { to: "/soporte", icon: MessageCircle, label: "Soporte" },
  { to: "/tutorial", icon: BookOpen, label: "Tutoriales" },
];

export function LegalLinks() {
  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-xl font-semibold">Información legal y ayuda</h2>
      </CardHeader>
      <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {legalLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-default-100 dark:hover:bg-default-800 transition-colors"
            >
              <Icon size={18} className="text-primary-600" />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </CardBody>
    </Card>
  );
}