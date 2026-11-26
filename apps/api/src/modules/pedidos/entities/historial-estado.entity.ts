import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { Administrador } from "../../auth/entities/administrador.entity.js";
import { EstadoPedido } from "./estado-pedido.entity.js";
import { Pedido } from "./pedido.entity.js";

/** Una fila por cada estado por el que pasa el pedido, incluida la inicial (REQ-GPE-7). */
@Entity("historial_estado")
export class HistorialEstado {
  @PrimaryGeneratedColumn("identity", { name: "id_historial", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ name: "id_pedido", type: "integer" })
  idPedido: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.historial, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_pedido" })
  pedido: Relation<Pedido>;

  /** El estado nuevo. El anterior es la fila previa del mismo pedido. */
  @Column({ name: "id_estado", type: "smallint" })
  idEstado: number;

  @ManyToOne(() => EstadoPedido, { nullable: false })
  @JoinColumn({ name: "id_estado" })
  estado: Relation<EstadoPedido>;

  /** Nulo en la fila inicial, que registra el sistema. */
  @Column({ name: "id_administrador", type: "integer", nullable: true })
  idAdministrador: number | null;

  @ManyToOne(() => Administrador, { nullable: true })
  @JoinColumn({ name: "id_administrador" })
  administrador: Relation<Administrador> | null;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaHora: Date;
}
