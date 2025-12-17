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
import { Card, CardBody, CardHeader } from '@heroui/card';
import DefaultLayout from '@/layouts/default';
import { Input } from '@heroui/input';
import { I18nProvider } from '@react-aria/i18n';
import { today, getLocalTimeZone } from "@internationalized/date";
import { Select, SelectItem } from "@heroui/select";
import DragDropFile from '@/components/drag&dropFile';
import { SEMAPHORE_CONFIG } from '@/config/semaphore';

export default function VerificarIdentidadPage() {
  const navigate = useNavigate();
  const { user } = usePrivy();

  const [documentImage, setDocumentImage] = useState<File | null>(null);
  // const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [dateOfBirth, setDateOfBirth] = useState('');
  const [expedition, setExpedition] = useState('LP'); // La Paz por defecto
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<any>(null);
  const [dobError, setDobError] = useState<string | null>(null);

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

  // Función para validar edad
  const validateAge = (dob: any) => {
    if (!dob) return;
    const now = today(getLocalTimeZone());
    const birthDate = dob; // ya es DateValue 
    const age = now.year - birthDate.year;
    // Ajustar si aún no cumplió años este año 
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

  // Manejar selección de imagen
  // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     // Validar tamaño (max 10MB)
  //     if (file.size > 10 * 1024 * 1024) {
  //       addToast({
  //         title: 'Archivo muy grande',
  //         description: 'La imagen debe ser menor a 10MB',
  //         color: 'danger',
  //       });
  //       return;
  //     }

  //     setDocumentImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setDocumentPreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

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
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('documentImage', documentImage);
      formData.append('documentType', 'CI');
      formData.append('documentNumber', documentNumber);
      formData.append('dateOfBirth', dateOfBirth);
      formData.append('expedition', expedition);
      formData.append('userAddress', user.wallet.address);

      const response = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/identity/verify`,
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
        {/* Encabezado */}
        <div className="inline-block max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Verificación de Identidad
          </h1>
          <p className="mt-4 text-base text-default-600">
            Para usar RIKUY necesitas verificar que eres ciudadano boliviano.
            <br />
            Sube una foto de tu Cédula de Identidad (CI).
          </p>
          <div className="mt-4 bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
            <p className="font-semibold">
              🔒 Tu privacidad está protegida con Zero-Knowledge Proofs
            </p>
          </div>
        </div>
        {/* Formulario */}
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              📋 Datos del CI
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Nombres"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan Carlos"
                  isRequired
                  maxLength={80}
                  isInvalid={firstName.length > 0 && (firstName.length < 2 || firstName.length === 80)}
                  errorMessage={
                    firstName.length > 0 && firstName.length < 2
                      ? "El nombre debe tener al menos 2 caracteres"
                      : firstName.length === 80
                        ? "Has alcanzado el límite máximo de 80 caracteres"
                        : undefined
                  }
                  endContent={
                    firstName.length > 0 && (
                      <span
                        className={`text-xs font-semibold ${firstName.length >= 2 && firstName.length < 80
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {firstName.length}/80
                      </span>
                    )
                  }
                />

                <Input
                  type="text"
                  label="Apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez López"
                  isRequired
                  maxLength={80}
                  isInvalid={lastName.length > 0 && (lastName.length < 2 || lastName.length === 80)}
                  errorMessage={
                    lastName.length > 0 && lastName.length < 2
                      ? "El apellido debe tener al menos 2 caracteres"
                      : lastName.length === 80
                        ? "Has alcanzado el límite máximo de 80 caracteres"
                        : undefined
                  }
                  endContent={
                    lastName.length > 0 && (
                      <span
                        className={`text-xs font-semibold ${lastName.length >= 2 && lastName.length < 80
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {lastName.length}/80
                      </span>
                    )
                  }
                />
              </div>
              {/* Foto del CI */}
              {/* <Input
                type="file"
                accept="image/*"
                capture="environment"
                label="Foto de tu CI (frente)"
                description="Formato sugerido: Nombre_Apellido.png"
                onChange={handleImageChange}
                isRequired
              />
              {documentPreview && (
                <img
                  src={documentPreview}
                  alt="Preview CI"
                  className="mt-4 rounded-lg max-h-64 mx-auto border"
                />)} */}
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
                {/* Número de CI */}
                <Input
                  type="text"
                  label="Número de CI"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="12345678"
                  maxLength={10}
                  isRequired
                />
                {/* Departamento de expedición */}
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
              {/* Fecha de nacimiento */}
              {/* <Input
                type="date"
                label="Fecha de Nacimiento"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                isRequired
              /> */}
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
                // className="w-full max-w-md"
                />
              </I18nProvider>
              {/* Botón de envío */}
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
                    </div> Verificando con ZK Proofs... </span>)
                  : ("🔍 Verificar Identidad")}
              </Button>
              {/* Información de privacidad */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🔐</span>
                  Zero-Knowledge Proofs
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-default-600">
                  <li> Tu identidad real <strong>nunca</strong> se revela en blockchain </li>
                  <li> Solo se guarda un "commitment" matemático imposible de revertir </li>
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
