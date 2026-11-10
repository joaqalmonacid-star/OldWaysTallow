# OldWays Tallow

Sitio web de **OldWays Tallow**, marca de grasa animal artesanal para cocinar
(grasa de res, con orégano y con merkén), en formato de 200 ml.

Sitio estático (HTML + CSS + JavaScript), sin dependencias ni build. Se puede
publicar directamente en **GitHub Pages** o en **Cloudflare**.

- **Producción (Cloudflare):** https://oldwaystallow.joaq-almonacid.workers.dev
- **Respaldo (GitHub Pages):** https://joaqalmonacid-star.github.io/OldWaysTallow/

## Estructura

```
OldWaysTallow/
├── index.html              # Página única con todas las secciones
├── css/styles.css          # Estilos (diseño responsive)
├── js/app.js               # Catálogo, carrito, drawer y navegación
├── assets/img/             # Fotos del producto, logo y favicon
├── scripts/
│   └── generate-assets.mjs # Generador de assets auxiliares
├── wrangler.jsonc          # Configuración del deploy en Cloudflare
└── .assetsignore           # Archivos internos excluidos del sitio publicado
```

## Secciones

- **Inicio** — banner horizontal con el producto, título, CTA y beneficios.
- **Productos** — selección con foto, nombre, descripción, peso, precio y la etiqueta "Hecho por pedido".
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
- Al enviarlo se genera un **número de orden** (`OW-AAAAMMDD-XXXX`) y el sitio
  llama a `POST /api/order`, un endpoint del Worker de Cloudflare (`src/worker.js`).
- El Worker envía **dos correos transaccionales con [Brevo](https://www.brevo.com/)**:
  1. A **beeftallow17@gmail.com**: recepción de la orden, con número, detalle,
     total y datos del cliente (el correo del cliente queda como *Responder a*).
  2. Al **correo que escribió el cliente**: agradecimiento con número de orden,
     detalle del pedido y total.
- Si falla el correo a la tienda, el pedido se rechaza y el cliente ve un error.
  Si solo falla el correo al cliente, el pedido queda registrado y se avisa en pantalla.
- La API key de Brevo **nunca** se expone en el navegador: vive como secreto
  `BREVO_API_KEY` en Cloudflare.

### Configurar Brevo (una sola vez)

1. Crear una cuenta en [Brevo](https://www.brevo.com/) y entrar a
   **Settings → SMTP & API → API Keys**.
2. Crear una API key (v3) y copiarla.
3. Verificar el remitente en **Senders & IP → Senders → Add a sender**:
   `beeftallow17@gmail.com`. Brevo enviará un correo de verificación a esa
   dirección; hay que abrirlo y confirmar.
4. Guardar la API key como secreto en Cloudflare:

   ```bash
   npx wrangler secret put BREVO_API_KEY
   ```

5. (Recomendado) Verificar un dominio propio en Brevo para mejorar la
   entregabilidad. Mientras no haya dominio, se envía desde
   `beeftallow17@gmail.com`.

> El endpoint está en `src/worker.js` y se publica con `npx wrangler deploy`.

## Personalización

- **Moneda**: cambia `CURRENCY` al inicio de `js/app.js`.
- **Productos**: edita el arreglo `PRODUCTS` en `js/app.js`.
- **Correo de contacto**: variable `CONTACT_EMAIL` en `js/app.js`.
- **Imágenes**: ejecuta `node scripts/generate-assets.mjs` para regenerar los SVG.

## Publicar en GitHub Pages

1. Sube los cambios a la rama `main`.
2. En GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. El sitio quedará en `https://joaqalmonacid-star.github.io/OldWaysTallow/`.

## Publicar en Cloudflare

El proyecto ya está creado como Worker con assets estáticos:

- **URL:** https://oldwaystallow.joaq-almonacid.workers.dev
- **Configuración:** `wrangler.jsonc`
- **API de pedidos:** `src/worker.js` (`POST /api/order` → Brevo)
- **Exclusiones:** `.assetsignore` (no publica `.git`, `README.md`, `scripts/`, `src/`, etc.)

Para publicar una nueva versión:

```bash
npx wrangler deploy
```

La primera vez hay que iniciar sesión con `npx wrangler login`. El comando sube
solo los archivos del sitio y actualiza la misma URL. Si se quiere un dominio
propio (por ejemplo `oldwaystallow.cl`), se agrega desde el panel de Cloudflare
en **Workers & Pages → oldwaystallow → Settings → Domains & Routes**.

> Si se agrega un dominio propio, hay que sumarlo a `ALLOWED_ORIGINS` en
> `src/worker.js` para que el navegador pueda llamar al endpoint.
