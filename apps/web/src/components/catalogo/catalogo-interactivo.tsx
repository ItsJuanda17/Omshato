"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoVacio } from "@/components/feedback/estados";
import { etiquetasModo } from "@/components/relojes/insignia-modo";
import { TarjetaReloj } from "@/components/relojes/tarjeta-reloj";
import type { Marca, ModoReloj, RelojResumen } from "@/lib/api/tipos";
import { enlaceWhatsApp } from "@/lib/contacto";
import {
  escribirFiltros,
  filtrarRelojes,
  filtrosVacios,
  hayFiltros,
  leerFiltros,
  leerPrecio,
  validarRangoPrecio,
  type FiltrosCatalogo,
} from "@/lib/catalogo/filtros";
import { formatoCOP, slugificar } from "@/lib/formato";

const MODOS: ModoReloj[] = ["DISPONIBLE", "BAJO_PEDIDO"];
const ESPERA_ESCRITURA_MS = 250;

/**
 * Actualiza la URL sin navegar. Es la única forma de cambiar filtros, y siempre
 * parte de lo que hay en la barra de direcciones para no usar datos viejos.
 */
function actualizarUrl(cambios: Partial<FiltrosCatalogo>) {
  const actual = leerFiltros(new URLSearchParams(window.location.search));
  const texto = escribirFiltros({ ...actual, ...cambios });
  if (texto === escribirFiltros(actual)) return;
  const { pathname, hash } = window.location;
  window.history.replaceState(null, "", `${pathname}${texto ? `?${texto}` : ""}${hash}`);
}

interface Props {
  relojes: RelojResumen[];
  marcas: Marca[];
}

/**
 * Filtros y rejilla del catálogo. Filtra en el cliente sobre la lista completa
 * (REN-2: menos de 1 segundo con hasta 200 relojes) y deja el estado en la URL.
 */
