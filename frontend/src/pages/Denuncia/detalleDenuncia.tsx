// src/pages/Denuncia/detalleDenuncia.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Eliminamos useNavigate
import { motion } from "motion/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { 
  FileText, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Image,
  Video,
  Mic,
  Users,
  ArrowLeft,
  Share2,
  MessageCircle,
  Eye,
  ThumbsUp,
  Copy,
  Calendar,
  ExternalLink
} from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { CATEGORY_NAMES, type CategoryKey } from "@/config/rikuy";
import { addToast } from "@heroui/toast";
import { useAvatarContext } from "@/context/avatarContext";

// Tipos para la denuncia detallada
interface DenunciaDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  descripcionDetallada: string;
  categoria: CategoryKey;
  ubicacion: {
    ciudad: string;
    departamento: string;
    direccion?: string;
    lat?: number;
    lng?: number;
  };
  fecha: string;
  fechaIncidente: string;
  evidencia: Array<{
    tipo: 'photo' | 'video' | 'audio' | 'document';
    url: string;
    nombre: string;
    tamaño?: number;
  }>;
  estado: 'verificada' | 'pendiente' | 'en_revision';
  verificaciones: {
    total: number;
    positivas: number;
    negativas: number;
  };
  comentarios: Array<{
    id: string;
    autor: string;
    tipo: 'ciudadano' | 'aliado';
    avatar?: any;
    fecha: string;
    texto: string;
    verificaciones?: number;
  }>;
  aliadosInteresados: Array<{
    nombre: string;
    tipo: string;
    avatar?: any;
  }>;
  autor: {
    tipo: 'ciudadano' | 'comunidad';
    nombre: string;
    avatar?: any;
    nivel?: string;
  };
  metadata: {
    ipfsHash?: string;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: number;
  };
}

