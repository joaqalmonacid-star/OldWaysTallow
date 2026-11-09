/* =========================================================
   OldWays Tallow — lógica de tienda y carrito
   ========================================================= */
(() => {
  "use strict";

  /* ------------------- Configuración ------------------- */
  const CURRENCY = { locale: "es-CL", code: "CLP" }; // cambia aquí la moneda
  const STORAGE_KEY = "oldways-cart-v1";
  const CONTACT_EMAIL = "beeftallow17@gmail.com";

  // Cloudflare (workers.dev o dominio propio) usa el endpoint relativo.
  // GitHub Pages no tiene backend, así que apunta al Worker de producción.
  const ORDER_API = location.hostname.endsWith("github.io")
    ? "https://oldways-tallow.joaq-almonacid.workers.dev/api/order"
    : "/api/order";

  /* ------------------- Catálogo ------------------- */
  const PRODUCTS = [
    {
      id: "grasa-res",
      name: "Grasa de Res",
      desc: "Nuestra receta original. Sabor neutro y punto de humeo alto, ideal para freír y rostizar.",
      price: 4990,
      weight: "150 g",
      badge: "Más vendido",
      image: "assets/img/grasa-res.jpg",
    },
    {
      id: "grasa-res-oregano",
      name: "Grasa de Res (Orégano)",
      desc: "Con orégano seleccionado. Un aroma mediterráneo perfecto para carnes, papas y panes.",
      price: 4990,
      weight: "150 g",
      badge: null,
      image: "assets/img/grasa-res-oregano.jpg",
    },
    {
      id: "grasa-res-merken",
      name: "Grasa de Res (Merkén)",
      desc: "Con merkén ahumado. El toque picante y aromático de la cocina mapuche en tus platos.",
      price: 4990,
      weight: "150 g",
      badge: "Nuevo",
      image: "assets/img/grasa-res-merken.jpg",
    },
  ];

  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  /* ------------------- Utilidades ------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (n) =>
    new Intl.NumberFormat(CURRENCY.locale, {
      style: "currency",
      currency: CURRENCY.code,
    }).format(n);

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------- Estado del carrito ------------------- */
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((it) => it && byId(it.id) && Number(it.qty) > 0)
        .map((it) => ({ id: it.id, qty: Math.min(99, Math.floor(Number(it.qty))) }));
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* modo privado / sin storage: se ignora */
    }
  }

  const cartCount = () => cart.reduce((sum, it) => sum + it.qty, 0);
  const cartTotal = () => cart.reduce((sum, it) => sum + byId(it.id).price * it.qty, 0);

  /* ------------------- Render: productos ------------------- */
  function renderProducts() {
    const grid = $("#productGrid");
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map((p) => productCard(p)).join("");
  }

  function productCard(p) {
    const tagClass = p.badge === "Premium" || p.badge === "Edición limitada" ? "product__tag--gold" : "";
    return `
      <article class="product" data-id="${p.id}">
        <div class="product__media">
          ${p.badge ? `<span class="product__tag ${tagClass}">${escapeHtml(p.badge)}</span>` : ""}
          <img class="product__img" src="${p.image}" alt="${escapeHtml(p.name)} OldWays Tallow, tarro de ${escapeHtml(p.weight)}" loading="lazy" width="600" height="600" />
        </div>
        <div class="product__body">
          <h3 class="product__name">${escapeHtml(p.name)}</h3>
          <p class="product__desc">${escapeHtml(p.desc)}</p>
          <div class="product__meta">
            <span class="product__weight">${escapeHtml(p.weight)}</span>
            <span class="product__made">Hecho por pedido</span>
          </div>
          <div class="product__footer">
            <span class="product__price">${money(p.price)}<small>IVA incluido</small></span>
            <button class="btn btn--primary add-button" data-add="${p.id}">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Agregar
            </button>
          </div>
        </div>
      </article>`;
  }

  /* ------------------- Render: carrito ------------------- */
  function renderCart() {
    const wrap = $("#cartItems");
    if (!wrap) return;

    if (cart.length === 0) {
      wrap.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
            <path d="M2.5 3h2.2l2.3 12.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.6L21 7H6"/>
          </svg>
          <strong>Tu carrito está vacío</strong>
          Agrega tus grasas favoritas desde la sección de productos.
        </div>`;
    } else {
      wrap.innerHTML = cart.map((it) => cartItemRow(it)).join("");
    }

    const totalEl = $("#cartTotal");
    if (totalEl) totalEl.textContent = money(cartTotal());

    const badge = $("#cartBadge");
    const count = cartCount();
    if (badge) {
      badge.textContent = count;
      badge.hidden = count === 0;
    }

    const clearBtn = $("#clearCartButton");
    const checkoutBtn = $("#checkoutButton");
    if (clearBtn) clearBtn.disabled = cart.length === 0;
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    saveCart();
  }

  function cartItemRow(it) {
    const p = byId(it.id);
    return `
      <div class="cart-item" data-id="${p.id}">
        <img class="cart-item__img" src="${p.image}" alt="${escapeHtml(p.name)}" width="72" height="72" />
        <div class="cart-item__info">
          <span class="cart-item__name">${escapeHtml(p.name)}</span>
          <span class="cart-item__weight">${escapeHtml(p.weight)} · ${money(p.price)} c/u</span>
          <div class="cart-item__row">
            <div class="qty" role="group" aria-label="Cantidad de ${escapeHtml(p.name)}">
              <button type="button" data-dec="${p.id}" aria-label="Quitar una unidad">−</button>
              <span aria-live="polite">${it.qty}</span>
              <button type="button" data-inc="${p.id}" aria-label="Agregar una unidad">+</button>
            </div>
            <span class="cart-item__price">${money(p.price * it.qty)}</span>
          </div>
          <button type="button" class="cart-item__remove" data-remove="${p.id}">Eliminar</button>
        </div>
      </div>`;
  }

  /* ------------------- Acciones del carrito ------------------- */
  function addToCart(id, qty = 1) {
    const product = byId(id);
    if (!product) return;
    const existing = cart.find((it) => it.id === id);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
    } else {
      cart.push({ id, qty });
    }
    renderCart();
    pulseBadge();
    toast(`${product.name} agregado al carrito`);
  }

  function changeQty(id, delta) {
    const item = cart.find((it) => it.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((it) => it.id !== id);
    renderCart();
  }

  function removeItem(id) {
    const product = byId(id);
    cart = cart.filter((it) => it.id !== id);
    renderCart();
    if (product) toast(`${product.name} eliminado`);
  }

  function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    renderCart();
    toast("Carrito vaciado");
  }

  /* ------------------- Pedido / formulario ------------------- */
  function makeOrderNumber() {
    const d = new Date();
    const ymd =
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OW-${ymd}-${rand}`;
  }

  function showModal() {
    if (!orderModal) return;
    if (overlay) {
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("is-open"));
    }
    orderModal.hidden = false;
    requestAnimationFrame(() => orderModal.classList.add("is-open"));
    orderModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function openOrderForm() {
    if (cart.length === 0) return;
    if (!orderModal) return;

    // Oculta el panel del carrito pero mantiene el fondo oscurecido.
    drawer?.classList.remove("is-open");
    drawer?.setAttribute("aria-hidden", "true");

    orderForm?.reset();
    setOrderError("");
    if (orderForm) orderForm.hidden = false;
    if (orderSuccess) orderSuccess.hidden = true;
    if (orderTotalEl) orderTotalEl.textContent = money(cartTotal());
    setOrderSubmitting(false);

    showModal();
    setTimeout(() => $("#fieldName")?.focus(), 260);
  }

  function showOrderSuccess(orderNumber, customerEmailSent = true) {
    if (orderNumberOut) orderNumberOut.textContent = orderNumber || "—";
    const hint = $("#orderSuccessHint");
    if (hint) {
      hint.textContent = customerEmailSent
        ? "Te enviamos un correo de confirmación a la dirección que indicaste."
        : "Recibimos tu pedido. No pudimos enviar el correo de confirmación automático, pero nos pondremos en contacto contigo.";
    }
    if (orderForm) orderForm.hidden = true;
    if (orderSuccess) orderSuccess.hidden = false;
    showModal();
  }

  function closeOrderForm() {
    if (!orderModal) return;
    orderModal.classList.remove("is-open");
    orderModal.setAttribute("aria-hidden", "true");
    setTimeout(() => { orderModal.hidden = true; }, 280);
    overlay?.classList.remove("is-open");
    if (drawer) drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { if (overlay) overlay.hidden = true; }, 300);
  }

  function setOrderSubmitting(on) {
    const btn = $("#orderSubmit");
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on ? "Enviando…" : "Enviar pedido";
  }

  function setOrderError(message) {
    const el = $("#orderError");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!orderForm.checkValidity()) { orderForm.reportValidity(); return; }

    const name = $("#fieldName")?.value.trim() || "";
    const email = $("#fieldEmail")?.value.trim() || "";
    const phone = $("#fieldPhone")?.value.trim() || "";
    const company = $("#fieldCompany")?.value || "";
    const orderNumber = makeOrderNumber();
    const items = cart.map((it) => {
      const p = byId(it.id);
      return { id: p.id, name: p.name, weight: p.weight, qty: it.qty, price: p.price };
    });

    setOrderError("");
    setOrderSubmitting(true);

    try {
      const res = await fetch(ORDER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, orderNumber, items }),
      });

      let data = {};
      try { data = await res.json(); } catch { /* respuesta sin JSON */ }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      cart = [];
      renderCart();
      saveCart();
      showOrderSuccess(orderNumber, data.customerEmailSent !== false);
    } catch (err) {
      console.error("No se pudo enviar el pedido:", err);
      const detail = err?.message || "error de red";
      setOrderError(
        `No pudimos enviar tu pedido (${detail}). Revisa tu conexión e inténtalo de nuevo. ` +
        `Si el problema continúa, escríbenos a ${CONTACT_EMAIL}.`
      );
    } finally {
      setOrderSubmitting(false);
    }
  }

  /* ------------------- UI: drawer, toast, menú ------------------- */
  const drawer = $("#cartDrawer");
  const overlay = $("#overlay");
  const toastEl = $("#toast");
  const orderModal = $("#orderModal");
  const orderForm = $("#orderForm");
  const orderSuccess = $("#orderSuccess");
  const orderTotalEl = $("#orderTotal");
  const orderNumberOut = $("#orderNumberOut");
  let toastTimer;

  function openCart() {
    if (!drawer) return;
    renderCart();
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      drawer.classList.add("is-open");
    });
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("#cartClose")?.focus();
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { overlay.hidden = true; }, 300);
  }

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      setTimeout(() => { toastEl.hidden = true; }, 320);
    }, 2400);
  }

  function pulseBadge() {
    const badge = $("#cartBadge");
    if (!badge || badge.hidden) return;
    badge.style.animation = "none";
    void badge.offsetWidth;
    badge.style.animation = "";
  }

  /* ------------------- Eventos ------------------- */
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      const id = addBtn.getAttribute("data-add");
      addBtn.classList.add("btn--added");
      const original = addBtn.innerHTML;
      addBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Agregado';
      setTimeout(() => { addBtn.classList.remove("btn--added"); addBtn.innerHTML = original; }, 1300);
      addToCart(id);
      return;
    }

    const inc = e.target.closest("[data-inc]");
    if (inc) return changeQty(inc.getAttribute("data-inc"), 1);

    const dec = e.target.closest("[data-dec]");
    if (dec) return changeQty(dec.getAttribute("data-dec"), -1);

    const rem = e.target.closest("[data-remove]");
    if (rem) return removeItem(rem.getAttribute("data-remove"));
  });

  $("#cartButton")?.addEventListener("click", openCart);
  $("#cartClose")?.addEventListener("click", closeCart);
  $("#clearCartButton")?.addEventListener("click", clearCart);
  $("#checkoutButton")?.addEventListener("click", openOrderForm);
  $("#orderClose")?.addEventListener("click", closeOrderForm);
  $("#orderCancel")?.addEventListener("click", closeOrderForm);
  $("#orderSuccessClose")?.addEventListener("click", closeOrderForm);
  orderForm?.addEventListener("submit", submitOrder);

  overlay?.addEventListener("click", () => {
    if (orderModal && orderModal.classList.contains("is-open")) closeOrderForm();
    else closeCart();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (orderModal && orderModal.classList.contains("is-open")) closeOrderForm();
    else closeCart();
    closeMenu();
  });

  /* Menú móvil */
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  function closeMenu() {
    if (!mobileMenu || mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    hamburger?.setAttribute("aria-expanded", "false");
  }
  hamburger?.addEventListener("click", () => {
    const open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    hamburger.setAttribute("aria-expanded", String(open));
  });
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", closeMenu));

  /* Header al hacer scroll + enlace activo */
  const header = $("#siteHeader");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");

  function onScroll() {
    header?.classList.toggle("is-scrolled", window.scrollY > 10);
    const pos = window.scrollY + window.innerHeight * 0.32;
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.offsetTop <= pos) current = s.id;
    }
    navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${current}`));
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------- Init ------------------- */
  renderProducts();
  renderCart();
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  onScroll();
})();
