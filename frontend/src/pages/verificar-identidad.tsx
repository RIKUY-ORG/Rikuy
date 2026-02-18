/**
 * Página de Verificación de Identidad
 * FASE 1: Usuario sube foto de CI boliviano para verificación con ZK proofs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { addToast } from '@heroui/toast';
import { Button } from '@heroui/button';
import { DatePicker } from "@heroui/date-picker";
import { Card,CardBody,CardHeader } from '@heroui/card';
import DefaultLayout from '@/layouts/default';
import { Input } from '@heroui/input';
import { I18nProvider } from '@react-aria/i18n';
import { today,getLocalTimeZone } from "@internationalized/date";
import { Select,SelectItem } from "@heroui/select";
import DragDropFile from '@/components/drag&dropFile';
import { RIKUY_CONFIG } from '@/config/rikuy';
import { ReclaimVerification } from '@/components/ReclaimVerification'; // Importar componente

export default function VerificarIdentidadPage() {
  const navigate = useNavigate();
  const { user } = usePrivy();

  const [verificationMethod,setVerificationMethod] = useState<'manual' | 'digital'>('manual'); // Estado del toggle

  const [documentImage,setDocumentImage] = useState<File | null>(null);
  const [documentNumber,setDocumentNumber] = useState('');
  const [firstName,setFirstName] = useState('');
  const [lastName,setLastName] = useState('');
  const [expedition,setExpedition] = useState('LP'); // La Paz por defecto
  const [isSubmitting,setIsSubmitting] = useState(false);
  const [dateOfBirth,setDateOfBirth] = useState<any>(null);
  const [dobError,setDobError] = useState<string | null>(null);

  const departamentos = [
    { code: 'LP',name: 'La Paz' },
    { code: 'SC',name: 'Santa Cruz' },
    { code: 'CB',name: 'Cochabamba' },
    { code: 'OR',name: 'Oruro' },
    { code: 'PT',name: 'Potosí' },
    { code: 'TJ',name: 'Tarija' },
    { code: 'CH',name: 'Chuquisaca' },
    { code: 'BE',name: 'Beni' },
    { code: 'PD',name: 'Pando' },
  ];

  // Función para validar edad
  const validateAge = (dob: any) => {
    if (!dob) return;
    const now = today(getLocalTimeZone());
    const birthDate = dob;
    const age = now.year - birthDate.year;
    const hasBirthdayPassed =
      now.month > birthDate.month ||
      (now.month === birthDate.month && now.day >= birthDate.day);
    const realAge = hasBirthdayPassed ? age : age - 1;
    if (realAge < 18) {
      setDobError("Debes tener al menos 18 años");
    } else if (realAge > 45) {
      setDobError("La edad máxima permitida es 45 años");
    } else {
      setDobError(null);
    }
  };

  const isFormValid = () => {
    const nombreValido = firstName.length >= 2 && firstName.length <= 80;
    const apellidoValido = lastName.length >= 2 && lastName.length <= 80;
    const ciValido = documentNumber.length >= 6 && documentNumber.length <= 10;
    const fechaValida = dateOfBirth && !dobError;
    const imagenValida = !!documentImage;
    const departamentoValido = !!expedition;

    return (
      nombreValido &&
      apellidoValido &&
      ciValido &&
      fechaValida &&
      imagenValida &&
      departamentoValido
    );
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
      const body = {
        ci: documentNumber,
        fullName: `${firstName} ${lastName}`,
        walletAddress: user.wallet.address,
      };

      const response = await fetch(
        `${RIKUY_CONFIG.BACKEND_API_URL}/api/identity/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-address': user.wallet.address,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (result.success) {
        addToast({
          title: '✅ Identidad verificada',
          description: 'Ya puedes empezar a hacer denuncias',
          color: 'success',
        });

        if (result.data?.commitment) {
          localStorage.setItem('rikuy_commitment', result.data.commitment);
        }
        localStorage.setItem('rikuy_verified', 'true');

        setTimeout(() => {
          navigate('/denunciar');
        },2000);
      } else {
        throw new Error(result.error || 'Error al verificar identidad');
      }
    } catch (error: any) {
      console.error('Error:',error);
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
        {/* Encabezado */}
        <div className="inline-block max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Verificación de Identidad
          </h1>
          <p className="mt-4 text-base text-default-600">
            Para usar RIKUY necesitas verificar que eres ciudadano boliviano.
            <br />
            Elige el método que prefieras:
          </p>
          <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
            <p className="font-semibold">
              🔒 Tu privacidad está protegida con Zero-Knowledge Proofs
            </p>
          </div>
        </div>

        {/* Selector de Método */}
        <div className="flex w-full justify-center mb-6">
          <div className="flex p-1 bg-default-100 rounded-lg">
            <button
              onClick={() => setVerificationMethod('manual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${verificationMethod === 'manual' ? 'bg-white shadow text-primary' : 'text-default-500 hover:text-default-700'}`}
            >
              📝 Subir Documento
            </button>
            <button
              onClick={() => setVerificationMethod('digital')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${verificationMethod === 'digital' ? 'bg-white shadow text-primary' : 'text-default-500 hover:text-default-700'}`}
            >
              🔐 Ciudadanía Digital (ZK)
            </button>
          </div>
        </div>

        {/* Contenido Condicional */}
        {verificationMethod === 'digital' ? (
          <div className="w-full flex flex-col items-center">
            <ReclaimVerification />
            <div className="mt-4 text-center text-xs text-default-400 max-w-md">
              <p>Conectamos de forma segura con <b>ciudadaniadigital.bo</b>. Nadie, ni siquiera Rikuy, verá tu contraseña.</p>
            </div>
          </div>
        ) : (
          /* Formulario Manual */
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold">
                📋 Datos del CI
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Nombres"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan Carlos"
                    isRequired
                    maxLength={80}
                  />
                  <Input
                    type="text"
                    label="Apellidos"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez López"
                    isRequired
                    maxLength={80}
                  />
                </div>

                <DragDropFile
                  label="Foto de tu CI (frente)"
                  description="Arrastra la imagen o usa el botón"
                  accept="image/*"
                  buttonText="Subir CI"
                  buttonColor="primary"
                  buttonSize="lg"
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  onFilesSelected={(files) => setDocumentImage(files[0])}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Número de CI"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="12345678"
                    maxLength={10}
                    isRequired
                  />
                  <Select
                    label="Departamento de Expedición"
                    placeholder="Selecciona un departamento"
                    selectionMode="single"
                    selectedKeys={expedition ? new Set([expedition]) : new Set([])}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setExpedition(value);
                    }}
                    isRequired
                  >
                    {departamentos.map((dept) => (
                      <SelectItem key={dept.code} textValue={`${dept.name} (${dept.code})`}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <I18nProvider locale="es-BO">
                  <DatePicker
                    label="Fecha de Nacimiento"
                    showMonthAndYearPickers
                    value={dateOfBirth}
                    onChange={(val) => {
                      setDateOfBirth(val);
                      validateAge(val);
                    }}
                    isRequired
                    isInvalid={!!dobError}
                    errorMessage={dobError || undefined}
                  />
                </I18nProvider>

                <Button
                  type="submit"
                  color="success"
                  size="lg"
                  fullWidth
                  isDisabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white">
                      </div> Verificando... </span>)
                    : ("🔍 Verificar Identidad")}
                </Button>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">🔐</span>
                    Zero-Knowledge Proofs
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-default-600">
                    <li> Tu identidad real <strong>nunca</strong> se revela en blockchain </li>
                    <li> Solo se guarda un "commitment" matemático imposible de revertir </li>
                  </ul>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </section>
    </DefaultLayout>
  );
}
