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
import { Reloj } from "../../catalogo/entities/reloj.entity.js";
import type { ModoReloj } from "../../catalogo/modo-reloj.js";
import { Ciudad } from "../../ubicaciones/entities/ciudad.entity.js";
import { EstadoPedido } from "./estado-pedido.entity.js";
import { HistorialEstado } from "./historial-estado.entity.js";
import { NotaPedido } from "./nota-pedido.entity.js";

/** Un pedido lleva un solo reloj y no hay carrito (S-4 del SRS). */
@Entity("pedido")
export class Pedido {
  @PrimaryGeneratedColumn("identity", { name: "id_pedido", generatedIdentity: "ALWAYS" })
  id: number;

  /** Número visible para el comprador, por ejemplo "OMS-0843" (REQ-PED-8). */
  @Column({ type: "varchar", length: 20 })
  numeroPedido: string;

  /** Un reloj con pedidos no se puede eliminar, solo ocultar (RN-8). */
  @Column({ name: "id_reloj", type: "integer" })
  idReloj: number;

  @ManyToOne(() => Reloj, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "id_reloj" })
  reloj: Relation<Reloj>;

  @Column({ name: "id_estado", type: "smallint" })
  idEstado: number;

  @ManyToOne(() => EstadoPedido, { nullable: false })
  @JoinColumn({ name: "id_estado" })
  estado: Relation<EstadoPedido>;

  @Column({ name: "id_ciudad", type: "integer" })
  idCiudad: number;

  @ManyToOne(() => Ciudad, { nullable: false })
  @JoinColumn({ name: "id_ciudad" })
  ciudad: Relation<Ciudad>;

  // Copia del reloj al momento de la compra: no cambia si luego se edita (REQ-PED-10, RN-7).
  @Column({ type: "varchar", length: 150 })
  nombreReloj: string;

  @Column({ type: "bigint", transformer: transformadorBigint })
  precioReloj: number;

  @Column({ type: "varchar", length: 12 })
  modoReloj: ModoReloj;

  // Datos del comprador, que no tiene cuenta (REQ-PED-2).
  @Column({ type: "varchar", length: 120 })
  nombreComprador: string;

  /** Exactamente 10 dígitos (TBD-21). */
  @Column({ type: "varchar", length: 10 })
  telefonoComprador: string;

  @Column({ type: "varchar", length: 250 })
  direccion: string;

  /** Evidencia de la autorización de datos personales, Ley 1581 de 2012 (REQ-PED-6). */
  @Column({ type: "timestamptz" })
  fechaAutorizacionDatos: Date;

  @Column({ type: "varchar", length: 250, nullable: true })
  motivoCancelacion: string | null;

  /** Evita registrar dos veces el mismo envío del formulario (REQ-PED-12). */
  @Column({ type: "varchar", length: 64, nullable: true })
  claveIdempotencia: string | null;

  @Column({ type: "timestamptz", default: () => "now()" })
  fechaCreacion: Date;

  @OneToMany(() => HistorialEstado, (historial) => historial.pedido)
  historial: Relation<HistorialEstado[]>;

  @OneToMany(() => NotaPedido, (nota) => nota.pedido)
  notas: Relation<NotaPedido[]>;
}
