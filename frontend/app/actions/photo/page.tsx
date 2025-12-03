"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, Square, RefreshCw } from "lucide-react";
import { title } from "@/components/primitives";

const videoConstraints = {
  width: 1280,
  height: 720,
};

export default function PhotoPage() {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const capturePhoto = () => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) setImageSrc(image);
    }
  };

  const clearPhoto = () => {
    setImageSrc(null);
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  return (
    <section className="flex flex-col items-center gap-6 py-12 md:py-20">
      <h1 className={title()}>Captura de Foto</h1>

      <div className="flex flex-col items-center gap-4">
        {/* Previsualización */}
        <Webcam
          ref={webcamRef}
          audio={false} // 👈 sin sonido
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
          <button onClick={capturePhoto} className="flex flex-col items-center">
            <Camera size={32} />
            <span className="text-xs">Capturar</span>
          </button>
          <button onClick={toggleCamera} className="flex flex-col items-center">
            <RefreshCw size={28} />
            <span className="text-xs">Cambiar cámara</span>
          </button>
          {imageSrc && (
            <button onClick={clearPhoto} className="flex flex-col items-center">
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
  );
}
