// import { Link } from "@heroui/link";
// import { Snippet } from "@heroui/snippet";
// import { Code } from "@heroui/code";
// import { button as buttonStyles } from "@heroui/theme";

// import { siteConfig } from "@/config/site";
// import { title, subtitle } from "@/components/primitives";
// import { GithubIcon } from "@/components/icons";

// export default function Home() {
//   return (
//     <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
//       <div className="inline-block max-w-xl text-center justify-center">
//         <span className={title()}>Make&nbsp;</span>
//         <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
//         <br />
//         <span className={title()}>
//           websites regardless of your design experience.
//         </span>
//         <div className={subtitle({ class: "mt-4" })}>
//           Beautiful, fast and modern React UI library.
//         </div>
//       </div>

//       <div className="flex gap-3">
//         <Link
//           isExternal
//           className={buttonStyles({
//             color: "primary",
//             radius: "full",
//             variant: "shadow",
//           })}
//           href={siteConfig.links.docs}
//         >
//           Documentation
//         </Link>
//         <Link
//           isExternal
//           className={buttonStyles({ variant: "bordered", radius: "full" })}
//           href={siteConfig.links.github}
//         >
//           <GithubIcon size={20} />
//           GitHub
//         </Link>
//       </div>

//       <div className="mt-8">
//         <Snippet hideCopyButton hideSymbol variant="bordered">
//           <span>
//             Get started by editing <Code color="primary">app/page.tsx</Code>
//           </span>
//         </Snippet>
//       </div>
//     </section>
//   );
// }


import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 md:py-20">
      <div className="text-center max-w-2xl">
        <h1 className={title()}>Rikuy: Vigilancia comunitaria anónima</h1>
        <p className={subtitle({ class: "mt-4" })}>
          Plataforma segura y accesible para denunciar corrupción y actividades antisociales. 
          Tu voz es anónima, tus denuncias son trazables.
        </p>

        <div className="flex gap-4 justify-center mt-6">
          <Link
            href="/login"
            className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/community"
            className={buttonStyles({ variant: "bordered", radius: "full" })}
          >
            Explorar comunidades
          </Link>
        </div>
      </div>

      <footer className="mt-12 text-sm text-gray-500 flex gap-6">
        <Link href="/privacy">Políticas de Privacidad</Link>
        <Link href="/terms">Términos y Condiciones</Link>
      </footer>
    </section>
  );
}
