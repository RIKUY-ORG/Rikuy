// src/pages/perfil/components/WalletCard.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Copy, Wallet } from "lucide-react";
import { useState } from "react";
import { addToast } from "@heroui/toast";

interface WalletCardProps {
  walletAddress?: string;
}

export function WalletCard({ walletAddress }: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      addToast({
        title: "Dirección copiada",
        description: "La dirección de tu wallet se copió al portapapeles.",
        color: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <Wallet className="text-primary-600" size={24} />
        <h2 className="text-xl font-semibold">Mi Wallet</h2>
      </CardHeader>
      <CardBody className="flex flex-col items-center gap-4">
        <p className="text-base text-default-700 dark:text-default-300 break-all text-center">
          {walletAddress || "No disponible"}
        </p>
        
        <Button
          onClick={handleCopy}
          color="primary"
          variant="bordered"
          className="flex items-center gap-2"
        >
          <Copy size={18} />
          {copied ? "¡Copiado!" : "Copiar dirección completa"}
        </Button>
      </CardBody>
    </Card>
  );
}