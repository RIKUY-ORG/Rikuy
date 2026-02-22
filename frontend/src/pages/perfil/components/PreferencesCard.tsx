// src/pages/perfil/components/PreferencesCard.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import { Moon, Sun, Bell, Globe, Eye } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@heroui/use-theme";

export function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("es");
  const [privacyMode, setPrivacyMode] = useState(true);

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-xl font-semibold">Preferencias</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Tema */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="text-sm">Modo oscuro</span>
          </div>
          <Switch
            isSelected={theme === 'dark'}
            onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
            color="primary"
            size="sm"
          />
        </div>

        <Divider />

        {/* Notificaciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} />
            <span className="text-sm">Recibir notificaciones</span>
          </div>
          <Switch
            isSelected={notifications}
            onValueChange={setNotifications}
            color="primary"
            size="sm"
          />
        </div>

        <Divider />

        {/* Idioma */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} />
            <span className="text-sm">Idioma</span>
          </div>
          <Select
            selectedKeys={[language]}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-32"
            size="sm"
          >
            <SelectItem key="es" textValue="es">Español</SelectItem>
            <SelectItem key="en" textValue="en">English</SelectItem>
            <SelectItem key="qu" textValue="qu">Quechua</SelectItem>
            <SelectItem key="ay" textValue="ay">Aymara</SelectItem>
          </Select>
        </div>

        <Divider />

        {/* Modo privado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={18} />
            <span className="text-sm">Modo privado</span>
          </div>
          <Switch
            isSelected={privacyMode}
            onValueChange={setPrivacyMode}
            color="primary"
            size="sm"
          />
        </div>
      </CardBody>
    </Card>
  );
}