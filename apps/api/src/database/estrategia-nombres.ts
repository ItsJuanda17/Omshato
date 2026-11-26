import { DefaultNamingStrategy } from "typeorm";

/**
 * Las propiedades de las entidades van en camelCase (`precioCop`) y las columnas
 * en snake_case (`precio_cop`), como en el modelo relacional. Si una columna
 * necesita otro nombre, se declara con `name`.
 */
export class EstrategiaNombresSnake extends DefaultNamingStrategy {
  override columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    if (customName) return customName;
    return [...embeddedPrefixes, propertyName]
      .join("_")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();
  }
}
