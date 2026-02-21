// frontend/src/pages/Denuncia/createReport.tsx (con ReclaimService integrado)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useIdentityStatus } from '@/hooks/useIdentityStatus';
import { ReclaimService } from '@/services/reclaim.service';
import { addToast } from '@heroui/toast';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';
import { CATEGORY_NAMES, CATEGORIES, type CategoryKey } from '@/config/rikuy';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { authenticated, user } = usePrivy();
  const { isVerified, isLoading: statusLoading } = useIdentityStatus();
  const [reclaimProof, setReclaimProof] = useState<any>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryKey>('INFRAESTRUCTURA');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verificar autenticación
  if (!authenticated) {
    navigate('/verificar-identidad');
    return null;
  }

  // Si no está verificado, redirigir
  useEffect(() => {
    if (!isVerified && !statusLoading) {
      navigate('/verificar-identidad');
    }
  }, [isVerified, statusLoading, navigate]);

  // Obtener proof de Reclaim del localStorage (simulado)
  useEffect(() => {
    const storedProof = localStorage.getItem('reclaim_proof');
    if (storedProof) {
      setReclaimProof(JSON.parse(storedProof));
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo) {
      addToast({
        title: 'Falta foto',
        description: 'Debes adjuntar una foto del incidente.',
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
      // Verificar identidad con Reclaim (si es necesario)
      if (reclaimProof) {
        setIsVerifying(true);
        await ReclaimService.verifyIdentity(reclaimProof, user?.wallet?.address || '');
        setIsVerifying(false);
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('category', CATEGORIES[category].toString());
      formData.append('description', description);
      formData.append('location', JSON.stringify(location));
      formData.append('walletAddress', user?.wallet?.address || '');
      
      if (reclaimProof) {
        formData.append('reclaimProof', JSON.stringify(reclaimProof));
      }

      // Enviar al backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/reports`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al crear el reporte');
      }

      addToast({
        title: 'Reporte enviado',
        description: 'Tu reporte anónimo fue creado exitosamente.',
        color: 'success',
      });

      // Limpiar proof después de usar
      localStorage.removeItem('reclaim_proof');
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
      setIsVerifying(false);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <h1 className={title()}>Crear Reporte Anónimo</h1>

        {/* Estado de verificación */}
        {isVerified && (
          <div className="bg-success-50 dark:bg-success-900/20 p-3 rounded-lg text-sm w-full max-w-md">
            <p className="text-success-600 dark:text-success-400 flex items-center gap-2">
              <span>✅</span> Identidad verificada - Puedes reportar anónimamente
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Categoría del reporte
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="w-full p-3 border rounded-lg bg-background"
            >
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_NAMES[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción del incidente
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-lg bg-background"
              placeholder="Describe lo que sucedió..."
            />
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
              className="w-full p-3 border rounded-lg bg-background"
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
              className="w-full p-3 border rounded-lg bg-primary text-white disabled:bg-gray-400"
            >
              {isGettingLocation
                ? 'Obteniendo ubicación...'
                : location
                ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : 'Obtener mi ubicación'}
            </button>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isSubmitting || isVerifying || !photo || !description || !location}
            className="w-full p-4 bg-success text-white rounded-lg font-semibold disabled:bg-gray-400 hover:bg-success-700 transition"
          >
            {isSubmitting || isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isVerifying ? 'Verificando identidad...' : 'Enviando reporte...'}
              </span>
            ) : (
              'Enviar Reporte Anónimo'
            )}
          </button>

          {/* Información de privacidad */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2 text-primary">🔒 Tu privacidad está protegida</p>
            <ul className="list-disc list-inside space-y-1 text-default-600">
              <li>Tu identidad está verificada pero permanece anónima</li>
              <li>La ubicación es aproximada para protegerte</li>
              <li>Los reportes son inmutables en blockchain</li>
            </ul>
          </div>
        </form>
      </section>
    </DefaultLayout>
  );
}