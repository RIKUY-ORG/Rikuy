/**
 * Página de creación de reporte con ZK Proofs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '@/hooks/useIdentity';
import { ReportService } from '@/services/report.service';
import { CATEGORY_NAMES, CATEGORIES } from '@/config/semaphore';
import { addToast } from '@heroui/toast';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';

interface LocationData {
  lat: number;
  long: number;
  accuracy: number;
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { identity, commitment, hasIdentity, generateIdentity, isLoading: identityLoading } = useIdentity();

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<keyof typeof CATEGORIES>('INFRAESTRUCTURA');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  /**
   * Generar identidad si no existe
   */
  useEffect(() => {
    if (!identityLoading && !hasIdentity()) {
      const initIdentity = async () => {
        try {
          await generateIdentity();
          addToast({
            title: 'Identidad creada',
            description: 'Se generó tu identidad anónima para reportar.',
            color: 'success',
          });
        } catch (error) {
          console.error('Error generating identity:', error);
          addToast({
            title: 'Error',
            description: 'No se pudo crear tu identidad. Intenta de nuevo.',
            color: 'danger',
          });
        }
      };
      initIdentity();
    }
  }, [identityLoading, hasIdentity, generateIdentity]);

  /**
   * Manejar selección de foto
   */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Obtener ubicación del usuario
   */
  const getLocation = () => {
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            long: position.coords.longitude,
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
    } else {
      setIsGettingLocation(false);
      addToast({
        title: 'Ubicación no disponible',
        description: 'Tu navegador no soporta geolocalización.',
        color: 'danger',
      });
    }
  };

  /**
   * Enviar reporte
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      addToast({
        title: 'Error',
        description: 'No tienes una identidad anónima. Espera un momento.',
        color: 'danger',
      });
      return;
    }

    if (!photo) {
      addToast({
        title: 'Falta foto',
        description: 'Debes adjuntar una foto del incidente.',
        color: 'warning',
      });
      return;
    }

    if (!location) {
      addToast({
        title: 'Falta ubicación',
        description: 'Debes permitir acceso a tu ubicación.',
        color: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear reporte con ZK proof
      const response = await ReportService.createReport(identity, {
        photo,
        category,
        location,
      });

      addToast({
        title: 'Reporte enviado',
        description: `Tu reporte anónimo fue creado. ID: ${response.reportId.substring(0, 10)}...`,
        color: 'success',
      });

      // Redirigir a la página de confirmación o lista de reportes
      navigate('/comunidad');
    } catch (error: any) {
      console.error('Error creating report:', error);
      addToast({
        title: 'Error al crear reporte',
        description: error.message || 'No se pudo crear el reporte. Intenta de nuevo.',
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20">
        <h1 className={title()}>Crear Reporte Anónimo</h1>

        {identityLoading ? (
          <div className="text-center">
            <p>Generando tu identidad anónima...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mt-4"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            {/* Commitment (debug info) */}
            {commitment && (
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-xs">
                <p className="font-semibold">Identidad anónima activa</p>
                <p className="truncate">Commitment: {commitment.substring(0, 20)}...</p>
              </div>
            )}

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Categoría del reporte
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as keyof typeof CATEGORIES)}
                className="w-full p-3 border rounded-lg"
              >
                {Object.keys(CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_NAMES[CATEGORIES[cat as keyof typeof CATEGORIES]]}
                  </option>
                ))}
              </select>
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Foto del incidente
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="w-full p-3 border rounded-lg"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="mt-4 rounded-lg max-h-64 mx-auto"
                />
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ubicación
              </label>
              <button
                type="button"
                onClick={getLocation}
                disabled={isGettingLocation || !!location}
                className="w-full p-3 border rounded-lg bg-blue-500 text-white disabled:bg-gray-400"
              >
                {isGettingLocation
                  ? 'Obteniendo ubicación...'
                  : location
                  ? `Ubicación obtenida: ${location.lat.toFixed(4)}, ${location.long.toFixed(4)}`
                  : 'Obtener mi ubicación'}
              </button>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting || !photo || !location || !identity}
              className="w-full p-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-400 hover:bg-green-700 transition"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando ZK Proof y enviando...
                </span>
              ) : (
                'Enviar Reporte Anónimo'
              )}
            </button>

            {/* Información */}
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">🔒 Tu privacidad está protegida</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tu identidad es completamente anónima</li>
                <li>Usamos Zero-Knowledge Proofs (ZK-SNARKs)</li>
                <li>Nadie puede rastrear tus reportes</li>
                <li>La ubicación es aproximada (privada)</li>
              </ul>
            </div>
          </form>
        )}
      </section>
    </DefaultLayout>
  );
}
