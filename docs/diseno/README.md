# Referencias de diseño de Omshato

Material visual que sirvió de base para el frontend. **Nada de aquí se importa desde el código**: es solo referencia.

| Carpeta | Contenido |
|---|---|
| `stitch/` | Exportaciones de Stitch: una carpeta por pantalla con su `screen.png` y su `code.html`, y `omshato_haute_horlogerie/DESIGN.md` con el sistema de diseño. `image.png_1` es la foto de la tarjeta de la que salió el logo. |
| `prototipo-html/` | Borrador en HTML plano de la estructura del encabezado y la portada. |

## Dónde quedó cada cosa en el código

El diseño implementado vive en `apps/web`. Los tokens están en `apps/web/src/app/globals.css` y el logo provisional en `apps/web/public/logo-omshato.svg`.

## Dónde el código se aparta de los mockups

Estas decisiones son a propósito y siguen el brief del proyecto:

- Solo blanco, negro y grises. Los mockups usan rosado para los errores y verde para un indicador.
- No hay carrito, pagos en línea, avatar ni correo en el pedido. El modelo de datos solo pide nombre, celular, departamento, ciudad y dirección.
- Se quitaron textos que no están en el SRS, como «AES-256», «Bóveda» o el pago del 30 %.
- Los títulos usan Newsreader en lugar de Syne, por decisión posterior del equipo.
- El gris terciario sube de `#666` a `#8A8A8A` para cumplir contraste AA.
