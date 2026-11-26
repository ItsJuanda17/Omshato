"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";

import { SelectorFotos } from "@/components/admin/relojes/selector-fotos";
import { Button, buttonVariants } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Textarea } from "@/components/ui/textarea";
import { actualizarReloj, crearReloj } from "@/lib/api/relojes-admin";
import type { DatosRelojEntrada, Marca, RelojAdmin } from "@/lib/api/tipos";
import {
  MARCA_NUEVA,
  esquemaFormularioReloj,
  generosReloj,
  type DatosFormularioReloj,
} from "@/lib/validaciones/reloj";

function valoresIniciales(reloj?: RelojAdmin): DatosFormularioReloj {
  if (!reloj) {
    return {
      nombre: "",
      marca: "",
      marcaNueva: "",
      genero: "",
      precio: "",
      modo: "DISPONIBLE",
      cantidad: "1",
      plazoEstimado: "",
      garantia: "",
      detalleMecanica: "",
      descripcion: "",
      visible: true,
      fotos: [],
    };
  }
  return {
    nombre: reloj.nombre,
    marca: String(reloj.marca.id),
    marcaNueva: "",
    genero: reloj.genero,
    precio: String(reloj.precioCop),
    modo: reloj.modo,
    cantidad: reloj.cantidad === null ? "1" : String(reloj.cantidad),
    plazoEstimado: reloj.plazoEstimado ?? "",
    garantia: reloj.garantia,
    detalleMecanica: reloj.detalleMecanica ?? "",
    descripcion: reloj.descripcion ?? "",
    visible: reloj.visible,
    fotos: reloj.imagenes.toSorted((a, b) => a.orden - b.orden).map((i) => i.archivo),
  };
}

function aDatosReloj(datos: DatosFormularioReloj): DatosRelojEntrada {
  const marcaNueva = datos.marca === MARCA_NUEVA;
  return {
    nombre: datos.nombre,
    idMarca: marcaNueva ? null : Number(datos.marca),
    marcaNueva: marcaNueva ? datos.marcaNueva : null,
    genero: datos.genero,
    precioCop: Number(datos.precio),
    modo: datos.modo,
    cantidad: datos.modo === "DISPONIBLE" ? Number(datos.cantidad) : null,
    plazoEstimado: datos.modo === "BAJO_PEDIDO" ? datos.plazoEstimado || null : null,
    garantia: datos.garantia,
    detalleMecanica: datos.detalleMecanica || null,
    descripcion: datos.descripcion || null,
    visible: datos.visible,
    fotos: datos.fotos,
  };
}

interface Props {
  marcas: Marca[];
  /** Si viene, se edita ese reloj. Si no, se agrega uno nuevo. */
  reloj?: RelojAdmin;
}

const claseRadio =
  "size-4 shrink-0 cursor-pointer appearance-none border border-tenue bg-transparent checked:border-tinta checked:bg-tinta checked:shadow-[inset_0_0_0_3px_var(--base)]";

