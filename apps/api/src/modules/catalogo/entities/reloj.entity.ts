import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { transformadorBigint } from "../../../common/database/transformador-bigint.js";
import type { ModoReloj } from "../modo-reloj.js";
import { ImagenReloj } from "./imagen-reloj.entity.js";
import { Marca } from "./marca.entity.js";

@Entity("reloj")
export class Reloj {
  @PrimaryGeneratedColumn("identity", { name: "id_reloj", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ name: "id_marca", type: "integer" })
  idMarca: number;

  @ManyToOne(() => Marca, { nullable: false })
  @JoinColumn({ name: "id_marca" })
  marca: Relation<Marca>;

  @Column({ type: "varchar", length: 150 })
  nombre: string;

  /** Texto libre. Los valores posibles están por definir (TBD-5). */
  @Column({ type: "varchar", length: 20 })
  genero: string;

  /** Entero positivo en COP (REQ-ADM-3). */
  @Column({ type: "bigint", transformer: transformadorBigint })
  precioCop: number;

  /** Unidades en mano. Nulo cuando es Bajo pedido (TBD-2). */
  @Column({ type: "integer", nullable: true })
  cantidad: number | null;

  @Column({ type: "varchar", length: 150 })
  garantia: string;

  /** Una línea por dato con el formato "Clave: valor" (TBD-6). */
  @Column({ type: "text", nullable: true })
  detalleMecanica: string | null;

  @Column({ type: "text", nullable: true })
  descripcion: string | null;

  @Column({ type: "varchar", length: 12 })
  modo: ModoReloj;

  /** Solo los relojes visibles aparecen en el catálogo y se pueden pedir. */
  @Column({ type: "boolean", default: true })
  visible: boolean;

  @Column({ type: "varchar", length: 60, nullable: true })
  plazoEstimado: string | null;

  /** Segmento propio y estable de la URL pública (REQ-CAT-7). */
  @Column({ type: "varchar", length: 160 })
  urlAmigable: string;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaPublicacion: Date;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaActualizacion: Date;

  @OneToMany(() => ImagenReloj, (imagen) => imagen.reloj)
  imagenes: Relation<ImagenReloj[]>;
}
