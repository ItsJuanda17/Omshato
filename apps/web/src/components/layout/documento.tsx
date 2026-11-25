import type { ReactNode } from "react";

/** Página de texto largo (política, ayuda): columna angosta y jerarquía clara. */
export function Documento({
  etiqueta,
  titulo,
  introduccion,
  children,
}: {
  etiqueta: string;
  titulo: string;
  introduccion?: string;
  children: ReactNode;
}) {
  return (
    <article className="contenedor py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="space-y-4 border-b border-linea pb-10">
          <p className="etiqueta">{etiqueta}</p>
          <h1 className="font-display text-display-md-mobile uppercase md:text-display-md">
            {titulo}
          </h1>
          {introduccion && <p className="text-body-lg text-tinta-2">{introduccion}</p>}
        </header>
        <div className="divide-y divide-linea">{children}</div>
      </div>
    </article>
  );
}

export function SeccionDocumento({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4 py-8">
      <h2 className="font-display text-headline-sm uppercase">{titulo}</h2>
      <div className="space-y-3 text-body-md text-tinta-2 [&_a]:text-tinta [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
