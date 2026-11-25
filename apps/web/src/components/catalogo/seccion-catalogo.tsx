import { CatalogoInteractivo } from "@/components/catalogo/catalogo-interactivo";
import { listarMarcas, listarRelojes } from "@/lib/api/relojes";
import { enlaceWhatsApp } from "@/lib/contacto";
import { contactoPublico } from "@/lib/contacto-servidor";

/** Trae el catálogo visible y sus marcas, y las entrega a la parte interactiva. */
export async function SeccionCatalogo() {
  const [relojes, marcas, contacto] = await Promise.all([
    listarRelojes(),
    listarMarcas(),
    contactoPublico(),
  ]);
  return (
    <CatalogoInteractivo
      relojes={relojes}
      marcas={marcas}
      enlaceChat={enlaceWhatsApp(contacto.whatsapp)}
    />
  );
}
