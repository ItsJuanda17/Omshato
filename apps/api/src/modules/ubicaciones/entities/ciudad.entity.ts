import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from "typeorm";

import { Departamento } from "./departamento.entity.js";

/** Municipio de Colombia. El `id` es el código DANE como número (Medellín: 5001). */
@Entity("ciudad")
export class Ciudad {
  @PrimaryColumn({ name: "id_ciudad", type: "integer" })
  id: number;

  @Column({ name: "id_departamento", type: "smallint" })
  idDepartamento: number;

  @ManyToOne(() => Departamento, { nullable: false })
  @JoinColumn({ name: "id_departamento" })
  departamento: Relation<Departamento>;

  @Column({ type: "char", length: 5 })
  codigoDane: string;

  @Column({ type: "varchar", length: 80 })
  nombre: string;
}
