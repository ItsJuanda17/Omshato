# Diagramas de Omshato

Paquete de diagramas derivados del SRS v1.0 de Omshato (tienda web de relojes con un solo vendedor, identidad en blanco y negro). Cada carpeta tiene el diagrama en PNG y SVG, y una subcarpeta `fuente` con el código para regenerarlo.

| Carpeta | Contenido |
|---|---|
| 01_casos_de_uso | CU-01 comprador, CU-02 administrador y el catálogo de casos |
| 02_c4_arquitectura | C4 nivel 1 contexto, nivel 2 contenedores y despliegue |
| 03_base_de_datos | MER, MR (diagrama y notación textual) y el script SQL de PostgreSQL |
| 04_diagramas_de_secuencia | SEC-01 pedido sin registro, SEC-02 inicio de sesión, SEC-03 cambio de estado |
| 05_diagramas_de_estados | EST-01 pedido, EST-02 reloj, EST-03 sesión del administrador |

## Cómo regenerarlos

- Casos de uso: `python3 casos_de_uso.py` (requiere matplotlib).
- C4 y base de datos: `python3 c4.py` y `python3 bd.py` (requieren Graphviz).
- Secuencia y estados: `mmdc -i archivo.mmd -o archivo.png -c tema.json -s 3 -b white` (Mermaid CLI).

## Supuestos que dependen del cliente

- La arquitectura es neutral en tecnología porque TBD-11 sigue abierto.
- Un pedido tiene un solo reloj (S-4, TBD-16) y la semántica de `cantidad` está pendiente (TBD-2).
- El canal de notificación al administrador no está definido (TBD-9).
- El formato del teléfono está pendiente (TBD-21).
- Los 5 intentos y los 15 minutos de bloqueo son valores de referencia (TBD-17).

No se incluyeron wireframes ni flujos de usuario. El MER usa notación con cardinalidades (mín,máx) y atributos dentro de la entidad, no óvalos de Chen.
