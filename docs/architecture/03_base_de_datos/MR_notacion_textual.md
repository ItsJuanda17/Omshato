# Omshato · Modelo relacional (notación textual)

Derivado del MER de esta carpeta. Convención: las claves primarias van entre asteriscos dobles (`**id**`), `#` marca una clave foránea y `?` un atributo que admite nulo. Los tipos están en `modelo_fisico_postgresql.sql`.

## Esquemas de relación

```
marca            (**id_marca**, nombre)
departamento     (**id_departamento**, codigo_dane, nombre)
ciudad           (**id_ciudad**, #id_departamento, codigo_dane, nombre)
estado_pedido    (**id_estado**, nombre)
administrador    (**id_administrador**, nombre, correo, contrasena_hash, intentos_fallidos,
                  bloqueado_hasta?, fecha_creacion)
reloj            (**id_reloj**, #id_marca, nombre, genero, precio_cop, cantidad?, garantia,
                  detalle_mecanica?, descripcion?, modo, visible, plazo_estimado?, url_amigable,
                  fecha_publicacion, fecha_actualizacion)
imagen_reloj     (**id_imagen**, #id_reloj, archivo, orden, es_principal)
historial_precio (**id_cambio**, #id_reloj, #id_administrador, precio_anterior, precio_nuevo, fecha_hora)
pedido           (**id_pedido**, numero_pedido, #id_reloj, #id_estado, #id_ciudad, nombre_reloj,
                  precio_reloj, modo_reloj, nombre_comprador, telefono_comprador, direccion,
                  fecha_autorizacion_datos, motivo_cancelacion?, clave_idempotencia?, fecha_creacion)
historial_estado (**id_historial**, #id_pedido, #id_estado, #id_administrador?, fecha_hora)
nota_pedido      (**id_nota**, #id_pedido, #id_administrador, texto, fecha_hora)
enlace_contacto  (**id_enlace**, tipo, valor, activo)
```

## Claves foráneas

| Tabla | Columna | Referencia | Si se borra el padre |
|---|---|---|---|
| reloj | id_marca | marca.id_marca | Restringe |
| imagen_reloj | id_reloj | reloj.id_reloj | Borra las fotos |
| ciudad | id_departamento | departamento.id_departamento | Restringe |
| pedido | id_reloj | reloj.id_reloj | Restringe (RN-8) |
| pedido | id_estado | estado_pedido.id_estado | Restringe |
| pedido | id_ciudad | ciudad.id_ciudad | Restringe |
| historial_estado | id_pedido | pedido.id_pedido | Borra el historial |
| historial_estado | id_estado | estado_pedido.id_estado | Restringe |
| historial_estado | id_administrador | administrador.id_administrador | Restringe (puede ser nulo) |
| nota_pedido | id_pedido | pedido.id_pedido | Borra las notas |
| nota_pedido | id_administrador | administrador.id_administrador | Restringe |
| historial_precio | id_reloj | reloj.id_reloj | Restringe |
| historial_precio | id_administrador | administrador.id_administrador | Restringe |

## Cómo se pasó del MER al MR

Todas las relaciones del MER son de uno a muchos, así que no hubo tablas intermedias. En cada una, la clave del lado "uno" pasó como clave foránea al lado "muchos". Los atributos del MER se conservaron como columnas. `ENLACE_CONTACTO` queda como tabla aislada, porque son datos de configuración del sitio.

## Normalización

Todas las tablas cumplen la tercera forma normal. Dos decisiones de diseño merecen explicación.

- **`pedido` repite el nombre y el precio del reloj** (`nombre_reloj`, `precio_reloj`, `modo_reloj`). Es una copia intencional, no una redundancia por descuido. Si el administrador cambia el precio después, el pedido ya registrado no debe cambiar (REQ-PED-10, RN-7, SEF-3).
- **`historial_estado` guarda solo el estado nuevo.** El estado anterior es la fila previa del mismo pedido, así que guardarlo también sería redundante. La primera fila la crea el sistema al registrar el pedido, con `id_administrador` nulo.

## Decisiones que dependen del cliente

| Tema | Qué se asumió | Pendiente |
|---|---|---|
| Un reloj por pedido | `pedido` apunta a un solo `reloj` y no existe `detalle_pedido` | TBD-16. Si hay carrito, se agrega `detalle_pedido` y `pedido.id_reloj` desaparece |
| Significado de `cantidad` | Unidades en mano, nulo si es Bajo pedido | TBD-2 |
| Valores de `genero` | Texto libre de hasta 20 caracteres, sin restricción | TBD-5 |
| Campos de la mecánica | Un solo campo de texto, `detalle_mecanica` | TBD-6 |
| Formato del plazo estimado | Texto libre, por ejemplo "8 a 15 días" | TBD-7 |
| Teléfono | Exactamente 10 dígitos | TBD-21 |
| Pagos y cuentas de comprador | Fuera de la versión 1.0. Se agregan como tablas nuevas que referencian `pedido`, sin cambiar las existentes (CAL-7) | TBD-3 |
