// src/pages/Denuncia/audio.tsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Pause, Play, Square, ArrowRight, Trash2 } from "lucide-react";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { LiveAudioVisualizer } from 'react-audio-visualize';
import { AudioVisualizer } from 'react-audio-visualize';

export default function RecorderPage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        if (chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          const file = new File([blob], `denuncia-${Date.now()}.webm`, { 
            type: "audio/webm" 
          });
          
          setAudioURL(url);
          setAudioFile(file);
          setAudioDuration(seconds); // Guardar la duración
          chunksRef.current = [];
        }
      };

      recorder.start();
      setRecording(true);
      setPaused(false);
      setSeconds(0);
      setAudioURL(null);
      setAudioFile(null);
      setCurrentPlaybackTime(0);
      setIsPlaying(false);
      setAudioDuration(0);

      addToast({
        title: "Grabación iniciada",
        description: "El audio está siendo grabado.",
        color: "primary",
      });

      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      addToast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Permite el acceso.",
        color: "danger",
      });
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (!paused) {
      mediaRecorderRef.current.pause();
      setPaused(true);
      addToast({
        title: "Grabación pausada",
        description: "La grabación de audio fue pausada.",
        color: "warning",
      });

      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      mediaRecorderRef.current.resume();
      setPaused(false);
      addToast({
        title: "Grabación reanudada",
        description: "La grabación de audio continúa.",
        color: "primary",
      });

      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setRecording(false);
    setPaused(false);
    
    addToast({
      title: "Grabación detenida",
      description: "El audio fue guardado correctamente.",
      color: "success",
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Detener tracks del stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const clearAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioFile(null);
    setCurrentPlaybackTime(0);
    setIsPlaying(false);
    setAudioDuration(0);
    addToast({
      title: "Audio eliminado",
      description: "La grabación fue borrada.",
      color: "warning",
    });
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const continueToForm = () => {
    if (audioFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem('pendingAudio', reader.result as string);
        sessionStorage.setItem('pendingAudioName', audioFile.name);
        sessionStorage.setItem('pendingAudioType', audioFile.type);
        
        // Navegar al formulario con información detallada
        navigate('/denunciar/crear', { 
          state: { 
            mediaType: 'audio',
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type,
            duration: audioDuration,
            timestamp: Date.now(),
            source: 'microphone'
          }
        });

        addToast({
          title: "Audio listo",
          description: "Ahora completa los detalles de tu denuncia",
          color: "success",
        });
      };
      reader.readAsDataURL(audioFile);
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
        <h1 className={title()}>Grabar Audio</h1>

        <Card className="w-full max-w-2xl">
          <CardBody className="p-6">
            {!audioURL ? (
              // Vista de grabación con visualizador en vivo
              <div className="space-y-6">
                {/* Visualizador de ondas en vivo */}
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 h-32 flex items-center justify-center">
                  {mediaRecorder && recording && (
                    <LiveAudioVisualizer
                      mediaRecorder={mediaRecorder}
                      width={500}
                      height={100}
                      barWidth={2}
                      gap={1}
                      barColor="#3b82f6"
                    />
                  )}
                  {!recording && !audioURL && (
                    <div className="text-center text-default-400">
                      <Mic size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Presiona "Iniciar grabación" para comenzar</p>
                    </div>
                  )}
                </div>

                {/* Temporizador */}
                {recording && (
                  <div className="text-center">
                    <span className="text-2xl font-mono">{formatTime(seconds)}</span>
                    {paused && (
                      <span className="ml-2 text-yellow-500 text-sm">(Pausado)</span>
                    )}
                  </div>
                )}

                {/* Controles */}
                <div className="flex justify-center gap-4">
                  {!recording ? (
                    <Button
                      onClick={startRecording}
                      color="primary"
                      size="lg"
                      startContent={<Mic size={20} />}
                      className="font-semibold"
                    >
                      Iniciar grabación
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={pauseRecording}
                        color="warning"
                        variant="bordered"
                        size="lg"
                        startContent={paused ? <Play size={20} /> : <Pause size={20} />}
                      >
                        {paused ? "Reanudar" : "Pausar"}
                      </Button>
                      <Button
                        onClick={stopRecording}
                        color="danger"
                        size="lg"
                        startContent={<Square size={20} />}
                        className="font-semibold"
                      >
                        Detener
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Vista previa del audio grabado con visualizador de reproducción
              <div className="space-y-4">
                {/* Reproductor de audio oculto para control */}
                <audio
                  ref={audioRef}
                  src={audioURL}
                  onTimeUpdate={(e) => setCurrentPlaybackTime(e.currentTarget.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* Visualizador de ondas durante reproducción */}
                <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 h-32">
                  <AudioVisualizer
                    blob={audioFile!}
                    width={500}
                    height={100}
                    barWidth={2}
                    gap={1}
                    barColor="#3b82f6"
                    barPlayedColor="#10b981"
                    currentTime={currentPlaybackTime}
                  />
                </div>

                {/* Información del audio */}
                <div className="flex justify-center gap-4 text-xs text-default-500">
                  <span>⏱️ Duración: {formatTime(audioDuration)}</span>
                  <span>📦 {(audioFile?.size && (audioFile.size / (1024 * 1024)).toFixed(2))} MB</span>
                  <span>🎵 {audioFile?.type.split('/')[1]?.toUpperCase()}</span>
                </div>

                {/* Controles de reproducción */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={togglePlayback}
                    color="primary"
                    variant="bordered"
                    size="lg"
                    startContent={isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  >
                    {isPlaying ? "Pausar" : "Reproducir"}
                  </Button>
                  <span className="text-sm font-mono">
                    {formatTime(currentPlaybackTime)} / {formatTime(audioDuration)}
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                  <Button
                    onClick={clearAudio}
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
          <p>🔒 Tu audio será procesado de forma anónima.</p>
          <p className="text-xs mt-1">Duración máxima recomendada: 5 minutos</p>
        </div>
      </section>
    </DefaultLayout>
  );
}