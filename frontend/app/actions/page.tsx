import { Camera, Mic, Video } from "lucide-react";
import { title, subtitle } from "@/components/primitives";
import Link from "next/link";

export default function ActionsPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <h1 className={title()}>Acciones</h1>
      <p className={subtitle({ class: "text-center max-w-md" })}>
        Elige cómo quieres reportar: fotografía, video corto o audio. Tu identidad estará protegida.
      </p>

      <div className="flex justify-center gap-12 mt-8">
        {/* Botón que lleva a la pantalla de grabación de audio */}
        <Link href="/actions/recorder" className="flex flex-col items-center">
          <Mic size={32} />
          <span className="text-sm mt-1">Audio</span>
        </Link>

        {/* Botón que lleva a la pantalla de captura de foto */}
        <Link href="/actions/photo" className="flex flex-col items-center">
          <Camera size={48} />
          <span className="text-sm mt-1">Foto</span>
        </Link>

        {/* Botón que lleva a la pantalla de captura de video */}
        <Link href="/actions/video" className="flex flex-col items-center">
          <Video size={32} />
          <span className="text-sm mt-1">Video</span>
        </Link>
      </div>
    </section>
  );
}
