import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function AyudaPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-12 px-4">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title()}>Centro de Ayuda</h1>
          <p className="mt-4 text-base md:text-lg text-ink/80 dark:text-milk/80">
            Aquí encontrarás respuestas rápidas a las preguntas más comunes sobre
            RIKUY y un glosario para aprender sobre Web2, Web3 y blockchain.
          </p>
        </div>

        {/* Preguntas frecuentes */}
        <div className="w-full max-w-3xl mt-8">
          <Accordion variant="splitted">
            <AccordionItem key="1" title="¿Cómo denuncio de forma anónima?">
              <p>Para realizar una denuncia anónima, solo necesitas tu billetera o ENS. 
              La denuncia se publica en la red Scroll sin revelar tu identidad.</p>
            </AccordionItem>

            <AccordionItem key="2" title="¿Necesito una billetera o ENS para usar RIKUY?">
              <p>Sí, la plataforma funciona con autenticación Web3. Puedes usar tu billetera
              o tu ENS para interactuar con RIKUY de manera segura.</p>
            </AccordionItem>

            <AccordionItem key="3" title="¿Qué pasa con mis datos?">
              <p>RIKUY no recopila información personal. Tus denuncias se registran en la
              blockchain de Scroll y permanecen anónimas.</p>
            </AccordionItem>

            <AccordionItem key="4" title="¿Qué hago si tengo problemas técnicos?">
              <p>Si experimentas errores, puedes revisar la sección de Soporte o contactarnos
              directamente desde la página de Contacto.</p>
            </AccordionItem>

            <AccordionItem key="5" title="¿Cómo contacto al equipo de RIKUY?">
              <p>Puedes escribirnos desde la página de Contacto o hablar con nosotros en
              nuestra cuenta oficial de X: <a href="https://x.com/rikuy_app" target="_blank" rel="noopener noreferrer" className="text-primary">@rikuy_app</a>.</p>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Glosario educativo */}
        <div className="w-full max-w-3xl mt-12">
          <h2 className="text-xl font-semibold mb-4">Glosario básico</h2>
          <Accordion variant="splitted">
            <AccordionItem key="g1" title="Web2">
              <p>Es la internet que usamos hoy: redes sociales, apps y plataformas centralizadas 
              donde las empresas controlan los datos.</p>
            </AccordionItem>

            <AccordionItem key="g2" title="Web3">
              <p>Es la evolución de la web que usa blockchain y contratos inteligentes. 
              Permite que los usuarios sean dueños de sus datos y participen en comunidades 
              descentralizadas.</p>
            </AccordionItem>

            <AccordionItem key="g3" title="Blockchain">
              <p>Es una base de datos distribuida que guarda información de forma segura, 
              transparente e inmutable. En RIKUY se usa para registrar denuncias.</p>
            </AccordionItem>

            <AccordionItem key="g4" title="DAO">
              <p>Organización Autónoma Descentralizada. Una comunidad que toma decisiones 
              colectivas mediante votaciones registradas en blockchain.</p>
            </AccordionItem>

            <AccordionItem key="g5" title="ENS">
              <p>Ethereum Name Service. Es como un “nombre de usuario” para tu billetera 
              Web3, más fácil de recordar que una dirección larga.</p>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </DefaultLayout>
  );
}
