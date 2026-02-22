// src/pages/Denuncia/denuncia-exitosa.tsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Share2, 
  Download,
  Twitter,
  Facebook,
  Linkedin,
  Clock,
  Shield,
  Globe,
  FileText,
  Image,
  Video,
  Mic
} from "lucide-react";
import { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { addToast } from "@heroui/toast";
import { motion } from "motion/react";

// Configuración del explorador según entorno
const EXPLORER_URL = process.env.NODE_ENV === 'production'
  ? 'https://explorer.rikuychain.io/tx'
  : 'http://localhost:4000/tx';

export default function DenunciaExitosaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay datos, redirigir al inicio después de 2 segundos
    if (!data) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [data, navigate]);

  if (!data) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <p className="text-default-500">No hay información de denuncia disponible.</p>
          <p className="text-sm text-default-400 mt-2">Redirigiendo al inicio...</p>
        </section>
      </DefaultLayout>
    );
  }

  const copyToClipboard = (text: string, label: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    addToast({
      title: "¡Copiado!",
      description: `${label} copiado al portapapeles`,
      color: "success",
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleString('es-BO', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  };

  const shareOnTwitter = () => {
    const text = `Acabo de realizar una denuncia anónima en @rikuy_app. Mi reporte está verificado y registrado en blockchain. #Rikuy #Justicia #Anonimato`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=https://rikuyapp.com/denuncia/${data.reportId}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const text = `Denuncia anónima registrada en Rikuy - Plataforma de justicia ciudadana`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://rikuyapp.com/denuncia/${data.reportId}&title=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadReceipt = () => {
    const receipt = {
      reportId: data.reportId,
      fecha: formatDate(),
      categoria: data.category || 'No especificada',
      ipfs: data.ipfsHash || null,
      transaction: data.txHash || null,
      red: 'Rikuy Chain L3',
      archivos: data.fileCount || 1,
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denuncia-${data.reportId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      title: "Comprobante descargado",
      description: "Guarda este archivo como respaldo",
      color: "success",
    });
  };

  const getFileIcon = () => {
    if (data.fileCount > 1) return <FileText size={24} className="text-primary-500" />;
    if (data.source === 'photo') return <Image size={24} className="text-blue-500" />;
    if (data.source === 'video') return <Video size={24} className="text-purple-500" />;
    if (data.source === 'audio') return <Mic size={24} className="text-green-500" />;
    return <FileText size={24} className="text-orange-500" />;
  };

  return (
    <DefaultLayout>
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 py-8 md:py-12 px-4 min-h-screen"
      >
        {/* Header con animación - Responsive */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-4 w-full max-w-2xl"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-2xl scale-150" />
            <CheckCircle size={80} className="text-success-500 relative z-10 md:w-[100px] md:h-[100px]" />
          </div>
          <h1 className={title()}>¡Denuncia Exitosa!</h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Chip color="success" variant="flat" size="md" className="text-sm md:text-base">
              {formatDate()}
            </Chip>
            <Chip color="primary" variant="flat" size="md" className="text-sm md:text-base">
              #{data.reportId.slice(0, 8)}
            </Chip>
          </div>
          <p className="text-center text-default-600 max-w-lg px-2 text-sm md:text-base">
            Tu denuncia ha sido registrada de forma anónima y segura en IPFS y Rikuy Chain.
          </p>
        </motion.div>

        {/* Grid de tarjetas - Responsive */}
        <div className="w-full max-w-3xl space-y-4 mt-4">
          {/* Resumen rápido - Responsive */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-success-500">
              <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-full flex-shrink-0">
                    {getFileIcon()}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-default-500">Categoría</p>
                    <p className="text-xl md:text-2xl font-bold text-success-600 break-words">
                      {data.category || 'No especificada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto justify-between sm:justify-end">
                  <Chip size="sm" color="primary" variant="flat" className="text-xs">
                    {data.fileCount || 1} {data.fileCount === 1 ? 'archivo' : 'archivos'}
                  </Chip>
                  <p className="text-xs text-default-400 hidden sm:block">ID: {data.reportId.slice(0, 16)}...</p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Redes de almacenamiento - Grid responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID del Reporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              <Card className="h-full">
                <CardHeader className="pb-0 flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-primary-500 flex-shrink-0" />
                    <h3 className="text-base md:text-lg font-semibold">ID del Reporte</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-xs text-default-500 mb-2">
                    Identificador único de tu denuncia
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-default-100 dark:bg-default-800 p-2 rounded flex-1 overflow-x-auto">
                      {data.reportId}
                    </code>
                    <Button
                      isIconOnly
                      size="sm"
                      variant={copiedItem === 'reportId' ? "solid" : "light"}
                      color={copiedItem === 'reportId' ? "success" : "default"}
                      onClick={() => copyToClipboard(data.reportId, "ID del reporte", "reportId")}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* IPFS (reemplaza Arkiv) */}
            {data.ipfsHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                <Card className="h-full border-l-4 border-blue-500">
                  <CardHeader className="pb-0 flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <Globe size={20} className="text-blue-500 flex-shrink-0" />
                      <h3 className="text-base md:text-lg font-semibold">IPFS (Pinata)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-default-500 mb-2">
                      Tu evidencia está disponible en la red IPFS
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-default-100 dark:bg-default-800 p-2 rounded flex-1 overflow-x-auto">
                        {data.ipfsHash}
                      </code>
                      <Button
                        isIconOnly
                        size="sm"
                        variant={copiedItem === 'ipfs' ? "solid" : "light"}
                        color={copiedItem === 'ipfs' ? "success" : "default"}
                        onClick={() => copyToClipboard(data.ipfsHash, "Hash IPFS", "ipfs")}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                    <Button
                      as="a"
                      href={`https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="flat"
                      color="primary"
                      fullWidth
                      className="mt-2 text-xs"
                      endContent={<ExternalLink size={14} />}
                    >
                      Ver en IPFS
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Blockchain */}
            {data.txHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full md:col-span-2"
              >
                <Card className="h-full border-l-4 border-green-500">
                  <CardHeader className="pb-0 flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <Shield size={20} className="text-green-500 flex-shrink-0" />
                      <h3 className="text-base md:text-lg font-semibold">Rikuy Chain (L3)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-default-500 mb-2">
                      Registro verificable en blockchain, inmutable y público
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <code className="text-xs bg-default-100 dark:bg-default-800 p-2 rounded flex-1 overflow-x-auto">
                        {data.txHash}
                      </code>
                      <Button
                        isIconOnly
                        size="sm"
                        variant={copiedItem === 'tx' ? "solid" : "light"}
                        color={copiedItem === 'tx' ? "success" : "default"}
                        onClick={() => copyToClipboard(data.txHash, "Hash de transacción", "tx")}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                    <Button
                      as="a"
                      href={`${EXPLORER_URL}/${data.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="flat"
                      color="success"
                      fullWidth
                      className="text-xs"
                      endContent={<ExternalLink size={14} />}
                    >
                      Ver en Explorer
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Línea de tiempo - Responsive */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-default-500" />
                  <h3 className="text-base md:text-lg font-semibold">Línea de tiempo</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 justify-between">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-default-400">Creación</p>
                    <p className="text-sm font-semibold">{formatDate()}</p>
                  </div>
                  <Divider orientation="vertical" className="hidden sm:block h-10" />
                  <Divider className="block sm:hidden" />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-default-400">Almacenamiento</p>
                    <p className="text-sm font-semibold">IPFS</p>
                  </div>
                  <Divider orientation="vertical" className="hidden sm:block h-10" />
                  <Divider className="block sm:hidden" />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-default-400">Blockchain</p>
                    <p className="text-sm font-semibold">Confirmada</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Acciones adicionales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {/* Botones de compartir */}
            <Card>
              <CardHeader className="flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Share2 size={20} className="text-default-500" />
                  <h3 className="text-base md:text-lg font-semibold">Compartir</h3>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-default-500 mb-3">
                  Ayuda a dar visibilidad a tu denuncia (tu identidad permanece anónima)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Twitter size={16} />}
                    onClick={shareOnTwitter}
                    className="flex-1 min-w-[100px] text-xs"
                  >
                    Twitter
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Facebook size={16} />}
                    onClick={shareOnFacebook}
                    className="flex-1 min-w-[100px] text-xs"
                  >
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Linkedin size={16} />}
                    onClick={shareOnLinkedIn}
                    className="flex-1 min-w-[100px] text-xs"
                  >
                    LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Download size={16} />}
                    onClick={downloadReceipt}
                    className="flex-1 min-w-[100px] text-xs"
                  >
                    Comprobante
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Información de privacidad */}
            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-200 dark:border-primary-800">
              <CardBody>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-primary-600 flex-shrink-0" />
                  <span>Tu privacidad está garantizada</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span>Identidad anónima</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span>Pruebas ZK</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span>Ubicación aproximada</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span>Datos inmutables</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Botones de navegación - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                as={Link}
                to="/denunciar"
                color="primary"
                variant="solid"
                fullWidth
                size="lg"
                className="text-sm md:text-base"
              >
                Hacer otra denuncia
              </Button>
              <Button
                as={Link}
                to="/perfil"
                color="secondary"
                variant="bordered"
                fullWidth
                size="lg"
                className="text-sm md:text-base"
              >
                Ver mis denuncias
              </Button>
              <Button
                as={Link}
                to="/"
                color="default"
                variant="flat"
                fullWidth
                size="lg"
                className="text-sm md:text-base"
              >
                Volver al inicio
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </DefaultLayout>
  );
}