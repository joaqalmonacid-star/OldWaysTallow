# OldWays Tallow

Sitio web de **OldWays Tallow**, marca de grasa animal artesanal para cocinar
(sego de res, manteca de cerdo, grasa de pato, manteca ibérica y más).

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

## Carrito

- El botón **Agregar** de cada producto suma el ítem al carrito.
- El carrito se guarda en `localStorage`, por lo que se conserva al recargar.
- El contador del encabezado muestra la cantidad total de unidades.
- **Finalizar pedido** abre el correo del cliente con el detalle del pedido.

## Personalización

- **Moneda**: cambia `CURRENCY` al inicio de `js/app.js`.
- **Productos**: edita el arreglo `PRODUCTS` en `js/app.js`.
- **Correo de contacto**: variable `CONTACT_EMAIL` en `js/app.js`.
- **Imágenes**: ejecuta `node scripts/generate-assets.mjs` para regenerar los SVG.

## Publicar en GitHub Pages

1. Sube los cambios a la rama `main`.
2. En GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. El sitio quedará en `https://joaqalmonacid-star.github.io/OldWaysTallow/`.