export function FormularioReloj({ marcas, reloj }: Props) {
  const router = useRouter();
  const cliente = useQueryClient();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosFormularioReloj>({
    resolver: zodResolver(esquemaFormularioReloj),
    mode: "onTouched",
    defaultValues: valoresIniciales(reloj),
  });

  const modo = useWatch({ control, name: "modo" });
  const marcaElegida = useWatch({ control, name: "marca" });

  const guardar = useMutation({
    mutationFn: (datos: DatosRelojEntrada) =>
      reloj ? actualizarReloj(reloj.id, datos) : crearReloj(datos),
    onSuccess: async (resultado) => {
      if (!resultado.ok) {
        setErrorServidor(resultado.mensaje);
        return;
      }
      await cliente.invalidateQueries({ queryKey: ["relojes-admin"] });
      await cliente.invalidateQueries({ queryKey: ["reloj-admin"] });
      await cliente.invalidateQueries({ queryKey: ["marcas-admin"] });
      router.push("/admin/relojes");
    },
    onError: () =>
      setErrorServidor("No pudimos guardar el reloj. Tus datos siguen aquí; inténtalo de nuevo."),
  });

  const generos =
    reloj && !generosReloj.includes(reloj.genero as (typeof generosReloj)[number])
      ? [...generosReloj, reloj.genero]
      : generosReloj;

  return (
    <form
      onSubmit={handleSubmit((datos) => {
        setErrorServidor(null);
        guardar.mutate(aDatosReloj(datos));
      })}
      noValidate
      className="space-y-10"
    >
      {errorServidor && (
        <div role="alert" className="flex items-start gap-3 border border-tinta bg-superficie p-5">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-body-md">{errorServidor}</p>
        </div>
      )}

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          Datos del reloj
        </legend>

        <Campo id="nombre" etiqueta="Nombre" error={errors.nombre?.message}>
          {(a) => <Input {...a} {...register("nombre")} placeholder="PRX Powermatic 80" />}
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="marca" etiqueta="Marca" error={errors.marca?.message}>
            {(a) => (
              <SelectNativo {...a} {...register("marca")}>
                <option value="">Elige una marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
                <option value={MARCA_NUEVA}>Otra marca (escribirla)</option>
              </SelectNativo>
            )}
          </Campo>

          <Campo id="genero" etiqueta="Género" error={errors.genero?.message}>
            {(a) => (
              <SelectNativo {...a} {...register("genero")}>
                <option value="">Elige un género</option>
                {generos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </SelectNativo>
            )}
          </Campo>
        </div>

        {marcaElegida === MARCA_NUEVA && (
          <Campo
            id="marcaNueva"
            etiqueta="Nombre de la marca nueva"
            error={errors.marcaNueva?.message}
          >
            {(a) => <Input {...a} {...register("marcaNueva")} placeholder="Ej. Rado" />}
          </Campo>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo
            id="precio"
            etiqueta="Precio en COP"
            error={errors.precio?.message}
            ayuda="Número entero, sin puntos ni comas. Ej. 3450000"
          >
            {(a) => <Input {...a} {...register("precio")} inputMode="numeric" className="dato" />}
          </Campo>

          <Campo id="garantia" etiqueta="Garantía" error={errors.garantia?.message}>
            {(a) => <Input {...a} {...register("garantia")} placeholder="12 meses de garantía" />}
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          Disponibilidad
        </legend>

        <div className="space-y-3">
          <p className="etiqueta">Modo</p>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-3 text-body-md">
              <input type="radio" value="DISPONIBLE" {...register("modo")} className={claseRadio} />
              Disponible
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-body-md">
              <input
                type="radio"
                value="BAJO_PEDIDO"
                {...register("modo")}
                className={claseRadio}
              />
              Bajo pedido
            </label>
          </div>
        </div>

        {modo === "DISPONIBLE" ? (
          <Campo
            id="cantidad"
            etiqueta="Cantidad en mano"
            error={errors.cantidad?.message}
            ayuda="Unidades que tienes para entrega inmediata."
            className="sm:max-w-xs"
          >
            {(a) => <Input {...a} {...register("cantidad")} inputMode="numeric" className="dato" />}
          </Campo>
        ) : (
          <Campo
            id="plazoEstimado"
            etiqueta="Plazo estimado (opcional)"
            error={errors.plazoEstimado?.message}
            ayuda="Se muestra en la ficha. Ej. 8 a 15 días hábiles"
            className="sm:max-w-md"
          >
            {(a) => <Input {...a} {...register("plazoEstimado")} />}
          </Campo>
        )}

        <Controller
          control={control}
          name="visible"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-3 text-body-md">
              <Checkbox
                checked={field.value}
                onCheckedChange={(valor) => field.onChange(valor)}
                className="mt-1"
              />
              <span>
                Visible en el catálogo
                <span className="block text-body-sm text-tinta-3">
                  Si lo desmarcas, el reloj se oculta y no se puede pedir.
                </span>
              </span>
            </label>
          )}
        />
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          Detalle
        </legend>

        <Campo
          id="detalleMecanica"
          etiqueta="Mecánica y especificaciones"
          error={errors.detalleMecanica?.message}
          ayuda="Una línea por dato, con el formato «Clave: valor». Ej. Calibre: Powermatic 80.111"
        >
          {(a) => (
            <Textarea
              {...a}
              {...register("detalleMecanica")}
              rows={7}
              className="dato"
              placeholder={
                "Calibre: Powermatic 80.111\nReserva de marcha: 80 horas\nDiámetro de caja: 40 mm"
              }
            />
          )}
        </Campo>

        <Campo id="descripcion" etiqueta="Descripción" error={errors.descripcion?.message}>
          {(a) => <Textarea {...a} {...register("descripcion")} rows={4} />}
        </Campo>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          Fotos
        </legend>
        <Controller
          control={control}
          name="fotos"
          render={({ field }) => (
            <SelectorFotos
              valor={field.value}
              alCambiar={field.onChange}
              error={errors.fotos?.message}
            />
          )}
        />
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-linea pt-8 sm:flex-row sm:justify-end">
        <Link href="/admin/relojes" className={buttonVariants({ variant: "ghost" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : reloj ? "Guardar cambios" : "Agregar reloj"}
        </Button>
      </div>
    </form>
  );
}