export function CatalogoInteractivo({ relojes, marcas }: Props) {
  const parametros = useSearchParams().toString();
  const filtros = useMemo(() => leerFiltros(new URLSearchParams(parametros)), [parametros]);

  // Borradores de los campos de texto: se escriben libremente y pasan a la URL tras una pausa.
  const [busqueda, setBusqueda] = useState(filtros.busqueda);
  const [minimo, setMinimo] = useState(filtros.precioMin?.toString() ?? "");
  const [maximo, setMaximo] = useState(filtros.precioMax?.toString() ?? "");

  // Si la URL cambia desde fuera (por ejemplo, el enlace "Bajo pedido" del encabezado),
  // los borradores la siguen.
  const [urlBusqueda, setUrlBusqueda] = useState(filtros.busqueda);
  if (filtros.busqueda !== urlBusqueda) {
    setUrlBusqueda(filtros.busqueda);
    setBusqueda(filtros.busqueda);
  }
  const [urlMinimo, setUrlMinimo] = useState(filtros.precioMin);
  if (filtros.precioMin !== urlMinimo) {
    setUrlMinimo(filtros.precioMin);
    setMinimo(filtros.precioMin?.toString() ?? "");
  }
  const [urlMaximo, setUrlMaximo] = useState(filtros.precioMax);
  if (filtros.precioMax !== urlMaximo) {
    setUrlMaximo(filtros.precioMax);
    setMaximo(filtros.precioMax?.toString() ?? "");
  }

  const errorPrecio = validarRangoPrecio(leerPrecio(minimo), leerPrecio(maximo));

  useEffect(() => {
    const pausa = setTimeout(() => {
      actualizarUrl(
        errorPrecio
          ? { busqueda: busqueda.trim() }
          : { busqueda: busqueda.trim(), precioMin: leerPrecio(minimo), precioMax: leerPrecio(maximo) },
      );
    }, ESPERA_ESCRITURA_MS);
    return () => clearTimeout(pausa);
  }, [busqueda, minimo, maximo, errorPrecio]);

  const visibles = useMemo(() => filtrarRelojes(relojes, filtros), [relojes, filtros]);

  function limpiar() {
    setBusqueda("");
    setMinimo("");
    setMaximo("");
    actualizarUrl(filtrosVacios);
  }

  const nombreMarca = marcas.find((m) => slugificar(m.nombre) === filtros.marca)?.nombre;
  const activos: { clave: string; etiqueta: string; quitar: () => void }[] = [];
  if (filtros.busqueda) {
    activos.push({
      clave: "busqueda",
      etiqueta: `Búsqueda: «${filtros.busqueda}»`,
      quitar: () => {
        setBusqueda("");
        actualizarUrl({ busqueda: "" });
      },
    });
  }
  if (filtros.marca) {
    activos.push({
      clave: "marca",
      etiqueta: `Marca: ${nombreMarca ?? filtros.marca}`,
      quitar: () => actualizarUrl({ marca: null }),
    });
  }
  if (filtros.modo) {
    activos.push({
      clave: "modo",
      etiqueta: etiquetasModo[filtros.modo],
      quitar: () => actualizarUrl({ modo: null }),
    });
  }
  if (filtros.precioMin !== null) {
    activos.push({
      clave: "min",
      etiqueta: `Desde ${formatoCOP(filtros.precioMin)}`,
      quitar: () => {
        setMinimo("");
        actualizarUrl({ precioMin: null });
      },
    });
  }
  if (filtros.precioMax !== null) {
    activos.push({
      clave: "max",
      etiqueta: `Hasta ${formatoCOP(filtros.precioMax)}`,
      quitar: () => {
        setMaximo("");
        actualizarUrl({ precioMax: null });
      },
    });
  }

  if (relojes.length === 0) {
    // REQ-CAT-4: sin relojes visibles, el catálogo está en actualización.
    return (
      <EstadoVacio
        titulo="Estamos actualizando el catálogo"
        descripcion="Pronto habrá nuevas piezas. Mientras tanto, escríbenos y te contamos qué podemos conseguirte."
        accion={
          <a
            href={enlaceWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Escribir por WhatsApp
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6 border border-linea bg-superficie p-5 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="busqueda-catalogo" className="sr-only">
            Buscar por nombre o marca
          </Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-tinta-3"
              aria-hidden="true"
            />
            <Input
              id="busqueda-catalogo"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por nombre o marca"
              autoComplete="off"
              className="pl-12"
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="etiqueta mb-3">Marca</legend>
          <div className="flex flex-wrap gap-2">
            <Chip activo={filtros.marca === null} onClick={() => actualizarUrl({ marca: null })}>
              Todas
            </Chip>
            {marcas.map((marca) => {
              const url = slugificar(marca.nombre);
              return (
                <Chip
                  key={marca.id}
                  activo={filtros.marca === url}
                  onClick={() => actualizarUrl({ marca: url })}
                >
                  {marca.nombre}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="etiqueta mb-3">Disponibilidad</legend>
            <div className="flex flex-wrap gap-2">
              <Chip activo={filtros.modo === null} onClick={() => actualizarUrl({ modo: null })}>
                Todos
              </Chip>
              {MODOS.map((modo) => (
                <Chip
                  key={modo}
                  activo={filtros.modo === modo}
                  onClick={() => actualizarUrl({ modo })}
                >
                  {etiquetasModo[modo]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="etiqueta mb-3">Precio en COP</legend>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="precio-minimo" className="sr-only">
                  Precio mínimo
                </Label>
                <Input
                  id="precio-minimo"
                  inputMode="numeric"
                  value={minimo}
                  onChange={(evento) => setMinimo(evento.target.value.replace(/\D/g, ""))}
                  placeholder="Mínimo"
                  aria-invalid={errorPrecio ? true : undefined}
                  aria-describedby={errorPrecio ? "error-precio" : undefined}
                  className="dato h-11"
                />
              </div>
              <span aria-hidden="true" className="text-tinta-3">
                –
              </span>
              <div className="flex-1">
                <Label htmlFor="precio-maximo" className="sr-only">
                  Precio máximo
                </Label>
                <Input
                  id="precio-maximo"
                  inputMode="numeric"
                  value={maximo}
                  onChange={(evento) => setMaximo(evento.target.value.replace(/\D/g, ""))}
                  placeholder="Máximo"
                  aria-invalid={errorPrecio ? true : undefined}
                  aria-describedby={errorPrecio ? "error-precio" : undefined}
                  className="dato h-11"
                />
              </div>
            </div>
            {errorPrecio && (
              <p id="error-precio" role="alert" className="mt-2 text-body-sm text-tinta">
                {errorPrecio}
              </p>
            )}
          </fieldset>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p role="status" aria-live="polite" className="etiqueta mr-2">
          {visibles.length} {visibles.length === 1 ? "reloj" : "relojes"}
        </p>
        {activos.map((activo) => (
          <button
            key={activo.clave}
            type="button"
            onClick={activo.quitar}
            aria-label={`Quitar filtro: ${activo.etiqueta}`}
            className="inline-flex min-h-8 cursor-pointer items-center gap-2 border border-divisor bg-superficie px-3 text-label-sm text-tinta uppercase transition-colors hover:border-tinta"
          >
            {activo.etiqueta}
            <XIcon className="size-3" aria-hidden="true" />
          </button>
        ))}
        {hayFiltros(filtros) && (
          <Button variant="link" size="sm" onClick={limpiar} className="ml-1">
            Limpiar filtros
          </Button>
        )}
      </div>

      {visibles.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {visibles.map((reloj, i) => (
            <li key={reloj.id}>
              <TarjetaReloj reloj={reloj} prioridad={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio
          titulo="No encontramos relojes con esos filtros"
          descripcion="Prueba con otra marca o con un rango de precio más amplio."
          accion={
            <Button variant="outline" onClick={limpiar}>
              Limpiar filtros
            </Button>
          }
        />
      )}
    </div>
  );
}