// Mock de datos para una denuncia específica
const getDenunciaMock = (id: string): DenunciaDetalle | null => {
  const baseDenuncias: Record<string, DenunciaDetalle> = {
    "DEN-001": {
      id: "DEN-001",
      titulo: "Bache peligroso en avenida principal",
      descripcion: "Hace 3 meses que hay un bache que ha causado múltiples accidentes.",
      descripcionDetallada: "El bache se encuentra en la avenida principal, frente al mercado central. Tiene aproximadamente 2 metros de diámetro y 30 cm de profundidad. Ha causado daños en al menos 15 vehículos en los últimos meses. Las autoridades han sido notificadas en múltiples ocasiones pero no han tomado acción.",
      categoria: "INFRAESTRUCTURA",
      ubicacion: {
        ciudad: "El Alto",
        departamento: "La Paz",
        direccion: "Av. Principal, frente al mercado central",
        lat: -16.5,
        lng: -68.2,
      },
      fecha: "2026-02-20T15:30:00",
      fechaIncidente: "2026-02-20",
      evidencia: [
        {
          tipo: "photo",
          url: "/mock/bache1.jpg",
          nombre: "bache-vista-general.jpg",
          tamaño: 2.4,
        },
        {
          tipo: "photo",
          url: "/mock/bache2.jpg",
          nombre: "bache-profundidad.jpg",
          tamaño: 1.8,
        },
        {
          tipo: "photo",
          url: "/mock/bache3.jpg",
          nombre: "bache-accidente.jpg",
          tamaño: 3.1,
        },
      ],
      estado: "verificada",
      verificaciones: {
        total: 45,
        positivas: 42,
        negativas: 3,
      },
      comentarios: [
        {
          id: "c1",
          autor: "Vecino de la zona",
          tipo: "ciudadano",
          fecha: "2026-02-21T10:30:00",
          texto: "Yo también he visto ese bache, es muy peligroso especialmente de noche.",
          verificaciones: 12,
        },
        {
          id: "c2",
          autor: "Fundación Vías Seguras",
          tipo: "aliado",
          fecha: "2026-02-21T14:20:00",
          texto: "Gracias por el reporte. Nosotros podemos ayudarte a dar seguimiento con la alcaldía. ¿Podrías compartir más detalles?",
          verificaciones: 8,
        },
      ],
      aliadosInteresados: [
        { nombre: "Fundación Vías Seguras", tipo: "ONG" },
        { nombre: "Diario Local", tipo: "Medio" },
        { nombre: "Bufete Ciudadano", tipo: "Legal" },
      ],
      autor: {
        tipo: "ciudadano",
        nombre: "Vecino de El Alto",
        nivel: "Verificado",
      },
      metadata: {
        ipfsHash: "bafkreig5qwb3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q",
        txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockNumber: 1234567,
        gasUsed: 350000,
      },
    },
    "DEN-002": {
      id: "DEN-002",
      titulo: "Funcionario pide coima para agilizar trámite",
      descripcion: "En la alcaldía, un funcionario solicitó dinero para dar curso a un permiso.",
      descripcionDetallada: "El día 19 de febrero, al realizar un trámite de construcción en la alcaldía, el funcionario de ventanilla identificado como 'Juan Pérez' solicitó un pago extra de 500 Bs para 'agilizar el proceso' fuera de los canales oficiales. Tengo el audio de la conversación donde se escucha claramente la solicitud.",
      categoria: "CORRUPCION",
      ubicacion: {
        ciudad: "Santa Cruz",
        departamento: "Santa Cruz",
        direccion: "Alcaldía Municipal, oficina 203",
      },
      fecha: "2026-02-19T10:15:00",
      fechaIncidente: "2026-02-19",
      evidencia: [
        {
          tipo: "audio",
          url: "/mock/coima-audio.mp3",
          nombre: "conversacion-coima.mp3",
          tamaño: 4.2,
        },
      ],
      estado: "en_revision",
      verificaciones: {
        total: 18,
        positivas: 15,
        negativas: 3,
      },
      comentarios: [
        {
          id: "c1",
          autor: "Abogado Anticorrupción",
          tipo: "aliado",
          fecha: "2026-02-20T09:15:00",
          texto: "Este tipo de casos son muy comunes. Te recomiendo presentar una denuncia formal en la fiscalía con este audio como prueba.",
          verificaciones: 5,
        },
      ],
      aliadosInteresados: [
        { nombre: "Fundación Anticorrupción", tipo: "ONG" },
        { nombre: "Bufete Legal", tipo: "Legal" },
      ],
      autor: {
        tipo: "ciudadano",
        nombre: "Empresario local",
      },
      metadata: {
        ipfsHash: "bafkreig6q4wb3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq5q3wq6q",
        txHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      },
    },
  };

  return baseDenuncias[id] || baseDenuncias["DEN-001"];
};

