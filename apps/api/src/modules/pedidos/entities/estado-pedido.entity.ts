import { Column, Entity, PrimaryColumn } from "typeorm";

/** Catálogo de los 6 estados. Se carga con los seeds, no con la API. */
@Entity("estado_pedido")
export class EstadoPedido {
  @PrimaryColumn({ name: "id_estado", type: "smallint" })
  id: number;

  @Column({ type: "varchar", length: 40 })
  nombre: string;
}
