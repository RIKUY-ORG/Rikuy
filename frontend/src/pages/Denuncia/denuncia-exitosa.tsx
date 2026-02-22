// src/pages/denuncia-exitosa/index.tsx
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
  Database,
  FileText,
  Award
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
        <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
          <div className="text-center">
            <p className="text-default-500">No hay información de denuncia disponible.</p>
            <p className="text-sm text-default-400 mt-2">Redirigiendo al inicio...</p>
          </div>
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
      arkiv: data.arkivHash || null,
      transaction: data.txHash || null,
      red: 'Rikuy Chain L3',
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

  return (
    <DefaultLayout>
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 py-12 md:py-20 px-4"
      >
        {/* Header con animación */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-4 max-w-2xl"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-2xl" />
            <CheckCircle size={100} className="text-success-500 relative z-10" />
          </div>
          <h1 className={title()}>¡Denuncia Exitosa!</h1>
          <div className="flex items-center gap-2">
            <Chip color="success" variant="flat" size="lg">
              {formatDate()}
            </Chip>
            <Chip color="primary" variant="flat" size="lg">
              #{data.reportId.slice(0, 8)}
            </Chip>
          </div>
          <p className="text-center text-default-600 max-w-lg">
            Tu denuncia ha sido registrada de forma anónima y segura en múltiples redes descentralizadas.
            Los siguientes identificadores garantizan su integridad y permanencia.
          </p>
        </motion.div>

        {/* Grid de tarjetas */}
        <div className="w-full max-w-3xl space-y-4 mt-4">
          {/* Resumen rápido */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-success-500">
              <CardBody className="flex flex-row items-center gap-4 p-4">
                <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-full">
                  <Award size={24} className="text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Categoría</p>
                  <p className="text-2xl font-bold text-success-600">{data.category || 'No especificada'}</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-default-400">ID: {data.reportId.slice(0, 16)}...</p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Redes de almacenamiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID del Reporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-primary-500" />
                    <h3 className="text-lg font-semibold">ID del Reporte</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-xs text-default-500 mb-2">
                    Identificador único de tu denuncia en el sistema
                  </p>
                  <div className="flex items-center gap-2">
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

            {/* IPFS */}
            {data.ipfsHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full border-l-4 border-blue-500">
                  <CardHeader className="pb-0">
                    <div className="flex items-center gap-2">
                      <Globe size={20} className="text-blue-500" />
                      <h3 className="text-lg font-semibold">IPFS (Pinata)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-default-500 mb-2">
                      Tu evidencia está disponible en la red IPFS para acceso descentralizado
                    </p>
                    <div className="flex items-center gap-2 mb-2">
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
                    {data.imageUrl && (
                      <Button
                        as="a"
                        href={data.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="flat"
                        color="primary"
                        fullWidth
                        endContent={<ExternalLink size={14} />}
                      >
                        Ver evidencia en IPFS
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Arkiv */}
            {data.arkivHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="h-full border-l-4 border-purple-500">
                  <CardHeader className="pb-0">
                    <div className="flex items-center gap-2">
                      <Database size={20} className="text-purple-500" />
                      <h3 className="text-lg font-semibold">Arkiv (Almacenamiento Inmutable)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-default-500 mb-2">
                      Tus datos están guardados de forma inmutable por 10 años
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-default-100 dark:bg-default-800 p-2 rounded flex-1 overflow-x-auto">
                        {data.arkivHash}
                      </code>
                      <Button
                        isIconOnly
                        size="sm"
                        variant={copiedItem === 'arkiv' ? "solid" : "light"}
                        color={copiedItem === 'arkiv' ? "success" : "default"}
                        onClick={() => copyToClipboard(data.arkivHash, "Hash Arkiv", "arkiv")}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {/* Blockchain */}
            {data.txHash && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full border-l-4 border-green-500">
                  <CardHeader className="pb-0">
                    <div className="flex items-center gap-2">
                      <Shield size={20} className="text-green-500" />
                      <h3 className="text-lg font-semibold">Rikuy Chain (L3)</h3>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-default-500 mb-2">
                      Registro verificable en blockchain, inmutable y público
                    </p>
                    <div className="flex items-center gap-2 mb-2">
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
                      endContent={<ExternalLink size={14} />}
                    >
                      Ver en Explorer
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Línea de tiempo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-default-500" />
                  <h3 className="text-lg font-semibold">Línea de tiempo</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-4 justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-default-400">Creación</p>
                    <p className="font-semibold">{formatDate()}</p>
                  </div>
                  <Divider orientation="vertical" className="h-10" />
                  <div className="flex-1">
                    <p className="text-xs text-default-400">Almacenamiento</p>
                    <p className="font-semibold">IPFS + Arkiv</p>
                  </div>
                  <Divider orientation="vertical" className="h-10" />
                  <div className="flex-1">
                    <p className="text-xs text-default-400">Blockchain</p>
                    <p className="font-semibold">Confirmada</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Acciones adicionales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            {/* Botones de compartir */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Share2 size={20} className="text-default-500" />
                  <h3 className="text-lg font-semibold">Compartir</h3>
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
                  >
                    Twitter
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Facebook size={16} />}
                    onClick={shareOnFacebook}
                  >
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Linkedin size={16} />}
                    onClick={shareOnLinkedIn}
                  >
                    LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    startContent={<Download size={16} />}
                    onClick={downloadReceipt}
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
                  <Shield size={20} className="text-primary-600" />
                  Tu privacidad está garantizada
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5" />
                    <span>Tu identidad real nunca se revela</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5" />
                    <span>Solo se usa prueba ZK (conocimiento cero)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5" />
                    <span>Ubicación aproximada ~200m</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-success-500 mt-0.5" />
                    <span>Datos inmutables y verificables</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Botones de navegación */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                as={Link}
                to="/denunciar"
                color="primary"
                variant="solid"
                fullWidth
                size="lg"
              >
                Hacer otra denuncia
              </Button>
              <Button
                as={Link}
                to="/mis-denuncias"
                color="secondary"
                variant="bordered"
                fullWidth
                size="lg"
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