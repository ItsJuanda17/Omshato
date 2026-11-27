"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { LARGO_MINIMO_CONTRASENA } from "@omshato/contratos";

import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { cambiarContrasena } from "@/lib/api/auth";
import {
  esquemaFormularioCambioContrasena,
  type DatosCambioContrasena,
} from "@/lib/validaciones/auth";

const vacio: DatosCambioContrasena = {
  contrasenaActual: "",
  contrasenaNueva: "",
  confirmacion: "",
};

export function FormularioCambioContrasena() {
  const [error, setError] = useState<string | null>(null);
  const [cambiada, setCambiada] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError: marcarCampo,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<DatosCambioContrasena>({
    resolver: zodResolver(esquemaFormularioCambioContrasena),
    mode: "onTouched",
    defaultValues: vacio,
  });

  async function enviar({ contrasenaActual, contrasenaNueva }: DatosCambioContrasena) {
    setError(null);
    setCambiada(false);
    try {
      const resultado = await cambiarContrasena({ contrasenaActual, contrasenaNueva });
      if (resultado.ok) {
        reset(vacio);
        setCambiada(true);
        return;
      }
      if (resultado.campo) {
        marcarCampo(resultado.campo, { message: resultado.mensaje });
        setFocus(resultado.campo);
      } else {
        setError(resultado.mensaje);
      }
    } catch {
      setError("No pudimos cambiar la contraseña. Inténtalo de nuevo.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      noValidate
      className="space-y-6 border border-linea bg-superficie p-6"
    >
      {error && (
        <p role="alert" className="flex items-start gap-3 border border-tinta p-4 text-body-md">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {cambiada && (
        <p role="status" className="flex items-start gap-3 border border-linea p-4 text-body-md">
          <CircleCheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Contraseña actualizada. Cerramos tu sesión en cualquier otro dispositivo.
        </p>
      )}

      <Campo
        id="contrasena-actual"
        etiqueta="Contraseña actual"
        error={errors.contrasenaActual?.message}
      >
        {(atributos) => (
          <Input
            {...atributos}
            {...register("contrasenaActual")}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Campo>

      <Campo
        id="contrasena-nueva"
        etiqueta="Contraseña nueva"
        ayuda={`Mínimo ${LARGO_MINIMO_CONTRASENA} caracteres.`}
        error={errors.contrasenaNueva?.message}
      >
        {(atributos) => (
          <Input
            {...atributos}
            {...register("contrasenaNueva")}
            type="password"
            autoComplete="new-password"
          />
        )}
      </Campo>

      <Campo
        id="contrasena-confirmacion"
        etiqueta="Repite la contraseña nueva"
        error={errors.confirmacion?.message}
      >
        {(atributos) => (
          <Input
            {...atributos}
            {...register("confirmacion")}
            type="password"
            autoComplete="new-password"
          />
        )}
      </Campo>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
