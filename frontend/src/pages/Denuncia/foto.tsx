// src/pages/Denuncia/foto.tsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, RefreshCw, ArrowRight } from "lucide-react";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

export default function PhotoPage() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const capturePhoto = async () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        try {
          // Obtener dimensiones de la imagen usando Image del DOM
          const img = document.createElement('img');
          img.onload = () => {
            setImageDimensions({
              width: img.width,
              height: img.height
            });
            URL.revokeObjectURL(img.src); // Limpiar memoria
          };
          img.src = screenshot;

          // Convertir base64 a File
          const blob = await fetch(screenshot).then(r => r.blob());
          const file = new File([blob], `denuncia-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          setImageSrc(screenshot);
          setImageFile(file);
          
          addToast({
            title: "Foto capturada",
            description: "Tu foto se guardó correctamente.",
            color: "success",
          });
        } catch (error) {
          console.error('Error processing image:', error);
          addToast({
            title: "Error",
            description: "No se pudo procesar la imagen.",
            color: "danger",
          });
        }
      }
    } else {
      addToast({
        title: "Error",
        description: "No se pudo acceder a la cámara.",
        color: "danger",
      });
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    addToast({
      title: "Cámara cambiada",
      description: facingMode === "user" ? "Usando cámara trasera" : "Usando cámara frontal",
      color: "primary",
    });
  };

  const retakePhoto = () => {
    setImageSrc(null);
    setImageFile(null);
    setImageDimensions(null);
  };

  const continueToForm = () => {
    if (imageFile) {
      // Guardar el archivo en sessionStorage para pasarlo al formulario
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem('pendingPhoto', reader.result as string);
        sessionStorage.setItem('pendingPhotoName', imageFile.name);
        sessionStorage.setItem('pendingPhotoType', imageFile.type);
        
        // Navegar al formulario con información detallada
        navigate('/denunciar/crear', { 
          state: { 
            mediaType: 'photo',
            fileName: imageFile.name,
            fileSize: imageFile.size,
            fileType: imageFile.type,
            dimensions: imageDimensions,
            timestamp: Date.now(),
            source: 'camera'
          }
        });

        addToast({
          title: "Foto lista",
          description: "Ahora completa los detalles de tu denuncia",
          color: "success",
        });
      };
      reader.readAsDataURL(imageFile);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-8 px-4 min-h-screen">
        <h1 className={title()}>Capturar Foto</h1>

        <Card className="w-full max-w-2xl">
          <CardBody className="p-6">
            {!imageSrc ? (
              // Vista de cámara
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      ...videoConstraints,
                      facingMode,
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={capturePhoto}
                    color="primary"
                    size="lg"
                    startContent={<Camera size={20} />}
                    className="font-semibold"
                  >
                    Capturar
                  </Button>
                  <Button
                    onClick={toggleCamera}
                    variant="bordered"
                    size="lg"
                    startContent={<RefreshCw size={20} />}
                  >
                    Cambiar cámara
                  </Button>
                </div>
              </div>
            ) : (
              // Vista previa de la foto
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black">
                  <img 
                    src={imageSrc} 
                    alt="Vista previa" 
                    className="w-full object-contain max-h-[400px]"
                  />
                </div>

                {/* Información de la imagen */}
                {imageDimensions && (
                  <div className="flex justify-center gap-4 text-xs text-default-500">
                    <span>📏 {imageDimensions.width} x {imageDimensions.height} px</span>
                    <span>📦 {(imageFile?.size && (imageFile.size / 1024).toFixed(1))} KB</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    onClick={retakePhoto}
                    variant="bordered"
                    size="lg"
                  >
                    Tomar otra
                  </Button>
                  <Button
                    onClick={continueToForm}
                    color="success"
                    size="lg"
                    endContent={<ArrowRight size={20} />}
                    className="font-semibold"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Tips de privacidad */}
        <div className="text-sm text-default-500 max-w-md text-center">
          <p>🔒 Tu foto será procesada de forma anónima. Se eliminarán todos los metadatos personales.</p>
        </div>
      </section>
    </DefaultLayout>
  );
}