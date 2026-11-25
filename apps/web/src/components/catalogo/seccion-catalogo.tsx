import { CatalogoInteractivo } from "@/components/catalogo/catalogo-interactivo";
import { listarMarcas, listarRelojes } from "@/lib/api/relojes";

/** Trae el catálogo visible y sus marcas, y las entrega a la parte interactiva. */
export async function SeccionCatalogo() {
  const [relojes, marcas] = await Promise.all([listarRelojes(), listarMarcas()]);
  return <CatalogoInteractivo relojes={relojes} marcas={marcas} />;
}
