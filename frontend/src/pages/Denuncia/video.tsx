// src/pages/Denuncia/video.tsx
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Video, Square, RefreshCw, ArrowRight, Trash2 } from "lucide-react";
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

export default function VideoPage() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturing, setCapturing] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!webcamRef.current?.stream) {
      addToast({
        title: "Error",
        description: "No se pudo acceder a la cámara",
        color: "danger",
      });
      return;
    }

    setCapturing(true);
    setSeconds(0);
    setVideoURL(null);
    setVideoFile(null);
    setVideoDuration(0);
    chunksRef.current = [];

    addToast({
      title: "Grabación iniciada",
      description: "El video está siendo grabado.",
      color: "primary",
    });

    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });

    mediaRecorderRef.current.ondataavailable = ({ data }) => {
      if (data.size > 0) {
        chunksRef.current.push(data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      if (chunksRef.current.length) {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `denuncia-${Date.now()}.webm`, { 
          type: "video/webm" 
        });
        
        setVideoURL(url);
        setVideoFile(file);
        setVideoDuration(seconds); // Guardar la duración
        chunksRef.current = [];
      }
    };

    mediaRecorderRef.current.start();
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [seconds]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setCapturing(false);

    addToast({
      title: "Grabación detenida",
      description: "El video fue guardado en memoria.",
      color: "success",
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    addToast({
      title: "Cámara cambiada",
      description: facingMode === "user" ? "Usando cámara trasera" : "Usando cámara frontal",
      color: "primary",
    });
  };

  const clearVideo = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setVideoFile(null);
    setVideoDuration(0);
    addToast({
      title: "Video eliminado",
      description: "La grabación fue borrada.",
      color: "warning",
    });
  };

  const continueToForm = () => {
    if (videoFile) {
      // Guardar el archivo en sessionStorage para pasarlo al formulario
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem('pendingVideo', reader.result as string);
        sessionStorage.setItem('pendingVideoName', videoFile.name);
        sessionStorage.setItem('pendingVideoType', videoFile.type);
        
        // Navegar al formulario con información detallada
        navigate('/denunciar/crear', { 
          state: { 
            mediaType: 'video',
            fileName: videoFile.name,
            fileSize: videoFile.size,
            fileType: videoFile.type,
            duration: videoDuration,
            hasAudio: true, // El video tiene audio
            timestamp: Date.now(),
            source: 'camera'
          }
        });

        addToast({
          title: "Video listo",
          description: "Ahora completa los detalles de tu denuncia",
          color: "success",
        });
      };
      reader.readAsDataURL(videoFile);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-8 px-4 min-h-screen">
        <h1 className={title()}>Grabar Video</h1>

        <Card className="w-full max-w-2xl">
          <CardBody className="p-6">
            {!videoURL ? (
              // Vista de cámara (grabando o lista para grabar)
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    muted={true}
                    videoConstraints={{
                      ...videoConstraints,
                      facingMode,
                    }}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Indicador de grabación */}
                  {capturing && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Grabando {formatTime(seconds)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  {!capturing ? (
                    <>
                      <Button
                        onClick={startRecording}
                        color="primary"
                        size="lg"
                        startContent={<Video size={20} />}
                        className="font-semibold"
                      >
                        Iniciar grabación
                      </Button>
                      <Button
                        onClick={toggleCamera}
                        variant="bordered"
                        size="lg"
                        startContent={<RefreshCw size={20} />}
                      >
                        Cambiar cámara
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      color="danger"
                      size="lg"
                      startContent={<Square size={20} />}
                      className="font-semibold"
                    >
                      Detener grabación
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // Vista previa del video grabado
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black">
                  <video 
                    src={videoURL} 
                    controls 
                    className="w-full aspect-video"
                  />
                </div>

                {/* Información del video */}
                <div className="flex justify-center gap-4 text-xs text-default-500">
                  <span>⏱️ Duración: {formatTime(videoDuration)}</span>
                  <span>📦 {(videoFile?.size && (videoFile.size / (1024 * 1024)).toFixed(2))} MB</span>
                  <span>🎥 {videoFile?.type.split('/')[1]?.toUpperCase()}</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button
                    onClick={clearVideo}
                    variant="bordered"
                    size="lg"
                    startContent={<Trash2 size={20} />}
                  >
                    Borrar
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

        {/* Tips de grabación */}
        <div className="text-sm text-default-500 max-w-md text-center">
          <p>🔒 Tu video será procesado de forma anónima.</p>
          <p className="text-xs mt-1">Duración máxima recomendada: 2 minutos</p>
        </div>
      </section>
    </DefaultLayout>
  );
}