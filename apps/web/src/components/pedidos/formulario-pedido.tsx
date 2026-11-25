"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { Textarea } from "@/components/ui/textarea";
import { crearPedido } from "@/lib/api/pedidos";
import type { Ciudad, Departamento } from "@/lib/api/tipos";
import { guardarPedidoReciente } from "@/lib/pedidos/pedido-reciente";
import { esquemaFormularioPedido, type DatosFormularioPedido } from "@/lib/validaciones/pedido";

interface Props {
  idReloj: number;
  departamentos: Departamento[];
  ciudades: Ciudad[];
}

/**
 * Formulario de pedido sin registro, en una sola pantalla (CAL-1).
 * Los mensajes salen junto a cada campo y nunca se borra lo escrito (REQ-PED-7).
 */
export function FormularioPedido({ idReloj, departamentos, ciudades }: Props) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState(false);
  // Misma clave en cada reintento: el servicio no registra el pedido dos veces (REQ-PED-12).
  const [claveIdempotencia] = useState(() => crypto.randomUUID());

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DatosFormularioPedido>({
    resolver: zodResolver(esquemaFormularioPedido),
    mode: "onTouched",
    defaultValues: {
      nombre: "",
      telefono: "",
      departamento: "",
      ciudad: "",
      direccion: "",
      aceptaPolitica: false,
    },
  });

  const campoTelefono = register("telefono");
  const departamento = useWatch({ control, name: "departamento" });
  const ciudadesDelDepartamento = ciudades.filter((c) => String(c.idDepartamento) === departamento);

  async function enviar(datos: DatosFormularioPedido) {
    setErrorServidor(null);
    try {
      const resultado = await crearPedido({
        idReloj,
        nombreComprador: datos.nombre,
        telefonoComprador: datos.telefono,
        idCiudad: Number(datos.ciudad),
        direccion: datos.direccion,
        aceptaPolitica: true,
        claveIdempotencia,
      });

      if (!resultado.ok) {
        setErrorServidor(resultado.mensaje);
        return;
      }
      setRegistrado(true);
      guardarPedidoReciente(resultado.pedido);
      router.push("/confirmacion");
    } catch {
      setErrorServidor(
        "No pudimos registrar tu pedido. Revisa tu conexión e inténtalo de nuevo; tus datos siguen aquí.",
      );
    }
  }

  const enviando = isSubmitting || registrado;

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-8">
      {errorServidor && (
        <div role="alert" className="flex gap-3 border border-tinta bg-superficie p-5">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-3">
            <p className="text-body-md text-tinta">{errorServidor}</p>
            <Link href="/#catalogo" className="etiqueta text-tinta underline underline-offset-4">
              Ver el catálogo
            </Link>
          </div>
        </div>
      )}

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          1. Tus datos de contacto
        </legend>

        <Campo id="nombre" etiqueta="Nombre y apellidos" error={errors.nombre?.message}>
          {(atributos) => (
            <Input
              {...atributos}
              {...register("nombre")}
              autoComplete="name"
              placeholder="Como aparece en tu documento"
            />
          )}
        </Campo>

        <Campo
          id="telefono"
          etiqueta="Celular o WhatsApp"
          error={errors.telefono?.message}
          ayuda="Por aquí te contactaremos. 10 dígitos, sin espacios."
        >
          {(atributos) => (
            <div className="relative">
              <span
                aria-hidden="true"
                className="dato pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-body-md text-tinta-3"
              >
                +57
              </span>
              <Input
                {...atributos}
                {...campoTelefono}
                onChange={(evento) => {
                  // Quita espacios y guiones al escribir o pegar, antes de validar.
                  evento.target.value = evento.target.value.replace(/\D/g, "");
                  return campoTelefono.onChange(evento);
                }}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={14}
                placeholder="3001234567"
                className="dato pl-14"
              />
            </div>
          )}
        </Campo>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="etiqueta mb-6 w-full border-b border-linea pb-3 text-tinta">
          2. Dónde te lo entregamos
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="departamento" etiqueta="Departamento" error={errors.departamento?.message}>
            {(atributos) => (
              <SelectNativo
                {...atributos}
                {...register("departamento", {
                  onChange: () => setValue("ciudad", "", { shouldValidate: false }),
                })}
                autoComplete="address-level1"
              >
                <option value="">Elige un departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </SelectNativo>
            )}
          </Campo>

          <Campo id="ciudad" etiqueta="Ciudad o municipio" error={errors.ciudad?.message}>
            {(atributos) => (
              <SelectNativo
                {...atributos}
                {...register("ciudad")}
                disabled={!departamento}
                autoComplete="address-level2"
              >
                <option value="">
                  {departamento ? "Elige una ciudad" : "Primero elige un departamento"}
                </option>
                {ciudadesDelDepartamento.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </SelectNativo>
            )}
          </Campo>
        </div>

        <Campo
          id="direccion"
          etiqueta="Dirección de entrega"
          error={errors.direccion?.message}
          ayuda="Incluye barrio, torre, apartamento o indicaciones para encontrarte."
        >
          {(atributos) => (
            <Textarea
              {...atributos}
              {...register("direccion")}
              autoComplete="street-address"
              rows={3}
              placeholder="Carrera 32 # 2 Sur - 45, apto 802"
            />
          )}
        </Campo>
      </fieldset>

      <div className="space-y-3 border-t border-linea pt-8">
        <Controller
          control={control}
          name="aceptaPolitica"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-3 text-body-sm text-tinta-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={(valor) => field.onChange(valor)}
                onBlur={field.onBlur}
                aria-invalid={errors.aceptaPolitica ? true : undefined}
                aria-describedby={errors.aceptaPolitica ? "politica-error" : undefined}
                className="mt-0.5"
              />
              <span>
                Acepto la{" "}
                <Link
                  href="/politica-datos"
                  target="_blank"
                  className="text-tinta underline underline-offset-4"
                >
                  política de tratamiento de datos personales
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </Link>{" "}
                (Ley 1581 de 2012).
              </span>
            </label>
          )}
        />
        {errors.aceptaPolitica && (
          <p id="politica-error" className="flex items-start gap-2 text-body-sm text-tinta">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errors.aceptaPolitica.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Button type="submit" disabled={enviando} className="w-full sm:w-auto">
          {enviando ? "Enviando pedido…" : "Enviar pedido"}
        </Button>
        <p className="text-body-sm text-tinta-3">
          No se hace ningún cobro en línea. Te contactaremos por WhatsApp para coordinar el pago y
          el envío.
        </p>
      </div>
    </form>
  );
}
