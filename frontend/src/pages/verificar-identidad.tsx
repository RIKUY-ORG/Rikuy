/**
 * Página de Verificación de Identidad
 * FASE 1: Usuario sube foto de CI boliviano para verificación con ZK proofs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import DefaultLayout from '@/layouts/default';
import { title } from '@/components/primitives';
import { addToast } from '@heroui/toast';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';

export default function VerificarIdentidadPage() {
  const navigate = useNavigate();
  const { user } = usePrivy();

  const [documentImage, setDocumentImage] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [expedition, setExpedition] = useState('LP'); // La Paz por defecto
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departamentos = [
    { code: 'LP', name: 'La Paz' },
    { code: 'SC', name: 'Santa Cruz' },
    { code: 'CB', name: 'Cochabamba' },
    { code: 'OR', name: 'Oruro' },
    { code: 'PT', name: 'Potosí' },
    { code: 'TJ', name: 'Tarija' },
    { code: 'CH', name: 'Chuquisaca' },
    { code: 'BE', name: 'Beni' },
    { code: 'PD', name: 'Pando' },
  ];

  // Manejar selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast({
          title: 'Archivo muy grande',
          description: 'La imagen debe ser menor a 10MB',
          color: 'danger',
        });
        return;
      }

      setDocumentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar verificación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.wallet?.address) {
      addToast({
        title: 'Wallet no conectada',
        description: 'Por favor conecta tu wallet primero',
        color: 'danger',
      });
      return;
    }

    if (!documentImage) {
      addToast({
        title: 'Imagen requerida',
        description: 'Por favor sube una foto de tu CI',
        color: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('documentImage', documentImage);
      formData.append('documentType', 'CI');
      formData.append('documentNumber', documentNumber);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('dateOfBirth', dateOfBirth);
      formData.append('expedition', expedition);
      formData.append('userAddress', user.wallet.address);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/identity/verify`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        addToast({
          title: '✅ Identidad verificada',
          description: 'Ya puedes empezar a hacer denuncias',
          color: 'success',
        });

        // Guardar commitment y secret en localStorage
        if (result.data?.identity?.commitment) {
          localStorage.setItem('rikuy_commitment', result.data.identity.commitment);
          localStorage.setItem('rikuy_verified', 'true');
        }
        if (result.data?.identity?.secret) {
          localStorage.setItem('rikuy_identity_secret', result.data.identity.secret);
        }

        // Redirigir a denunciar
        setTimeout(() => {
          navigate('/denunciar');
        }, 2000);
      } else {
        throw new Error(result.error || 'Error al verificar identidad');
      }
    } catch (error: any) {
      console.error('Error:', error);
      addToast({
        title: 'Error al verificar',
        description: error.message || 'No se pudo verificar tu identidad. Intenta de nuevo.',
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center">
          <h1 className={title()}>Verificación de Identidad</h1>
          <p className="mt-4 text-base text-default-600">
            Para usar RIKUY necesitas verificar que eres ciudadano boliviano.
            <br />
            Sube una foto de tu Cédula de Identidad (CI).
          </p>
          <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
            <p className="font-semibold">🔒 Tu privacidad está protegida con Zero-Knowledge Proofs</p>
          </div>
        </div>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-xl font-semibold">📋 Datos del CI</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Foto del CI */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Foto de tu CI (frente) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                {documentPreview && (
                  <img
                    src={documentPreview}
                    alt="Preview CI"
                    className="mt-4 rounded-lg max-h-64 mx-auto border"
                  />
                )}
              </div>

              {/* Número de CI */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de CI *
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="12345678"
                  className="w-full p-3 border rounded-lg"
                  required
                  maxLength={10}
                />
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan Carlos"
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez López"
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              {/* Departamento de expedición */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Departamento de Expedición *
                </label>
                <select
                  value={expedition}
                  onChange={(e) => setExpedition(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  {departamentos.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón de envío */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando con ZK Proofs...
                  </span>
                ) : (
                  '🔍 Verificar Identidad'
                )}
              </Button>

              {/* Información de privacidad */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🔐</span>
                  Zero-Knowledge Proofs
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-default-600">
                  <li>Tu identidad real <strong>nunca</strong> se revela en blockchain</li>
                  <li>Solo se guarda un "commitment" matemático imposible de revertir</li>
                  <li>Tus datos personales están encriptados en el backend</li>
                  <li>Puedes denunciar de forma 100% anónima</li>
                </ul>
              </div>
            </form>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
