import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { Administrador } from "../../auth/entities/administrador.entity.js";
import { Pedido } from "./pedido.entity.js";

/** Nota interna del administrador. El comprador no la ve (REQ-GPE-11). */
@Entity("nota_pedido")
export class NotaPedido {
  @PrimaryGeneratedColumn("identity", { name: "id_nota", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ name: "id_pedido", type: "integer" })
  idPedido: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.notas, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_pedido" })
  pedido: Relation<Pedido>;

  @Column({ name: "id_administrador", type: "integer" })
  idAdministrador: number;

  @ManyToOne(() => Administrador, { nullable: false })
  @JoinColumn({ name: "id_administrador" })
  administrador: Relation<Administrador>;

  @Column({ type: "varchar", length: 1000 })
  texto: string;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaHora: Date;
}
