import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Square } from "lucide-react";
import { title } from "@/components/primitives"; // si usas tu helper de estilos
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";

const videoConstraints = {
  width: 1280,
  height: 720,
};

export default function PhotoPage() {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  const capturePhoto = () => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) setImageSrc(image);
      addToast({
        title: "Foto capturada",
        description: "Tu foto se guardó correctamente.",
        color: "success",
      });
    } else {
      addToast({
        title: "Error",
        description: "No se pudo capturar la foto.",
        color: "danger",
      });
    }
  };

  const clearPhoto = () => {
    setImageSrc(null);
    addToast({
      title: "Foto eliminada",
      description: "La foto capturada fue borrada.",
      color: "warning",
    });
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    addToast({
      title: "Cámara cambiada",
      description: newMode === "user"
        ? "Usando cámara frontal."
        : "Usando cámara trasera.",
      color: "primary",
    });
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20">
        <h1 className={title()}>Captura de Foto</h1>

        <div className="flex flex-col items-center gap-4">
          {/* Previsualización */}
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={720}
            height={360}
            videoConstraints={{
              ...videoConstraints,
              facingMode,
            }}
            className="rounded border"
          />

          <div className="flex gap-4">
            <button
              onClick={capturePhoto}
              className="flex flex-col items-center"
            >
              <Camera size={32} />
              <span className="text-xs">Capturar</span>
            </button>
            <button
              onClick={toggleCamera}
              className="flex flex-col items-center"
            >
              <RefreshCw size={28} />
              <span className="text-xs">Cambiar cámara</span>
            </button>
            {imageSrc && (
              <button
                onClick={clearPhoto}
                className="flex flex-col items-center"
              >
                <Square size={28} />
                <span className="text-xs">Borrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Imagen capturada */}
        {imageSrc && (
          <img
            src={imageSrc}
            alt="captura"
            className="mt-6 rounded w-full max-w-md border"
          />
        )}
      </section>
    </DefaultLayout>
  );
}
