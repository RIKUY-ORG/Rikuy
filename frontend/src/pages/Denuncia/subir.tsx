// src/pages/Denuncia/crear.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useIdentity } from '@/context/identityContext';
import { addToast } from '@heroui/toast';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';
import { RIKUY_CONFIG, CATEGORY_NAMES, CATEGORIES, type CategoryKey } from '@/config/rikuy';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { 
  MapPin, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Ruler,
  Calendar
} from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

interface FileMetadata {
  duration?: number;        // Para video/audio (segundos)
  dimensions?: {            // Para foto
    width: number;
    height: number;
  };
  hasAudio?: boolean;       // Para video
  fps?: number;             // Para video
  bitrate?: number;         // Para video/audio
  codec?: string;           // Para video/audio
  sampleRate?: number;      // Para audio
  channels?: number;        // Para audio
  gpsCoordinates?: {        // Si la foto tiene GPS incorporado
    lat: number;
    lng: number;
  };
  timestamp?: number;       // Momento de captura
  device?: string;          // Dispositivo usado
}

interface PendingFile {
  file: File;
  preview?: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  name: string;
  size: number;
  metadata?: FileMetadata;
}

export default function CrearDenunciaPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = usePrivy();
  const { isVerified } = useIdentity();
  
  // Estado del formulario
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [category, setCategory] = useState<CategoryKey>('INFRAESTRUCTURA');
  const [description, setDescription] = useState('');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [sourceInfo, setSourceInfo] = useState<{
    type: string;
    timestamp?: number;
    source?: string;
  } | null>(null);
  
  // Estados de UI
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Cargar archivos pendientes de sessionStorage y routerLocation
  useEffect(() => {
    const loadPendingFiles = async () => {
      const files: PendingFile[] = [];

      // Guardar información de origen si existe
      if (routerLocation.state?.mediaType) {
        setSourceInfo({
          type: routerLocation.state.mediaType,
          timestamp: routerLocation.state.timestamp,
          source: routerLocation.state.source,
        });
        
        // Mostrar toast informativo con detalles
        let details = '';
        if (routerLocation.state.duration) {
          const mins = Math.floor(routerLocation.state.duration / 60);
          const secs = routerLocation.state.duration % 60;
          details = ` (${mins}:${secs.toString().padStart(2, '0')})`;
        } else if (routerLocation.state.dimensions) {
          details = ` (${routerLocation.state.dimensions.width}x${routerLocation.state.dimensions.height})`;
        } else if (routerLocation.state.fileCount) {
          details = ` (${routerLocation.state.fileCount} archivos)`;
        }
        
        addToast({
          title: `Desde ${routerLocation.state.mediaType}`,
          description: `Preparando tu ${routerLocation.state.mediaType}${details} para la denuncia`,
          color: 'primary',
        });
      }

      // Verificar foto pendiente
      const pendingPhoto = sessionStorage.getItem('pendingPhoto');
      const pendingPhotoName = sessionStorage.getItem('pendingPhotoName');
      const pendingPhotoType = sessionStorage.getItem('pendingPhotoType');

      if (pendingPhoto && pendingPhotoName && pendingPhotoType) {
        const blob = await fetch(pendingPhoto).then(res => res.blob());
        const file = new File([blob], pendingPhotoName, { type: pendingPhotoType });
        
        // Construir metadatos para la foto
        const metadata: FileMetadata = {};
        
        if (routerLocation.state?.dimensions) {
          metadata.dimensions = routerLocation.state.dimensions;
        }
        if (routerLocation.state?.timestamp) {
          metadata.timestamp = routerLocation.state.timestamp;
        }
        if (routerLocation.state?.device) {
          metadata.device = routerLocation.state.device;
        }
        
        files.push({
          file,
          preview: pendingPhoto,
          type: 'photo',
          name: pendingPhotoName,
          size: blob.size,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        
        sessionStorage.removeItem('pendingPhoto');
        sessionStorage.removeItem('pendingPhotoName');
        sessionStorage.removeItem('pendingPhotoType');
      }

      // Verificar video pendiente
      const pendingVideo = sessionStorage.getItem('pendingVideo');
      const pendingVideoName = sessionStorage.getItem('pendingVideoName');
      const pendingVideoType = sessionStorage.getItem('pendingVideoType');

      if (pendingVideo && pendingVideoName && pendingVideoType) {
        const blob = await fetch(pendingVideo).then(res => res.blob());
        const file = new File([blob], pendingVideoName, { type: pendingVideoType });
        
        // Construir metadatos para el video
        const metadata: FileMetadata = {};
        
        if (routerLocation.state?.duration) {
          metadata.duration = routerLocation.state.duration;
        }
        if (routerLocation.state?.hasAudio !== undefined) {
          metadata.hasAudio = routerLocation.state.hasAudio;
        }
        if (routerLocation.state?.timestamp) {
          metadata.timestamp = routerLocation.state.timestamp;
        }
        
        files.push({
          file,
          type: 'video',
          name: pendingVideoName,
          size: blob.size,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        
        sessionStorage.removeItem('pendingVideo');
        sessionStorage.removeItem('pendingVideoName');
        sessionStorage.removeItem('pendingVideoType');
      }

      // Verificar audio pendiente
      const pendingAudio = sessionStorage.getItem('pendingAudio');
      const pendingAudioName = sessionStorage.getItem('pendingAudioName');
      const pendingAudioType = sessionStorage.getItem('pendingAudioType');

      if (pendingAudio && pendingAudioName && pendingAudioType) {
        const blob = await fetch(pendingAudio).then(res => res.blob());
        const file = new File([blob], pendingAudioName, { type: pendingAudioType });
        
        // Construir metadatos para el audio
        const metadata: FileMetadata = {};
        
        if (routerLocation.state?.duration) {
          metadata.duration = routerLocation.state.duration;
        }
        if (routerLocation.state?.timestamp) {
          metadata.timestamp = routerLocation.state.timestamp;
        }
        
        files.push({
          file,
          type: 'audio',
          name: pendingAudioName,
          size: blob.size,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        
        sessionStorage.removeItem('pendingAudio');
        sessionStorage.removeItem('pendingAudioName');
        sessionStorage.removeItem('pendingAudioType');
      }

      // Verificar múltiples archivos
      const pendingFilesData = sessionStorage.getItem('pendingFiles');
      if (pendingFilesData) {
        try {
          const filesData = JSON.parse(pendingFilesData);
          console.log('📁 Archivos múltiples desde sessionStorage:', filesData);
          // Aquí cargarías los archivos reales
        } catch (error) {
          console.error('Error parsing pendingFiles:', error);
        }
        sessionStorage.removeItem('pendingFiles');
        sessionStorage.removeItem('pendingFilesCount');
        sessionStorage.removeItem('pendingPreview');
      }

      setPendingFiles(files);
      
      if (files.length > 0) {
        addToast({
          title: 'Archivos cargados',
          description: `${files.length} archivo(s) listo(s) para enviar`,
          color: 'success',
        });
      }
    };

    loadPendingFiles();
  }, [routerLocation.state]);

  const getLocation = () => {
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setIsGettingLocation(false);
          addToast({
            title: 'Ubicación obtenida',
            description: 'Se obtuvo tu ubicación correctamente.',
            color: 'success',
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
          addToast({
            title: 'Error de ubicación',
            description: 'No se pudo obtener tu ubicación. Permite el acceso.',
            color: 'danger',
          });
        }
      );
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      
      // Limpiar preview URL si existe
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      
      return newFiles;
    });

    addToast({
      title: 'Archivo eliminado',
      description: 'El archivo fue removido de la denuncia',
      color: 'warning',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (pendingFiles.length === 0) {
      addToast({
        title: 'Falta evidencia',
        description: 'Debes adjuntar al menos un archivo como evidencia.',
        color: 'warning',
      });
      return;
    }

    if (!description.trim()) {
      addToast({
        title: 'Falta descripción',
        description: 'Debes agregar una descripción del incidente.',
        color: 'warning',
      });
      return;
    }

    if (!userLocation) {
      addToast({
        title: 'Falta ubicación',
        description: 'Debes permitir acceso a tu ubicación.',
        color: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Preparando evidencia...');

    try {
      // Preparar FormData
      const formData = new FormData();
      
      // Agregar cada archivo
      pendingFiles.forEach((file, index) => {
        if (index === 0) {
          formData.append('file', file.file);
        } else {
          formData.append(`file_${index}`, file.file);
        }
      });
      
      formData.append('fileCount', pendingFiles.length.toString());
      formData.append('category', CATEGORIES[category].toString());
      formData.append('description', description);
      formData.append('location', JSON.stringify(userLocation));
      formData.append('walletAddress', user?.wallet?.address || '');

      // Agregar metadatos de cada archivo (¡VALIOSOS PARA INSIGHTS!)
      const allMetadata = pendingFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        metadata: f.metadata || {},
      }));
      formData.append('filesMetadata', JSON.stringify(allMetadata));

      // Agregar información de origen
      if (sourceInfo) {
        formData.append('source', JSON.stringify(sourceInfo));
      } else if (routerLocation.state?.mediaType) {
        formData.append('source', routerLocation.state.mediaType);
      }

      setUploadProgress('Subiendo archivos...');
      
      // Enviar al backend real
      const response = await fetch(`${RIKUY_CONFIG.BACKEND_API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'x-user-address': user?.wallet?.address || '',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al crear la denuncia');
      }

      setUploadProgress('¡Denuncia registrada!');
      
      addToast({
        title: '¡Denuncia exitosa!',
        description: 'Tu denuncia fue registrada en blockchain.',
        color: 'success',
      });

      // Redirigir a página de éxito con todos los datos
      setTimeout(() => {
        navigate('/denuncia-exitosa', {
          state: {
            reportId: result.reportId,
            txHash: result.txHash,
            ipfsHash: result.ipfsHash,
            arkivHash: result.arkivHash,
            category: CATEGORY_NAMES[category],
            fileCount: pendingFiles.length,
            source: sourceInfo?.type || routerLocation.state?.mediaType || 'directo',
            metadata: allMetadata, // ¡Pasamos los metadatos a la página de éxito!
          }
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error al enviar denuncia:', error);
      addToast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la denuncia.',
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // Si no está verificado, mostrar mensaje
  if (!isVerified) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center gap-6 py-12 px-4">
          <h1 className={title()}>Verificación requerida</h1>
          <Card className="max-w-md">
            <CardBody className="text-center p-6">
              <p className="mb-4">Necesitas verificar tu identidad antes de poder denunciar.</p>
              <Button
                as="a"
                href="/verificar-identidad"
                color="warning"
                size="lg"
              >
                Verificar identidad
              </Button>
            </CardBody>
          </Card>
        </section>
      </DefaultLayout>
    );
  }

  const getFileIcon = (type: string, metadata?: FileMetadata) => {
    // AHORA SÍ USAMOS METADATA
    if (metadata) {
      console.log('📊 Metadatos del archivo:', metadata); // Para debugging
    }
    
    switch (type) {
      case 'photo': return <Image size={24} className="text-blue-500" />;
      case 'video': return <Video size={24} className="text-purple-500" />;
      case 'audio': return <Mic size={24} className="text-green-500" />;
      default: return <FileText size={24} className="text-orange-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Componente para mostrar metadatos
  const MetadataBadges = ({ metadata }: { metadata?: FileMetadata }) => {
    if (!metadata) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {metadata.duration && (
          <Chip size="sm" variant="flat" color="secondary" className="text-[10px] h-5">
            <Clock size={10} className="inline mr-1" />
            {formatDuration(metadata.duration)}
          </Chip>
        )}
        {metadata.dimensions && (
          <Chip size="sm" variant="flat" color="secondary" className="text-[10px] h-5">
            <Ruler size={10} className="inline mr-1" />
            {metadata.dimensions.width}x{metadata.dimensions.height}
          </Chip>
        )}
        {metadata.timestamp && (
          <Chip size="sm" variant="flat" color="secondary" className="text-[10px] h-5">
            <Calendar size={10} className="inline mr-1" />
            {new Date(metadata.timestamp).toLocaleDateString()}
          </Chip>
        )}
        {metadata.hasAudio !== undefined && (
          <Chip size="sm" variant="flat" color="secondary" className="text-[10px] h-5">
            {metadata.hasAudio ? '🔊 Audio' : '🔇 Sin audio'}
          </Chip>
        )}
      </div>
    );
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-8 px-4">
        <h1 className={title()}>Completa tu denuncia</h1>

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 gap-4">
            <Loader2 className="animate-spin text-white" size={64} />
            <p className="text-white text-xl font-semibold">{uploadProgress}</p>
            <p className="text-white/70 text-sm">No cierres esta ventana...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
          {/* Sección de archivos a enviar */}
          {pendingFiles.length > 0 && (
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle size={18} className="text-success-500" />
                    Archivos a enviar ({pendingFiles.length})
                  </h3>
                  <Chip size="sm" color="primary" variant="flat">
                    {sourceInfo?.type || 'archivos'}
                  </Chip>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-default-50 dark:bg-default-100/5 rounded-lg group"
                    >
                      {/* Preview o icono */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-default-200 flex items-center justify-center flex-shrink-0">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          getFileIcon(file.type, file.metadata)
                        )}
                      </div>

                      {/* Info del archivo con metadatos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-default-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span className="capitalize">{file.type}</span>
                        </div>
                        
                        {/* Metadatos - ¡AHORA SE MUESTRAN! */}
                        <MetadataBadges metadata={file.metadata} />
                      </div>

                      {/* Botón eliminar */}
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-danger-100 dark:hover:bg-danger-900/20 rounded-full transition"
                        >
                          <X size={16} className="text-danger-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Divider className="my-3" />

                <p className="text-xs text-default-400">
                  Estos archivos serán enviados de forma anónima. Los metadatos se eliminarán automáticamente.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Advertencia si no hay archivos */}
          {pendingFiles.length === 0 && (
            <Card className="border-warning-200 bg-warning-50 dark:bg-warning-900/20">
              <CardBody className="flex items-center gap-3 p-4">
                <AlertCircle size={24} className="text-warning-500" />
                <div>
                  <p className="font-semibold text-warning-700 dark:text-warning-300">
                    No hay archivos para enviar
                  </p>
                  <p className="text-sm text-warning-600 dark:text-warning-400">
                    Por favor, vuelve atrás y selecciona una foto, video o audio.
                  </p>
                </div>
                <Button
                  as="a"
                  href="/denunciar"
                  color="warning"
                  size="sm"
                  variant="flat"
                  className="ml-auto"
                >
                  Volver
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría del reporte</label>
            <Select
              selectedKeys={[category]}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              placeholder="Selecciona una categoría"
              isDisabled={isSubmitting}
            >
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((cat) => (
                <SelectItem key={cat} textValue={CATEGORY_NAMES[cat]}>
                  {CATEGORY_NAMES[cat]}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción del incidente</label>
            <Textarea
              value={description}
              onValueChange={setDescription}
              placeholder="Describe lo que sucedió (fecha, lugar, detalles)..."
              minRows={4}
              isDisabled={isSubmitting}
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ubicación</label>
            <Button
              type="button"
              onClick={getLocation}
              disabled={isGettingLocation || !!userLocation || isSubmitting}
              color={userLocation ? "success" : "primary"}
              variant={userLocation ? "bordered" : "solid"}
              className="w-full"
              startContent={<MapPin size={18} />}
            >
              {isGettingLocation
                ? 'Obteniendo ubicación...'
                : userLocation
                ? `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : 'Obtener mi ubicación'}
            </Button>
            {userLocation && (
              <p className="text-xs text-default-400">
                Precisión: ±{Math.round(userLocation.accuracy)} metros
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            color="success"
            size="lg"
            className="w-full font-semibold"
            disabled={isSubmitting || pendingFiles.length === 0 || !description || !userLocation}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {uploadProgress || 'Enviando...'}
              </span>
            ) : (
              `Enviar denuncia anónima ${pendingFiles.length > 0 ? `(${pendingFiles.length} archivo${pendingFiles.length !== 1 ? 's' : ''})` : ''}`
            )}
          </Button>

          {/* Información de privacidad */}
          <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <CardBody className="text-sm">
              <p className="font-semibold text-primary-700 dark:text-primary-300 mb-2">
                🔒 Tu privacidad está protegida
              </p>
              <ul className="space-y-1 text-default-600">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Metadatos eliminados automáticamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Ubicación aproximada para protegerte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Almacenamiento descentralizado en IPFS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Registro inmutable en Rikuy Chain</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </form>
      </section>
    </DefaultLayout>
  );
}