"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Square } from "lucide-react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Dibujar la onda de voz
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx!.fillStyle = "#111";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      ctx!.lineWidth = 2;
      ctx!.strokeStyle = "#4ade80"; // verde
      ctx!.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx!.moveTo(x, y);
        } else {
          ctx!.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx!.lineTo(canvas.width, canvas.height / 2);
      ctx!.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorderRef.current.start();
    setRecording(true);
    setPaused(false);
    setSeconds(0);

    // Timer
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    // Web Audio API para graficar
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);
    drawWaveform();
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (!paused) {
      mediaRecorderRef.current.pause();
      setPaused(true);
    } else {
      mediaRecorderRef.current.resume();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    audioContextRef.current?.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!recording ? (
        <button onClick={startRecording} className="flex flex-col items-center">
          <Mic size={32} />
          <span className="text-sm mt-1">Grabar audio</span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} width={300} height={100} className="bg-black rounded" />
          <span className="text-sm text-gray-400">Tiempo: {seconds}s</span>
          <div className="flex gap-4">
            <button onClick={pauseRecording} className="flex flex-col items-center">
              <Pause size={28} />
              <span className="text-xs">{paused ? "Reanudar" : "Pausar"}</span>
            </button>
            <button onClick={stopRecording} className="flex flex-col items-center">
              <Square size={28} />
              <span className="text-xs">Detener</span>
            </button>
          </div>
        </div>
      )}

      {audioURL && (
        <audio src={audioURL} controls className="mt-4 w-64" />
      )}
    </div>
  );
}
