import { Global, Module } from "@nestjs/common";
import { DataSource } from "typeorm";

/**
 * Reemplaza la conexión a PostgreSQL en las pruebas e2e, que no necesitan base de datos.
 * Entrega un `DataSource` de relleno: basta para que `TypeOrmModule.forFeature` arme los
 * repositorios de cada módulo, pero cualquier consulta falla. Lo que toque la base se
 * prueba en `test/integracion`.
 */
const dataSourceFalso = {
  options: { type: "postgres" },
  entityMetadatas: [],
  getRepository: () => ({}),
};

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: dataSourceFalso }],
  exports: [DataSource],
})
export class BaseDeDatosFalsaModule {}
