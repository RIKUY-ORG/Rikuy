import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Download, RefreshCw, Square, Trash2, Video } from "lucide-react";
import { title } from "@/components/primitives"; // asegúrate de tener tu helper de estilos
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";

const videoConstraints = {
  width: 1280,
  height: 720,
};

export default function VideoPage() {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [capturing, setCapturing] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // 👉 usamos ref para chunks
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!webcamRef.current?.stream) return;
    setCapturing(true);
    addToast({
      title: "Grabación iniciada",
      description: "El video está siendo grabado.",
      color: "primary",
    });

    setSeconds(0);
    setVideoURL(null);
    chunksRef.current = [];

    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream!, {
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
        setVideoURL(URL.createObjectURL(blob));
        chunksRef.current = [];
      }
    };

    mediaRecorderRef.current.start();
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setCapturing(false);
    addToast({
      title: "Grabación detenida",
      description: "El video fue guardado en memoria.",
      color: "success",
    });

    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleDownload = useCallback(() => {
    if (videoURL) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = videoURL;
      a.download = "capture.webm";
      document.body.appendChild(a);
      a.click();
      addToast({
        title: "Video descargado",
        description: "Tu grabación se descargó correctamente.",
        color: "success",
      });

      window.URL.revokeObjectURL(videoURL);
      setVideoURL(null);
    }
  }, [videoURL]);

  const handleClear = useCallback(() => {
    setVideoURL(null);
    addToast({
      title: "Video eliminado",
      description: "La grabación fue borrada.",
      color: "warning",
    });

    chunksRef.current = [];
  }, []);

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
        <h1 className={title()}>Grabación de Video</h1>

        <div className="flex flex-col items-center gap-4">
          <Webcam
            ref={webcamRef}
            audio={true}
            muted={true}
            width={720}
            height={360}
            videoConstraints={{
              ...videoConstraints,
              facingMode,
            }}
            className="rounded border"
          />

          <div className="flex gap-4">
            {!capturing
              ? (
                <button
                  onClick={startRecording}
                  className="flex flex-col items-center"
                >
                  <Video size={32} />
                  <span className="text-xs">Iniciar</span>
                </button>
              )
              : (
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center"
                >
                  <Square size={32} />
                  <span className="text-xs">Detener</span>
                </button>
              )}
            <button
              onClick={toggleCamera}
              className="flex flex-col items-center"
            >
              <RefreshCw size={28} />
              <span className="text-xs">Cambiar cámara</span>
            </button>
          </div>

          {capturing && (
            <span className="text-sm text-gray-400">Tiempo: {seconds}s</span>
          )}
        </div>

        {videoURL && (
          <div className="flex flex-col items-center mt-6 gap-2">
            <video
              src={videoURL}
              controls
              className="rounded w-full max-w-md border"
            />
            <div className="flex gap-4 mt-2">
              <button
                onClick={handleDownload}
                className="flex flex-col items-center"
              >
                <Download size={28} />
                <span className="text-xs">Descargar</span>
              </button>
              <button
                onClick={handleClear}
                className="flex flex-col items-center"
              >
                <Trash2 size={28} />
                <span className="text-xs">Borrar</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
