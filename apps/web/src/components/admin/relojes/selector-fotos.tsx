"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { MAXIMO_FOTOS } from "@omshato/contratos";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subirFoto } from "@/lib/api/fotos";
import { urlFoto } from "@/lib/relojes/fotos";

const TAMANO_MAXIMO_MB = 5;
const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp,image/avif";

interface Props {
  /** Claves de las fotos elegidas, en orden. La primera es la principal (REQ-ADM-10). */
  valor: string[];
  alCambiar: (fotos: string[]) => void;
  error?: string;
}

/**
 * Sube, ordena y define la foto principal. Cada foto se sube apenas se elige y el reloj guarda
 * solo su clave. El API revisa que de verdad sea una imagen; aquí solo se adelanta el tamaño.
 */
export function SelectorFotos({ valor, alCambiar, error }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [problemas, setProblemas] = useState<string[]>([]);
  const lugares = MAXIMO_FOTOS - valor.length;

  function mover(desde: number, hasta: number) {
    const copia = [...valor];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    alCambiar(copia);
  }

  async function subir(archivos: File[]) {
    setProblemas([]);
    setSubiendo(true);
    const subidas: string[] = [];
    const fallos: string[] = [];

    for (const archivo of archivos.slice(0, lugares)) {
      if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
        fallos.push(`«${archivo.name}» pesa más de ${TAMANO_MAXIMO_MB} MB.`);
        continue;
      }
      const formulario = new FormData();
      formulario.set("foto", archivo);
      try {
        const resultado = await subirFoto(formulario);
        if (resultado.ok) subidas.push(resultado.dato);
        else fallos.push(`«${archivo.name}»: ${resultado.mensaje}`);
      } catch {
        fallos.push(`«${archivo.name}»: no pudimos subirla. Inténtalo de nuevo.`);
      }
    }
    if (archivos.length > lugares) {
      fallos.push(`Solo caben ${MAXIMO_FOTOS} fotos por reloj.`);
    }

    if (subidas.length > 0) alCambiar([...valor, ...subidas]);
    setProblemas(fallos);
    setSubiendo(false);
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div className="space-y-5">
      {valor.length > 0 && (
        <ol className="space-y-2">
          {valor.map((archivo, i) => (
            <li
              key={archivo}
              className="flex flex-wrap items-center gap-4 border border-linea bg-superficie p-3"
            >
              <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden border border-linea bg-carbon-2">
                <Image src={urlFoto(archivo)} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-body-md text-tinta">Foto {i + 1}</p>
                {i === 0 ? (
                  <Badge variant="activo">Principal</Badge>
                ) : (
                  <span className="text-body-sm text-tinta-3">En la galería</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {i > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => mover(i, 0)}>
                    Hacer principal
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir la foto ${i + 1}`}
                  disabled={i === 0}
                  onClick={() => mover(i, i - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Bajar la foto ${i + 1}`}
                  disabled={i === valor.length - 1}
                  onClick={() => mover(i, i + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar la foto ${i + 1}`}
                  onClick={() => alCambiar(valor.filter((f) => f !== archivo))}
                >
                  <XIcon />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <input
          ref={entrada}
          type="file"
          accept={TIPOS_ACEPTADOS}
          multiple
          className="sr-only"
          aria-label="Elegir fotos del reloj"
          onChange={(evento) => {
            const archivos = Array.from(evento.target.files ?? []);
            if (archivos.length > 0) void subir(archivos);
          }}
        />
        <Button
          variant="outline"
          disabled={subiendo || lugares <= 0}
          onClick={() => entrada.current?.click()}
        >
          <ImagePlusIcon />
          {subiendo ? "Subiendo…" : "Subir fotos"}
        </Button>
        <p className="text-body-sm text-tinta-3">
          JPG, PNG, WebP o AVIF, de hasta {TAMANO_MAXIMO_MB} MB. Puedes agregar {lugares} más.
        </p>
      </div>

      {problemas.length > 0 && (
        <ul role="alert" className="space-y-1 text-body-sm text-tinta">
          {problemas.map((problema) => (
            <li key={problema}>{problema}</li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-tinta">
          {error}
        </p>
      )}
    </div>
  );
}
