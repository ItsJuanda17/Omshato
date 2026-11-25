import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("marca")
export class Marca {
  @PrimaryGeneratedColumn("identity", { name: "id_marca", generatedIdentity: "ALWAYS" })
  id: number;

  @Column({ type: "varchar", length: 80 })
  nombre: string;
}