export default function DenunciaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { AvatarComp } = useAvatarContext();
  const [denuncia, setDenuncia] = useState<DenunciaDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  console.log("📌 ID de la denuncia:", id); // Debug

  useEffect(() => {
    if (!id) {
      console.error("❌ No se recibió ID");
      setIsLoading(false);
      return;
    }

    // Simular carga de datos
    setIsLoading(true);
    setTimeout(() => {
      const data = getDenunciaMock(id);
      console.log("📦 Datos cargados:", data);
      setDenuncia(data);
      setIsLoading(false);
    }, 800);
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      title: "¡Copiado!",
      description: `${label} copiado al portapapeles`,
      color: "success",
    });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'verificada': return 'success';
      case 'en_revision': return 'warning';
      case 'pendiente': return 'default';
      default: return 'default';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'verificada': return 'Verificada por la comunidad';
      case 'en_revision': return 'En revisión comunitaria';
      case 'pendiente': return 'Pendiente de verificación';
      default: return estado;
    }
  };

  const getEvidenciaIcon = (tipo: string) => {
    switch (tipo) {
      case 'photo': return <Image size={20} className="text-blue-500" />;
      case 'video': return <Video size={20} className="text-purple-500" />;
      case 'audio': return <Mic size={20} className="text-green-500" />;
      default: return <FileText size={20} className="text-orange-500" />;
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </DefaultLayout>
    );
  }

  if (!denuncia) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center gap-6 py-12 px-4 text-center">
          <AlertCircle size={64} className="text-danger-500" />
          <h1 className={title()}>Denuncia no encontrada</h1>
          <p className="text-default-500">La denuncia que buscas no existe o ha sido removida.</p>
          <Button
            as={Link}
            to="/denuncias"
            color="primary"
            startContent={<ArrowLeft size={18} />}
          >
            Volver a denuncias
          </Button>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 md:py-8 px-4 max-w-5xl mx-auto"
      >
        {/* Botón volver y acciones */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            as={Link}
            to="/denuncias"
            variant="light"
            startContent={<ArrowLeft size={18} />}
          >
            Volver a denuncias
          </Button>
          
          <div className="flex gap-2">
            <Button variant="bordered" startContent={<Share2 size={18} />}>
              Compartir
            </Button>
            <Button color="primary" startContent={<ThumbsUp size={18} />}>
              Verificar ({denuncia.verificaciones.total})
            </Button>
          </div>
        </div>

        {/* Header de la denuncia */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Chip color={getEstadoColor(denuncia.estado) as any} size="sm">
                    {getEstadoTexto(denuncia.estado)}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {CATEGORY_NAMES[denuncia.categoria]}
                  </Chip>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{denuncia.titulo}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-default-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{denuncia.ubicacion.ciudad}, {denuncia.ubicacion.departamento}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>Reportado: {formatFecha(denuncia.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Incidente: {new Date(denuncia.fechaIncidente).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Autor */}
                <div className="flex items-center gap-3 p-3 bg-default-50 dark:bg-default-100/5 rounded-lg w-fit">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      {denuncia.autor.tipo === 'comunidad' ? (
                        <Users size={20} className="text-primary-600" />
                      ) : (
                        <AvatarComp size={20} />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{denuncia.autor.nombre}</p>
                    <p className="text-xs text-default-400">
                      {denuncia.autor.tipo === 'comunidad' ? 'Comunidad' : 'Ciudadano verificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-success-600" />
                    <span className="text-sm">Verificaciones</span>
                  </div>
                  <span className="font-bold text-success-600">{denuncia.verificaciones.positivas}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-primary-600" />
                    <span className="text-sm">Aliados</span>
                  </div>
                  <span className="font-bold text-primary-600">{denuncia.aliadosInteresados.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-warning-600" />
                    <span className="text-sm">Comentarios</span>
                  </div>
                  <span className="font-bold text-warning-600">{denuncia.comentarios.length}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción detallada */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Descripción detallada</h2>
              </CardHeader>
              <CardBody>
                <p className="text-default-700 whitespace-pre-line">
                  {denuncia.descripcionDetallada}
                </p>
              </CardBody>
            </Card>

            {/* Evidencia */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Evidencia ({denuncia.evidencia.length})</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {denuncia.evidencia.map((ev, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                      onClick={() => ev.tipo === 'photo' && setSelectedImage(ev.url)}
                    >
                      <div className="aspect-square rounded-lg bg-default-100 dark:bg-default-800 flex items-center justify-center overflow-hidden">
                        {ev.tipo === 'photo' ? (
                          <img
                            src={ev.url}
                            alt={ev.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            {getEvidenciaIcon(ev.tipo)}
                            <span className="text-xs mt-1">{ev.nombre}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Eye size={24} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metadatos de IPFS */}
                {denuncia.metadata.ipfsHash && (
                  <div className="mt-4 p-3 bg-default-50 rounded-lg">
                    <p className="text-xs font-semibold mb-1">Evidencia en IPFS</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-default-100 p-1 rounded flex-1 truncate">
                        {denuncia.metadata.ipfsHash}
                      </code>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onClick={() => copyToClipboard(denuncia.metadata.ipfsHash!, "Hash IPFS")}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        as="a"
                        href={`https://gateway.pinata.cloud/ipfs/${denuncia.metadata.ipfsHash}`}
                        target="_blank"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Comentarios */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Comentarios</h2>
                <Button size="sm" color="primary">Agregar comentario</Button>
              </CardHeader>
              <CardBody className="space-y-4">
                {denuncia.comentarios.map((comentario) => (
                  <div key={comentario.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-default-200 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comentario.autor}</span>
                        <Chip size="sm" variant="flat" className="text-[10px] h-5">
                          {comentario.tipo === 'aliado' ? 'Aliado' : 'Ciudadano'}
                        </Chip>
                        <span className="text-xs text-default-400 ml-auto">
                          {formatFecha(comentario.fecha)}
                        </span>
                      </div>
                      <p className="text-sm text-default-600">{comentario.texto}</p>
                      {comentario.verificaciones && (
                        <div className="flex items-center gap-1 mt-2">
                          <ThumbsUp size={12} className="text-default-400" />
                          <span className="text-xs text-default-400">
                            {comentario.verificaciones} verificaciones
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Aliados interesados */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Aliados interesados</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {denuncia.aliadosInteresados.map((aliado, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                        <Users size={16} className="text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{aliado.nombre}</p>
                        <p className="text-xs text-default-400">{aliado.tipo}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="bordered" size="sm" className="w-full mt-4">
                  Ver todos los aliados
                </Button>
              </CardBody>
            </Card>

            {/* Verificaciones */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Verificaciones</h2>
              </CardHeader>
              <CardBody>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-success-600">
                    {Math.round((denuncia.verificaciones.positivas / denuncia.verificaciones.total) * 100)}%
                  </span>
                  <p className="text-sm text-default-500">de la comunidad verifica</p>
                </div>
                <Progress
                  value={(denuncia.verificaciones.positivas / denuncia.verificaciones.total) * 100}
                  color="success"
                  className="mb-2"
                />
                <div className="flex justify-between text-sm mt-4">
                  <div className="text-center">
                    <span className="font-bold text-success-600">{denuncia.verificaciones.positivas}</span>
                    <p className="text-xs text-default-400">Verifican</p>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-danger-600">{denuncia.verificaciones.negativas}</span>
                    <p className="text-xs text-default-400">No verifican</p>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-default-600">{denuncia.verificaciones.total}</span>
                    <p className="text-xs text-default-400">Total</p>
                  </div>
                </div>
                <Button variant="bordered" size="sm" className="w-full mt-4">
                  Verificar esta denuncia
                </Button>
              </CardBody>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Ubicación</h2>
              </CardHeader>
              <CardBody>
                <div className="aspect-video bg-default-100 rounded-lg mb-3 flex items-center justify-center">
                  <MapPin size={32} className="text-default-400" />
                  <span className="text-sm text-default-400 ml-2">Mapa aproximado</span>
                </div>
                <p className="text-sm font-medium">{denuncia.ubicacion.direccion || 'Ubicación aproximada'}</p>
                <p className="text-xs text-default-400 mt-1">
                  {denuncia.ubicacion.ciudad}, {denuncia.ubicacion.departamento}
                </p>
              </CardBody>
            </Card>

            {/* Metadatos blockchain */}
            {denuncia.metadata.txHash && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Registro blockchain</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-default-400">Bloque:</span>
                      <span className="font-mono">{denuncia.metadata.blockNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-400">Gas usado:</span>
                      <span>{denuncia.metadata.gasUsed?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <Divider className="my-2" />
                    <div>
                      <p className="text-default-400 mb-1">Hash de transacción:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-default-100 p-1 rounded flex-1 truncate">
                          {denuncia.metadata.txHash}
                        </code>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => copyToClipboard(denuncia.metadata.txHash!, "Hash de transacción")}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </motion.section>

      {/* Modal para ver imágenes */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Evidencia" className="w-full h-full object-contain" />
            <Button
              isIconOnly
              className="absolute top-4 right-4"
              onClick={() => setSelectedImage(null)}
            >
              X
            </Button>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}