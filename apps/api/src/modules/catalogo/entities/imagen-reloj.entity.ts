import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { Reloj } from "./reloj.entity.js";

@Entity("imagen_reloj")
export class ImagenReloj {
  @PrimaryGeneratedColumn("identity", { name: "id_imagen", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ name: "id_reloj", type: "integer" })
  idReloj: number;

  @ManyToOne(() => Reloj, (reloj) => reloj.imagenes, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_reloj" })
  reloj: Relation<Reloj>;

  /** Ruta o clave de la imagen en el almacenamiento. */
  @Column({ type: "varchar", length: 255 })
  archivo: string;

  /** Posición en la galería, desde 1. */
  @Column({ type: "smallint" })
  orden: number;

  /** Una sola foto principal por reloj (REQ-ADM-10). */
  @Column({ type: "boolean", default: false })
  esPrincipal: boolean;
}
