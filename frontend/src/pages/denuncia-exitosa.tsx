import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { addToast } from "@heroui/toast";

export default function DenunciaExitosaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    // Si no hay datos, redirigir al inicio
    navigate('/');
    return null;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
      color: "success",
    });
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center gap-6 py-12 md:py-20 px-4">
        <div className="flex flex-col items-center gap-4 max-w-2xl">
          <CheckCircle size={80} className="text-success" />
          <h1 className={title()}>¡Denuncia Exitosa!</h1>
          <p className="text-center text-default-600">
            Tu denuncia ha sido registrada de forma anónima y segura en múltiples redes descentralizadas.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          {/* ID del Reporte */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">📋 ID del Reporte</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm bg-default-100 p-2 rounded flex-1 overflow-x-auto">
                  {data.reportId}
                </code>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => copyToClipboard(data.reportId, "ID del reporte")}
                >
                  <Copy size={18} />
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Hash IPFS */}
          {data.ipfsHash && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">🔗 IPFS (Pinata)</h3>
              </CardHeader>
              <CardBody className="gap-2">
                <p className="text-sm text-default-600">
                  Tu imagen está disponible en IPFS para acceso rápido
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm bg-default-100 p-2 rounded flex-1 overflow-x-auto">
                    {data.ipfsHash}
                  </code>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => copyToClipboard(data.ipfsHash, "Hash IPFS")}
                  >
                    <Copy size={18} />
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
                    endContent={<ExternalLink size={16} />}
                  >
                    Ver imagen en IPFS
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          {/* Hash Arkiv */}
          {data.arkivHash && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">💾 Arkiv (Almacenamiento Inmutable)</h3>
              </CardHeader>
              <CardBody className="gap-2">
                <p className="text-sm text-default-600">
                  Tus datos están guardados de forma inmutable por 10 años
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm bg-default-100 p-2 rounded flex-1 overflow-x-auto">
                    {data.arkivHash}
                  </code>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => copyToClipboard(data.arkivHash, "Hash Arkiv")}
                  >
                    <Copy size={18} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Hash de Transacción Blockchain */}
          {data.txHash && (
            <Card>
              <CardHeader>
<<<<<<< HEAD
                <h3 className="text-lg font-semibold">⛓️ Scroll (Blockchain)</h3>
              </CardHeader>
              <CardBody className="gap-2">
                <p className="text-sm text-default-600">
                  Registro verificable en blockchain Scroll Sepolia
=======
                <h3 className="text-lg font-semibold">⛓️ Rikuy Chain (Blockchain)</h3>
              </CardHeader>
              <CardBody className="gap-2">
                <p className="text-sm text-default-600">
                  Registro verificable en blockchain Rikuy Chain
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm bg-default-100 p-2 rounded flex-1 overflow-x-auto">
                    {data.txHash}
                  </code>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => copyToClipboard(data.txHash, "Hash de transacción")}
                  >
                    <Copy size={18} />
                  </Button>
                </div>
                <Button
                  as="a"
<<<<<<< HEAD
                  href={`https://sepolia.scrollscan.com/tx/${data.txHash}`}
=======
                  href={`https://explorer.rikuychain.io/tx/${data.txHash}`}
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="flat"
                  color="primary"
                  endContent={<ExternalLink size={16} />}
                >
<<<<<<< HEAD
                  Ver en Scrollscan
=======
                  Ver en Explorer
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Información adicional */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
            <CardBody>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔐</span>
                Tu privacidad está protegida
              </p>
              <ul className="text-xs space-y-1">
                <li>✅ Tu identidad real nunca se revela</li>
                <li>✅ Solo se usa tu prueba de conocimiento cero (ZK)</li>
                <li>✅ La ubicación está aproximada a ~200m</li>
                <li>✅ Los datos son inmutables y verificables</li>
              </ul>
            </CardBody>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4">
            <Button
              as={Link}
              to="/denunciar"
              color="primary"
              variant="bordered"
              fullWidth
            >
              Hacer otra denuncia
            </Button>
            <Button
              as={Link}
              to="/"
              color="default"
              variant="flat"
              fullWidth
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
