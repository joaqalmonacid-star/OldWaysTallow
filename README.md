# OldWays Tallow

Sitio web de **OldWays Tallow**, marca de grasa animal artesanal para cocinar
(grasa de res, con orégano y con merkén), en formato de 150 g.

Sitio estático (HTML + CSS + JavaScript), sin dependencias ni build. Se puede
publicar directamente en GitHub Pages.

## Estructura

```
OldWaysTallow/
├── index.html              # Página única con todas las secciones
├── css/styles.css          # Estilos (diseño responsive)
├── js/app.js               # Catálogo, carrito, drawer y navegación
├── assets/img/             # Ilustraciones SVG generadas
└── scripts/
    └── generate-assets.mjs # Generador de las ilustraciones SVG
```

## Secciones

- **Inicio** — banner horizontal con el producto, título, CTA y beneficios.
- **Productos** — selección con foto, nombre, descripción, peso, valoración y precio.
- **Carrito** — panel lateral que recibe los productos añadidos (agregar,
  cambiar cantidad, eliminar, total y finalizar pedido por correo).
- **Nosotros** — información de la marca, estadísticas y valores.
- **Proceso** — cómo se elabora la grasa, del campo al tarro.
- **Contacto** — llamada a la acción y datos de contacto.

## Carrito y pedido

- El botón **Agregar** de cada producto suma el ítem al carrito.
- El carrito se guarda en `localStorage`, por lo que se conserva al recargar.
- El contador del encabezado muestra la cantidad total de unidades.
- **Finalizar pedido** abre un formulario que pide **Nombre, Correo y Teléfono**
  (con la nota: *"Esta información será utilizada para localizar y asignar su pedido."*).
- Al enviarlo se genera un **número de orden** (`OW-AAAAMMDD-XXXX`) y se envían
  **dos correos** mediante [FormSubmit](https://formsubmit.co):
  1. A **beeftallow17@gmail.com**: recepción de la orden, con el número de orden,
     el detalle del pedido y el **correo del cliente** (queda como *Responder a*).
  2. Al **correo que escribió el cliente**: un agradecimiento automático con el
     número de orden y el resumen de su compra.
- Tras enviar, el sitio vuelve a la página y muestra la confirmación con el número de orden.

> **Importante (una sola vez):** FormSubmit envía un correo de *"Activate Form"* a
> **beeftallow17@gmail.com**. Hay que abrirlo y pulsar el enlace para activar el envío.
>
> El envío automático usa el **POST nativo con reCAPTCHA activado**, porque la
> auto-respuesta de FormSubmit **no funciona con AJAX ni con el reCAPTCHA desactivado**.
> Por eso el sitio debe verse **servido por internet** (GitHub Pages), no como archivo local.

## Personalización

- **Moneda**: cambia `CURRENCY` al inicio de `js/app.js`.
- **Productos**: edita el arreglo `PRODUCTS` en `js/app.js`.
- **Correo de contacto**: variable `CONTACT_EMAIL` en `js/app.js`.
- **Imágenes**: ejecuta `node scripts/generate-assets.mjs` para regenerar los SVG.

## Publicar en GitHub Pages

1. Sube los cambios a la rama `main`.
2. En GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. El sitio quedará en `https://joaqalmonacid-star.github.io/OldWaysTallow/`.
