// src/pages/perfil/components/AvatarSection.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";

interface AvatarSectionProps {
  context: any; // Tipo más específico de tu contexto
}

export function AvatarSection({ context }: AvatarSectionProps) {
  const { AvatarComp, avatars, currentName, currentIndex, setSelectedIndex } = context;

  const handleSaveAvatar = () => {
    if (currentIndex !== null) {
      setSelectedIndex(currentIndex);
      addToast({
        title: "Avatar actualizado",
        description: "Tu avatar se guardó correctamente.",
        color: "success",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-xl font-semibold">Mi Avatar</h2>
      </CardHeader>
      <CardBody className="flex flex-col items-center gap-4">
        <AvatarComp size={220} className="text-primary" title={currentName} />
        <p className="text-default-500">{currentName}</p>

        <div className="w-full">
          <p className="text-sm text-default-500 mb-3 text-center">Selecciona tu avatar</p>
          <div className="flex overflow-x-auto gap-4 py-2 w-full">
            {avatars.map((a: any, index: number) => {
              const A = a.component;
              const isSelected = index === currentIndex;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex flex-col items-center shrink-0 transition p-2 rounded-lg ${
                    isSelected ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary" : "hover:bg-default-100"
                  }`}
                >
                  <A size={56} />
                  <span className="text-[10px] mt-1 text-default-500 text-center">
                    {a.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleSaveAvatar}
          color="success"
          variant="solid"
          radius="full"
          className="mt-2"
        >
          Guardar avatar
        </Button>
      </CardBody>
    </Card>
  );
}