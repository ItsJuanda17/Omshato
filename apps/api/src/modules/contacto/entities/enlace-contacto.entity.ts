import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import type { TipoEnlace } from "../tipo-enlace.js";

/** Si un tipo no tiene fila activa, el sitio no muestra su icono (REQ-CON-4). */
@Entity("enlace_contacto")
export class EnlaceContacto {
  @PrimaryGeneratedColumn("identity", { name: "id_enlace", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ type: "varchar", length: 15 })
  tipo: TipoEnlace;

  /** Número para WhatsApp, o dirección del perfil para Instagram y TikTok. */
  @Column({ type: "varchar", length: 255 })
  valor: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;
}
