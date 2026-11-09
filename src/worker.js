// Endpoint de pedidos de OldWays Tallow.
// Envía dos correos transaccionales con Brevo: uno al cliente y otro a la tienda.
// La API key se guarda como secreto de Cloudflare (BREVO_API_KEY), nunca en el navegador.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const MAX_BODY_BYTES = 20_000;
const MAX_ITEMS = 20;

const ALLOWED_ORIGINS = new Set([
  "https://oldwaystallow.joaq-almonacid.workers.dev",
  "https://oldways-tallow.joaq-almonacid.workers.dev",
  "https://joaqalmonacid-star.github.io",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/order") {
      return handleOrder(request, env);
    }

    // El resto son archivos estáticos.
    return env.ASSETS.fetch(request);
  },
};

async function handleOrder(request, env) {
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405, cors);
  }
  if (!env.BREVO_API_KEY) {
    return json({ ok: false, error: "missing_brevo_api_key" }, 500, cors);
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload_too_large" }, 413, cors);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400, cors);
  }

  // Honeypot: los bots suelen rellenar campos ocultos.
  if (clean(data.company, 80)) {
    return json({ ok: true, customerEmailSent: true }, 200, cors);
  }

  const name = clean(data.name, 120);
  const email = clean(data.email, 254).toLowerCase();
  const phone = clean(data.phone, 40);
  const orderNumber = clean(data.orderNumber, 40);

  if (
    !name ||
    !isEmail(email) ||
    !phone ||
    !/^OW-\d{8}-\d{4}$/.test(orderNumber) ||
    !Array.isArray(data.items) ||
    data.items.length === 0 ||
    data.items.length > MAX_ITEMS
  ) {
    return json({ ok: false, error: "invalid_order" }, 400, cors);
  }

  // Recalculamos los totales en el servidor para no confiar en el navegador.
  const items = data.items
    .map((it) => {
      const itemName = clean(it?.name, 120);
      const weight = clean(it?.weight, 40);
      const qty = Math.trunc(Number(it?.qty));
      const price = Math.trunc(Number(it?.price));
      if (!itemName || !Number.isFinite(qty) || qty < 1 || qty > 99) return null;
      if (!Number.isFinite(price) || price < 0 || price > 10_000_000) return null;
      return { name: itemName, weight, qty, price, subtotal: qty * price };
    })
    .filter(Boolean);

  if (items.length === 0) {
    return json({ ok: false, error: "invalid_items" }, 400, cors);
  }

  const total = items.reduce((sum, it) => sum + it.subtotal, 0);
  const storeEmail = env.STORE_EMAIL || "beeftallow17@gmail.com";
  const senderEmail = env.SENDER_EMAIL || "beeftallow17@gmail.com";
  const senderName = env.SENDER_NAME || "OldWays Tallow";
  const when = new Date().toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "long",
    timeStyle: "short",
  });

  const rowsHtml = items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #ece3d4;color:#2b241c;">
            ${escapeHtml(it.name)}${it.weight ? ` <span style="color:#8a7a63;">(${escapeHtml(it.weight)})</span>` : ""}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #ece3d4;text-align:center;color:#2b241c;">${it.qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #ece3d4;text-align:right;white-space:nowrap;color:#2b241c;">${clp(it.subtotal)}</td>
        </tr>`
    )
    .join("");

  const rowsText = items
    .map((it) => `- ${it.name}${it.weight ? ` (${it.weight})` : ""} x${it.qty} — ${clp(it.subtotal)}`)
    .join("\n");

  const storeHtml = emailLayout({
    title: `Nuevo pedido ${orderNumber}`,
    intro: `Pedido de ${name}`,
    orderNumber,
    rowsHtml,
    total,
    name,
    email,
    phone,
    when,
    footerNote: `Responde este correo para contactar directamente al cliente (${escapeHtml(email)}).`,
  });

  const customerHtml = emailLayout({
    title: "¡Gracias por tu compra!",
    intro: "Recibimos tu pedido correctamente.",
    orderNumber,
    rowsHtml,
    total,
    name,
    email,
    phone,
    when,
    footerNote: `Nos pondremos en contacto contigo para coordinar la entrega. Si tienes dudas, responde este correo o escríbenos a <a href="mailto:${escapeHtml(storeEmail)}" style="color:#3f4a2f;">${escapeHtml(storeEmail)}</a>.<br><br>OldWays Tallow es un proyecto inicial: producimos por pedido y confirmamos disponibilidad y despacho por correo.`,
  });

  const storeText = [
    `Nuevo pedido ${orderNumber}`,
    "",
    `Cliente: ${name}`,
    `Correo: ${email}`,
    `Teléfono: ${phone}`,
    "",
    rowsText,
    "",
    `Total: ${clp(total)}`,
    "",
    `Recibido: ${when} (hora de Chile)`,
    "",
    "Responde este correo para contactar directamente al cliente.",
  ].join("\n");

  const customerText = [
    "¡Gracias por tu compra en OldWays Tallow!",
    "",
    "Recibimos tu pedido correctamente.",
    "",
    `Número de orden: ${orderNumber}`,
    "",
    rowsText,
    "",
    `Total: ${clp(total)}`,
    "",
    "Nos pondremos en contacto contigo para coordinar la entrega.",
    "OldWays Tallow es un proyecto inicial: producimos por pedido y confirmamos disponibilidad y despacho por correo.",
    "",
    "Equipo OldWays Tallow",
  ].join("\n");

  const send = (payload) =>
    fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

  const storePayload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: storeEmail, name: "OldWays Tallow" }],
    replyTo: { email, name },
    subject: `Nuevo pedido ${orderNumber} — ${name}`,
    htmlContent: storeHtml,
    textContent: storeText,
    tags: ["pedido", "oldways"],
  };

  const customerPayload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email, name }],
    replyTo: { email: storeEmail, name: "OldWays Tallow" },
    subject: `Tu pedido ${orderNumber} — OldWays Tallow`,
    htmlContent: customerHtml,
    textContent: customerText,
    tags: ["confirmacion", "oldways"],
  };

  const [storeRes, customerRes] = await Promise.all([send(storePayload), send(customerPayload)]);

  if (!storeRes.ok) {
    const detail = await safeBody(storeRes);
    console.error("Brevo: fallo el correo a la tienda", storeRes.status, detail);
    return json({ ok: false, error: "store_email_failed", detail }, 502, cors);
  }

  if (!customerRes.ok) {
    const detail = await safeBody(customerRes);
    console.error("Brevo: fallo el correo al cliente", customerRes.status, detail);
    return json({ ok: true, customerEmailSent: false, warning: "customer_email_failed" }, 200, cors);
  }

  return json({ ok: true, customerEmailSent: true }, 200, cors);
}

function emailLayout({ title, intro, orderNumber, rowsHtml, total, name, email, phone, when, footerNote }) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2b241c;">
  <div style="max-width:600px;margin:0 auto;padding:28px 18px;">
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8a6a3f;font-weight:700;">OldWays Tallow</div>
    </div>

    <div style="background:#fffdf8;border:1px solid #e7dccb;border-radius:14px;overflow:hidden;">
      <div style="background:#3f4a2f;color:#ffffff;padding:22px 24px;">
        <h1 style="margin:0;font-size:22px;line-height:1.25;">${escapeHtml(title)}</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:.85;">${escapeHtml(intro)}</p>
      </div>

      <div style="padding:22px 24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#8a6a3f;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Número de orden</p>
        <p style="margin:0 0 18px;font-size:20px;font-weight:700;">${escapeHtml(orderNumber)}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
          <thead>
            <tr>
              <th align="left" style="padding:8px 12px;border-bottom:2px solid #3f4a2f;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b5a44;">Producto</th>
              <th align="center" style="padding:8px 12px;border-bottom:2px solid #3f4a2f;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b5a44;">Cant.</th>
              <th align="right" style="padding:8px 12px;border-bottom:2px solid #3f4a2f;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b5a44;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px;text-align:right;font-weight:700;">Total</td>
              <td style="padding:12px;text-align:right;font-weight:700;white-space:nowrap;">${clp(total)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#f6f1e7;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;">
          <strong>Datos del cliente</strong><br>
          Nombre: ${escapeHtml(name)}<br>
          Correo: ${escapeHtml(email)}<br>
          Teléfono: ${escapeHtml(phone)}
        </div>

        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b5a44;">${footerNote}</p>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e7dccb;font-size:12px;color:#8a7a63;line-height:1.6;">
        OldWays Tallow · Proyecto inicial de estudiantes · 150 g por tarro<br>
        Recibido el ${escapeHtml(when)} (hora de Chile)
      </div>
    </div>
  </div>
</body>
</html>`;
}

function corsHeaders(origin) {
  const allowed =
    ALLOWED_ORIGINS.has(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors,
    },
  });
}

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );
}

function clp(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function safeBody(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}
