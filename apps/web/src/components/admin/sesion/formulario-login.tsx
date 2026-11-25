"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { iniciarSesion } from "@/lib/api/auth";
import { esquemaInicioSesion, type DatosInicioSesion } from "@/lib/validaciones/auth";

export function FormularioLogin() {
  const router = useRouter();
  const [errorSesion, setErrorSesion] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosInicioSesion>({
    resolver: zodResolver(esquemaInicioSesion),
    defaultValues: { correo: "", contrasena: "" },
  });

  async function enviar(datos: DatosInicioSesion) {
    setErrorSesion(null);
    try {
      const resultado = await iniciarSesion(datos);
      if (!resultado.ok) {
        // El mensaje es genérico: no dice cuál de los dos datos falló (REQ-AUT-3).
        setErrorSesion(resultado.mensaje);
        return;
      }
      setEntrando(true);
      router.replace("/admin/pedidos");
    } catch {
      setErrorSesion("No pudimos iniciar sesión. Inténtalo de nuevo.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      noValidate
      className="space-y-6 border border-linea bg-superficie p-6"
    >
      {errorSesion && (
        <div role="alert" className="flex items-start gap-3 border border-tinta p-4">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="text-body-md text-tinta">{errorSesion}</p>
        </div>
      )}

      <Campo id="correo" etiqueta="Correo electrónico" error={errors.correo?.message}>
        {(atributos) => (
          <Input
            {...atributos}
            {...register("correo")}
            type="email"
            autoComplete="username"
            autoFocus
          />
        )}
      </Campo>

      <Campo id="contrasena" etiqueta="Contraseña" error={errors.contrasena?.message}>
        {(atributos) => (
          <Input
            {...atributos}
            {...register("contrasena")}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Campo>

      <Button type="submit" disabled={isSubmitting || entrando} className="w-full">
        {isSubmitting || entrando ? "Entrando…" : "Ingresar al panel"}
      </Button>
    </form>
  );
}
