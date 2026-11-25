import { Column, Entity, PrimaryColumn } from "typeorm";

/** Sesión del administrador. El id es el SHA-256 del token de la cookie, nunca el token. */
@Entity("sesion")
export class Sesion {
  @PrimaryColumn({ type: "varchar", length: 64, name: "id_sesion" })
  id: string;

  @Column({ type: "integer", name: "id_administrador" })
  idAdministrador: number;

  @Column({ type: "timestamptz" })
  fechaCreacion: Date;

  /** Vencimiento absoluto: la actividad no lo extiende. */
  @Column({ type: "timestamptz" })
  fechaExpiracion: Date;

  /** Última actividad, para el cierre por inactividad. */
  @Column({ type: "timestamptz" })
  ultimaActividad: Date;

  @Column({ type: "jsonb", nullable: true })
  metadatos: Record<string, unknown> | null;
}
