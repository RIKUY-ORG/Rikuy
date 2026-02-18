import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Square, Send, Loader2 } from "lucide-react";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { usePrivy } from "@privy-io/react-auth";
import { RIKUY_CONFIG, STORAGE_KEYS } from "@/config/rikuy";

const videoConstraints = {
  width: 1280,
  height: 720,
};

export default function PhotoPage() {
  const navigate = useNavigate();
  const { user } = usePrivy();
  const webcamRef = useRef<Webcam>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

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

  const handleSubmit = async () => {
    if (!imageSrc) {
      addToast({
        title: "Error",
        description: "Primero debes capturar una foto",
        color: "danger",
      });
      return;
    }

    if (!user?.wallet?.address) {
      addToast({
        title: "Error",
        description: "No se encontró tu wallet",
        color: "danger",
      });
      return;
    }

    // Verificar que el usuario esta verificado
    const isVerified = localStorage.getItem(STORAGE_KEYS.VERIFIED);
    if (!isVerified) {
      addToast({
        title: "Error",
        description: "Debes verificar tu identidad antes de denunciar",
        color: "danger",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Paso 1: Obtener ubicación
      setUploadStatus("Obteniendo tu ubicación...");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const location = {
        lat: position.coords.latitude,
        long: position.coords.longitude,
        accuracy: position.coords.accuracy || 10,
      };

      // Paso 2: Convertir imagen base64 a blob
      setUploadStatus("Verificando imagen con IA...");
      const blob = await fetch(imageSrc).then(r => r.blob());

      // Paso 3: Preparar FormData
      const formData = new FormData();
      formData.append('photo', blob, 'denuncia.jpg');
      formData.append('category', '0');
      formData.append('description', 'Denuncia anónima');
      formData.append('location', JSON.stringify(location));

      // Paso 4: Enviar al backend (commitment y nullifier se generan en el backend)
      setUploadStatus("Subiendo a IPFS, Arkiv y Blockchain...");
      const response = await fetch(`${RIKUY_CONFIG.BACKEND_API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'x-user-address': user.wallet.address,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al crear la denuncia');
      }

      addToast({
        title: "¡Denuncia exitosa!",
        description: "Tu denuncia fue registrada en blockchain",
        color: "success",
      });

      navigate('/denuncia-exitosa', {
        state: {
          reportId: result.reportId,
          txHash: result._internal?.txHash,
          mensaje: result.mensaje,
        }
      });

    } catch (error: any) {
      console.error('Error al enviar denuncia:', error);
      addToast({
        title: "Error",
        description: error.message || "No se pudo enviar la denuncia. Intenta de nuevo.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <h1 className={title()}>Captura de Foto</h1>

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 gap-4">
            <Loader2 className="animate-spin text-white" size={64} />
            <p className="text-white text-xl font-semibold">{uploadStatus}</p>
            <p className="text-white/70 text-sm">No cierres esta ventana...</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {!imageSrc && (
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
          )}

          {imageSrc && (
            <img
              src={imageSrc}
              alt="captura"
              className="rounded w-full max-w-md border"
            />
          )}

          <div className="flex gap-4">
            {!imageSrc ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="flex flex-col items-center p-4 hover:bg-default-100 rounded-lg transition"
                >
                  <Camera size={32} />
                  <span className="text-xs mt-1">Capturar</span>
                </button>
                <button
                  onClick={toggleCamera}
                  className="flex flex-col items-center p-4 hover:bg-default-100 rounded-lg transition"
                >
                  <RefreshCw size={28} />
                  <span className="text-xs mt-1">Cambiar cámara</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={clearPhoto}
                  className="flex flex-col items-center p-4 hover:bg-default-100 rounded-lg transition"
                >
                  <Square size={28} />
                  <span className="text-xs mt-1">Borrar</span>
                </button>
                <Button
                  onClick={handleSubmit}
                  color="success"
                  size="lg"
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Send size={20} />
                  Enviar Denuncia
                </Button>
              </>
            )}
          </div>
        </div>

        {imageSrc && !isSubmitting && (
          <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg max-w-md text-center">
            <p className="text-sm font-semibold mb-2">¿Qué pasará al enviar?</p>
            <ul className="text-xs text-left space-y-1">
              <li>✅ IA verificará que la imagen sea apropiada</li>
              <li>✅ Se subirá a IPFS (Pinata) para acceso rápido</li>
              <li>✅ Se guardará en Arkiv por 10 años</li>
              <li>✅ Se registrará en Rikuy Chain (blockchain)</li>
              <li>✅ Tu identidad permanecerá 100% anónima</li>
            </ul>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
