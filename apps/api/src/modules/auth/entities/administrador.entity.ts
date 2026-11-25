import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("administrador")
export class Administrador {
  @PrimaryGeneratedColumn("identity", { name: "id_administrador", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ type: "varchar", length: 100 })
  nombre: string;

  @Column({ type: "varchar", length: 254 })
  correo: string;

  /** Hash de la contraseña (SEI-2). Nunca la contraseña. */
  @Column({ type: "varchar", length: 255 })
  contrasenaHash: string;

  @Column({ type: "smallint", default: 0 })
  intentosFallidos: number;

  /** Bloqueo temporal tras demasiados intentos fallidos (REQ-AUT-4). */
  @Column({ type: "timestamptz", nullable: true })
  bloqueadoHasta: Date | null;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaCreacion: Date;
}
