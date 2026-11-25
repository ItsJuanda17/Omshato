"use client";

import Image from "next/image";
import { useState } from "react";

import type { ImagenReloj } from "@/lib/api/tipos";
import { cn } from "@/lib/utils";

/** Foto principal con miniaturas. Las miniaturas son botones, así que se usan con teclado. */
export function GaleriaReloj({ imagenes, nombre }: { imagenes: ImagenReloj[]; nombre: string }) {
  const [indice, setIndice] = useState(0);
  const actual = imagenes[indice];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden border border-linea bg-carbon-2">
        <Image
          key={actual.id}
          src={actual.archivo}
          alt={`${nombre}, foto ${indice + 1} de ${imagenes.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </div>

      {imagenes.length > 1 && (
        <ul className="grid grid-cols-4 gap-3">
          {imagenes.map((imagen, i) => (
            <li key={imagen.id}>
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
                aria-current={i === indice}
                className={cn(
                  "relative block aspect-square w-full cursor-pointer overflow-hidden border bg-carbon-2 transition-colors",
                  i === indice ? "border-tinta" : "border-linea hover:border-tenue",
                )}
              >
                <Image
                  src={imagen.archivo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 10vw, 22vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
