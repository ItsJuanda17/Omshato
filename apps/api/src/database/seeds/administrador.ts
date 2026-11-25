import { PasswordHasher } from "@nestjs/authentication";
import type { DataSource } from "typeorm";
import { z } from "zod";

import {
  LARGO_MAXIMO_CONTRASENA,
  LARGO_MINIMO_CONTRASENA,
} from "../../modules/auth/auth.schemas.js";
import { normalizarCorreo } from "../../modules/auth/auth.service.js";

export const esquemaAdministrador = z.object({
  nombre: z.string().trim().min(1, "El nombre no puede estar vacío").max(100),
  correo: z.string().trim().max(254).pipe(z.email("El correo no es válido")),
  contrasena: z
    .string()
    .min(
      LARGO_MINIMO_CONTRASENA,
      `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`,
    )
    .max(LARGO_MAXIMO_CONTRASENA),
});

export type DatosAdministrador = z.infer<typeof esquemaAdministrador>;

/**
 * Crea la cuenta del administrador, o si el correo ya existe le pone la contraseña
 * nueva. No hay registro público ni "olvidé mi contraseña" (no hay canal de correo
 * definido, TBD-9): esta es la forma de dar el primer acceso y de recuperarlo.
 * Al restablecer, quita el bloqueo y cierra las sesiones abiertas de esa cuenta.
 */
export async function registrarAdministrador(
  dataSource: DataSource,
  datos: DatosAdministrador,
  hasher = new PasswordHasher(),
): Promise<"creada" | "actualizada"> {
  const { nombre, contrasena, correo: correoEscrito } = esquemaAdministrador.parse(datos);
  const correo = normalizarCorreo(correoEscrito);
  const contrasenaHash = await hasher.hash(contrasena);

  // SQL y no entidades: la CLI usa el DataSource de las migraciones, que no las registra.
  return dataSource.transaction(async (manager) => {
    const [existente]: { id: number }[] = await manager.query(
      "SELECT id_administrador AS id FROM administrador WHERE correo = $1",
      [correo],
    );

    if (!existente) {
      await manager.query(
        "INSERT INTO administrador (nombre, correo, contrasena_hash) VALUES ($1, $2, $3)",
        [nombre, correo, contrasenaHash],
      );
      return "creada";
    }

    await manager.query(
      `UPDATE administrador
          SET nombre = $2, contrasena_hash = $3, intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE id_administrador = $1`,
      [existente.id, nombre, contrasenaHash],
    );
    await manager.query("DELETE FROM sesion WHERE id_administrador = $1", [existente.id]);
    return "actualizada";
  });
}
