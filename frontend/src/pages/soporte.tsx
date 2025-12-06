import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useState } from "react";

export default function SupportPage() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);

    addToast({
      title: "Soporte en construcción",
      description: `Has probado el botón de soporte ${newCount} ${newCount === 1 ? "vez" : "veces"}.`,
      color: "warning",
    });
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <h1 className={title()}>Soporte</h1>
        <p className="text-base text-ink/80 dark:text-milk/80 max-w-lg text-center">
          Este apartado está en construcción. Próximamente podrás acceder a soporte con IA y personas.
        </p>

        <Button
          onClick={handleClick}
          color="primary"
          variant="solid"
          radius="full"
        >
          Probar soporte
        </Button>
      </section>
    </DefaultLayout>
  );
}
