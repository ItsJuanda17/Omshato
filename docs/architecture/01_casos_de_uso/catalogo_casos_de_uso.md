# Catálogo de casos de uso de Omshato

Los identificadores CU-xx son los que aparecen en los diagramas. Los casos marcados como incluidos se reutilizan desde otros casos de uso.

## Comprador (CU-01 a CU-09)

| ID | Caso de uso | Observación |
|---|---|---|
| CU-01 | Ver catálogo de relojes | Solo se listan los relojes visibles |
| CU-02 | Filtrar y buscar relojes | Extiende CU-01 |
| CU-03 | Ver ficha de un reloj | |
| CU-04 | Hacer pedido sin registro | Extiende CU-03, incluye CU-08 y CU-09 |
| CU-05 | Consultar por WhatsApp | Extiende CU-03, actor secundario: WhatsApp |
| CU-06 | Visitar redes sociales | Actores secundarios: Instagram y TikTok |
| CU-07 | Consultar información legal y ayuda | |
| CU-08 | Aceptar política de datos personales | Incluido en CU-04 (Ley 1581) |
| CU-09 | Notificar pedido nuevo al administrador | Incluido en CU-04, usa el canal de notificación (TBD-9) |

## Administrador (CU-10 a CU-26)

| ID | Caso de uso | Observación |
|---|---|---|
| CU-10 | Iniciar sesión | Único caso que no exige sesión activa |
| CU-11 | Cerrar sesión | |
| CU-12 | Cambiar contraseña | |
| CU-13 | Agregar reloj | Incluye CU-18 |
| CU-14 | Editar reloj | Incluye CU-18 |
| CU-15 | Cambiar modo: Disponible o Bajo pedido | Extiende CU-14 |
| CU-16 | Ocultar o mostrar reloj | |
| CU-17 | Eliminar reloj | Solo sin pedidos asociados, incluye CU-26 |
| CU-18 | Subir y ordenar fotos | Incluido |
| CU-19 | Listar y filtrar pedidos | |
| CU-20 | Ver detalle de un pedido | |
| CU-21 | Cambiar estado de un pedido | Respeta la Tabla 2 del SRS |
| CU-22 | Cancelar pedido (con motivo) | Extiende CU-21, incluye CU-26 |
| CU-23 | Agregar nota interna | |
| CU-24 | Contactar al comprador por WhatsApp | |
| CU-25 | Editar enlaces de contacto | |
| CU-26 | Confirmar acción destructiva | Incluido |

Todos los casos del administrador, salvo CU-10, exigen una sesión activa (REQ-AUT-1).
