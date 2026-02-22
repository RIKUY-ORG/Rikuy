// src/pages/Denuncia/index.tsx
import DefaultLayout from "@/layouts/default";
import { useIdentity } from '@/context/identityContext';
import { title } from "@/components/primitives";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { FaCamera, FaVideo, FaMicrophone, FaFileAlt, FaImage, FaFilePdf, FaMusic, FaUpload } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Shield, Clock, Globe, Users } from "lucide-react";

export default function DenunciarPage() {
  const { isVerified, isLoading } = useIdentity();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-8 md:py-12 px-4">
        {/* Header */}
        <div className="inline-block max-w-2xl text-center">
          <h1 className={title()}>Denunciar</h1>
          <p className="mt-4 text-base md:text-lg text-default-600">
            Elige cómo quieres adjuntar tu evidencia. Tu identidad está protegida
            mientras tu denuncia queda registrada para siempre en Rikuy Chain.
          </p>
        </div>

        {/* Recordatorio de seguridad */}
        <div className="w-full max-w-5xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Tu anonimato está garantizado</h2>
              <p className="text-white/90 text-sm">
                Todos los archivos se limpian de metadatos antes de subirse.
                Nadie, ni siquiera Rikuy, puede rastrear tu identidad.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de opciones principales */}
        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">¿Qué tipo de evidencia deseas adjuntar?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Captura en vivo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-default-700 flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                Capturar ahora
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Foto */}
                <Card as={Link} to="/denunciar/foto" className="group hover:scale-105 transition-all duration-300 cursor-pointer" isPressable>
                  <CardBody className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                      <FaCamera className="text-2xl text-white" />
                    </div>
                    <p className="font-semibold">Tomar foto</p>
                    <p className="text-xs text-default-500 mt-1">Cámara en vivo</p>
                  </CardBody>
                </Card>

                {/* Video */}
                <Card as={Link} to="/denunciar/video" className="group hover:scale-105 transition-all duration-300 cursor-pointer" isPressable>
                  <CardBody className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                      <FaVideo className="text-2xl text-white" />
                    </div>
                    <p className="font-semibold">Grabar video</p>
                    <p className="text-xs text-default-500 mt-1">Video en tiempo real</p>
                  </CardBody>
                </Card>

                {/* Audio */}
                <Card as={Link} to="/denunciar/audio" className="group hover:scale-105 transition-all duration-300 cursor-pointer" isPressable>
                  <CardBody className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3 group-hover:shadow-lg transition-all">
                      <FaMicrophone className="text-2xl text-white" />
                    </div>
                    <p className="font-semibold">Grabar audio</p>
                    <p className="text-xs text-default-500 mt-1">Testimonio verbal</p>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Subir archivos existentes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-default-700 flex items-center gap-2">
                <Globe size={18} className="text-success-500" />
                Subir archivos
              </h3>

              <Card as={Link} to="/denunciar/subir" className="group hover:scale-105 transition-all duration-300 cursor-pointer" isPressable>
                <CardBody className="flex flex-col items-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:shadow-xl transition-all">
                    <FaUpload className="text-3xl text-white" />
                  </div>
                  <p className="text-xl font-semibold mb-2">Subir archivos</p>
                  <p className="text-sm text-default-500 max-w-xs">
                    Selecciona archivos de tu dispositivo
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Chip size="sm" variant="flat" color="primary" startContent={<FaImage className="mr-1" />}>
                      JPG, PNG
                    </Chip>
                    <Chip size="sm" variant="flat" color="primary" startContent={<FaFilePdf className="mr-1" />}>
                      PDF
                    </Chip>
                    <Chip size="sm" variant="flat" color="primary" startContent={<FaVideo className="mr-1" />}>
                      MP4
                    </Chip>
                    <Chip size="sm" variant="flat" color="primary" startContent={<FaMusic className="mr-1" />}>
                      MP3, WAV
                    </Chip>
                    <Chip size="sm" variant="flat" color="primary" startContent={<FaFileAlt className="mr-1" />}>
                      TXT
                    </Chip>
                    <Chip size="sm" variant="flat" color="secondary">Max 25MB</Chip>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Sección de ayuda */}
        <div className="w-full max-w-6xl mt-12">
          <Divider className="mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estadísticas */}
            <div className="bg-default-50 dark:bg-default-100/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Shield size={20} className="text-primary-600" />
                </div>
                <h3 className="font-semibold">Protegido</h3>
              </div>
              <p className="text-sm text-default-600">
                Tu identidad nunca se revela. Usamos pruebas ZK para verificar tu ciudadanía sin exponer tus datos.
              </p>
            </div>

            <div className="bg-default-50 dark:bg-default-100/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <Clock size={20} className="text-success-600" />
                </div>
                <h3 className="font-semibold">Rápido</h3>
              </div>
              <p className="text-sm text-default-600">
                Todo el proceso toma menos de 5 minutos. Sin burocracia, sin esperas.
              </p>
            </div>

            <div className="bg-default-50 dark:bg-default-100/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                  <Users size={20} className="text-warning-600" />
                </div>
                <h3 className="font-semibold">Comunitario</h3>
              </div>
              <p className="text-sm text-default-600">
                Tu denuncia será verificada por la comunidad y atendida por aliados (ONGs, periodistas, abogados).
              </p>
            </div>
          </div>
        </div>

        {/* Recordatorio de verificación */}
        {!isLoading && !isVerified && (
          <div className="w-full max-w-6xl mt-8 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-warning-600 text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-warning-700 dark:text-warning-300">
                  Necesitas verificar tu identidad primero
                </p>
                <p className="text-sm text-default-600 mt-1">
                  Para denunciar, debes verificar que eres ciudadano boliviano.
                  Este proceso usa tecnología Zero-Knowledge para proteger tu privacidad.
                </p>
                <Button
                  as={Link}
                  to="/verificar-identidad"
                  color="warning"
                  size="sm"
                  className="mt-3"
                  variant="flat"
                >
                  Verificar mi identidad
                </Button>
              </div>
            </div>
          </div>)}
      </section>
    </DefaultLayout>
  );
}