import { useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";
import { title } from "@/components/primitives"; // asegúrate de tener tu helper de estilos
import DefaultLayout from "@/layouts/default";
import { addToast } from "@heroui/toast";

export default function RecorderPage() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const drawLiveWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!recording) return;
      requestAnimationFrame(draw);

      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#4ade80"; // verde
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) =>
      chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorderRef.current.start();
    setRecording(true);
    addToast({
      title: "Grabación iniciada",
      description: "El audio está siendo grabado.",
      color: "primary",
    });

    setPaused(false);
    setSeconds(0);

    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);

    audioContextRef.current = new AudioContext();
    await audioContextRef.current.resume();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    drawLiveWave();
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (!paused) {
      mediaRecorderRef.current.pause();
      setPaused(true);
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

      timerRef.current = window.setInterval(
        () => setSeconds((s) => s + 1),
        1000,
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    addToast({
      title: "Grabación detenida",
      description: "El audio fue guardado correctamente.",
      color: "success",
    });

    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    audioContextRef.current?.close();
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20">
        <h1 className={title()}>Grabador de Audio</h1>

        {!recording
          ? (
            <button
              onClick={startRecording}
              className="flex flex-col items-center"
            >
              <Mic size={32} />
              <span className="text-sm mt-1">Iniciar grabación</span>
            </button>
          )
          : (
            <div className="flex flex-col items-center gap-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={100}
                className="rounded border"
              />
              <span className="text-sm text-gray-400">Tiempo: {seconds}s</span>
              <div className="flex gap-4">
                <button
                  onClick={pauseRecording}
                  className="flex flex-col items-center"
                >
                  {paused ? <Play size={28} /> : <Pause size={28} />}
                  <span className="text-xs">
                    {paused ? "Reanudar" : "Pausar"}
                  </span>
                </button>
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center"
                >
                  <Square size={28} />
                  <span className="text-xs">Detener</span>
                </button>
              </div>
            </div>
          )}

        {audioURL && <audio src={audioURL} controls className="mt-4 w-64" />}
      </section>
    </DefaultLayout>
  );
}
