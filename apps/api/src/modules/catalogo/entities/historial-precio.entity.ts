import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { transformadorBigint } from "../../../common/database/transformador-bigint.js";
import { Administrador } from "../../auth/entities/administrador.entity.js";
import { Reloj } from "./reloj.entity.js";

/** Auditoría de cambios de precio (SEF-5). */
@Entity("historial_precio")
export class HistorialPrecio {
  @PrimaryGeneratedColumn("identity", { name: "id_cambio", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ name: "id_reloj", type: "integer" })
  idReloj: number;

  @ManyToOne(() => Reloj, { nullable: false })
  @JoinColumn({ name: "id_reloj" })
  reloj: Relation<Reloj>;

  @Column({ name: "id_administrador", type: "integer" })
  idAdministrador: number;

  @ManyToOne(() => Administrador, { nullable: false })
  @JoinColumn({ name: "id_administrador" })
  administrador: Relation<Administrador>;

  @Column({ type: "bigint", transformer: transformadorBigint })
  precioAnterior: number;

  @Column({ type: "bigint", transformer: transformadorBigint })
  precioNuevo: number;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaHora: Date;
}
