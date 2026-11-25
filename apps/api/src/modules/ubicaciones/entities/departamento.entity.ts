import { Column, Entity, PrimaryColumn } from "typeorm";

/** Departamento de Colombia. El `id` es el código DANE como número (Antioquia: 5). */
@Entity("departamento")
export class Departamento {
  @PrimaryColumn({ name: "id_departamento", type: "smallint" })
  id: number;

  @Column({ type: "char", length: 2 })
  codigoDane: string;

  @Column({ type: "varchar", length: 60 })
  nombre: string;
}
