// src/pages/perfil/components/VerificationCard.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface VerificationCardProps {
  isVerified: boolean;
  isLoading: boolean;
}

export function VerificationCard({ isVerified, isLoading }: VerificationCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          ) : isVerified ? (
            <ShieldCheck className="text-success" size={24} />
          ) : (
            <AlertTriangle className="text-warning" size={24} />
          )}
          <h2 className="text-xl font-semibold">Estado de Verificación</h2>
        </div>
      </CardHeader>
      <CardBody className="gap-4">
        {isLoading ? (
          <p className="text-default-500">Verificando tu identidad...</p>
        ) : isVerified ? (
          <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
            <p className="text-success-700 dark:text-success-300 font-semibold flex items-center gap-2">
              <ShieldCheck size={20} />
              Identidad Verificada
            </p>
            <p className="text-sm text-default-600 mt-2">
              Tu identidad ha sido verificada con Zero-Knowledge Proofs.
              Ahora puedes crear denuncias anónimas de forma segura.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
              <p className="text-warning-700 dark:text-warning-300 font-semibold flex items-center gap-2">
                <AlertTriangle size={20} />
                No Verificado
              </p>
              <p className="text-sm text-default-600 mt-2">
                Necesitas verificar tu identidad para poder crear denuncias.
                Este proceso usa tecnología ZK para proteger tu privacidad.
              </p>
            </div>
            <Button
              as={Link}
              to="/verificar-identidad"
              color="warning"
              size="lg"
              variant="shadow"
              className="font-semibold"
            >
              Verificar mi Identidad
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}