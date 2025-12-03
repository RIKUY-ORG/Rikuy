import { title } from "@/components/primitives";

export default function PrivacyPage() {
  return (
    <section className="flex flex-col gap-6 py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className={title()}>Políticas de Privacidad</h1>
      <p className="text-gray-600">
        Rikuy protege tu anonimidad. No almacenamos datos personales ni compartimos tu identidad con terceros. 
        Las denuncias se registran de forma trazable pero sin vincular tu información privada.
      </p>
      <p className="text-gray-600">
        Usamos tecnologías como blockchain para garantizar transparencia sin comprometer tu seguridad. 
        Puedes usar la plataforma sin crear cuentas visibles ni compartir datos sensibles.
      </p>
    </section>
  );
}
