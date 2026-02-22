// src/pages/perfil/components/LogoutButton.tsx
import { Button } from "@heroui/button";
import { LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { addToast } from "@heroui/toast";

export function LogoutButton() {
  const { logout } = usePrivy();

  const handleLogout = () => {
    logout();
    addToast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
      color: "success",
    });
  };

  return (
    <Button
      onClick={handleLogout}
      color="danger"
      variant="bordered"
      className="w-full"
      startContent={<LogOut size={18} />}
    >
      Cerrar sesión
    </Button>
  );
}