"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { CargandoPanel, ErrorPanel } from "@/components/admin/cargando-panel";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { actualizarEnlacesContacto, listarEnlacesContacto } from "@/lib/api/enlaces";
import type { EnlaceContacto } from "@/lib/api/tipos";
import { esquemaEnlaces, type DatosEnlaces } from "@/lib/validaciones/enlaces";

function aFormulario(enlaces: EnlaceContacto[]): DatosEnlaces {
  const de = (tipo: EnlaceContacto["tipo"]) => {
    const enlace = enlaces.find((e) => e.tipo === tipo);
    return { valor: enlace?.valor ?? "", activo: enlace?.activo ?? false };
  };
  return { whatsapp: de("WHATSAPP"), instagram: de("INSTAGRAM"), tiktok: de("TIKTOK") };
}

const campos = [
  {
    clave: "whatsapp",
    etiqueta: "WhatsApp",
    ayuda: "Número con indicativo, por ejemplo 573001234567, o celular de 10 dígitos.",
    placeholder: "573001234567",
  },
  {
    clave: "instagram",
    etiqueta: "Instagram",
    ayuda: "Dirección completa del perfil.",
    placeholder: "https://www.instagram.com/omsha_to",
  },
  {
    clave: "tiktok",
    etiqueta: "TikTok",
    ayuda: "Dirección completa del perfil.",
    placeholder: "https://www.tiktok.com/@omsha_to",
  },
] as const;

function Formulario({ enlaces }: { enlaces: EnlaceContacto[] }) {
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosEnlaces>({
    resolver: zodResolver(esquemaEnlaces),
    mode: "onTouched",
    defaultValues: aFormulario(enlaces),
  });

  const guardar = useMutation({
    mutationFn: actualizarEnlacesContacto,
    onSuccess: (resultado) => {
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      cliente.setQueryData(["enlaces"], resultado.dato);
      setGuardado(true);
    },
    onError: () => setError("No pudimos guardar los enlaces. Tus datos siguen aquí."),
  });

  return (
    <form
      onSubmit={handleSubmit((datos) => {
        setError(null);
        setGuardado(false);
        guardar.mutate(datos);
      })}
      noValidate
      className="space-y-8"
    >
      {error && (
        <p role="alert" className="flex items-start gap-3 border border-tinta p-4 text-body-md">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {guardado && (
        <p role="status" className="flex items-start gap-3 border border-linea p-4 text-body-md">
          <CircleCheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Cambios guardados. Ya se ven en el sitio.
        </p>
      )}

      {campos.map(({ clave, etiqueta, ayuda, placeholder }) => (
        <fieldset key={clave} className="space-y-4 border border-linea bg-superficie p-5">
          <legend className="etiqueta px-2 text-tinta">{etiqueta}</legend>
          <Campo
            id={`${clave}-valor`}
            etiqueta={`${etiqueta}: dato de contacto`}
            error={errors[clave]?.valor?.message}
            ayuda={ayuda}
          >
            {(a) => <Input {...a} {...register(`${clave}.valor`)} placeholder={placeholder} />}
          </Campo>
          <Controller
            control={control}
            name={`${clave}.activo`}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3 text-body-md">
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v)} />
                Mostrar en el sitio
              </label>
            )}
          />
        </fieldset>
      ))}

      <p className="text-body-sm text-tinta-3">
        Si un enlace está desactivado o vacío, el sitio no muestra su icono.
      </p>

      <Button type="submit" disabled={guardar.isPending}>
        {guardar.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}

export function FormularioEnlaces() {
  const consulta = useQuery({
    queryKey: ["enlaces"],
    queryFn: () => listarEnlacesContacto(),
    // El formulario parte siempre del dato más reciente.
    staleTime: 0,
  });

  if (consulta.isPending) return <CargandoPanel mensaje="Cargando enlaces" />;
  if (consulta.isError) return <ErrorPanel alReintentar={() => consulta.refetch()} />;
  return <Formulario enlaces={consulta.data} />;
}
