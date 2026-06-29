/* =====================================================================
   cart.js — стан кошика (localStorage), міні-кошик (drawer), тости.
   Спільний для всіх сторінок. Публічний API (export): Cart, money, toast, openCart.
   ===================================================================== */
import { PRODUCTS, sizePrice } from "./products.js";
import { escapeHtml, applyImageFallbacks } from "./ui.js";

var KEY = "lileya_cart_v1";
var CUSTOM_KEY = "lileya_custom_v1"; // власні букети (конфігуратор): { "custom:<sig>": {name,price,img} }

export function money(n) {
  return new Intl.NumberFormat("uk-UA").format(n) + " грн";
}
function byId(id) { return (PRODUCTS || []).find(function (p) { return p.id === id; }); }

// Ключ позиції кошика: "id" (розмір S за умовчанням), "id::m"/"id::l" (інший
// розмір) або "custom:<sig>" (власний букет із конфігуратора).
function parseKey(key) {
  var parts = String(key).split("::");
  return { id: parts[0], size: parts[1] || "s" };
}

// Товар каталогу (з урахуванням розміру) АБО синтетичний shape власного
// букета (з окремого сховища). Повертає slim-обʼєкт {id,name,price,img}.
function resolve(key) {
  var c = customs[key];
  if (c) return { id: key, name: c.name, price: c.price, img: c.img, custom: true };
  var k = parseKey(key);
  var p = byId(k.id);
  if (!p) return null;
  var name = p.name + (k.size !== "s" ? " · розмір " + k.size.toUpperCase() : "");
  return { id: p.id, name: name, price: sizePrice(p, k.size), img: p.img, size: k.size };
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch (e) { return {}; }
}
function loadCustoms() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || {}; }
  catch (e) { return {}; }
}
// Прибираємо означення власних букетів, яких уже немає в кошику (без сиріт).
function pruneCustoms() {
  Object.keys(customs).forEach(function (id) { if (!state[id]) delete customs[id]; });
}
function save(state) {
  pruneCustoms();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs)); } catch (e) {}
  emit();
}

var customs = loadCustoms();      // { "custom:<sig>": {name,price,img} }
var state = load(); // { id: qty }  — id товару або "custom:<sig>"

function emit() {
  document.dispatchEvent(new CustomEvent("cart:change"));
}

export const Cart = {
  items: function () {
    return Object.keys(state).map(function (id) {
      var p = resolve(id);
      if (!p) return null;
      return { id: id, qty: state[id], product: p, sum: p.price * state[id] };
    }).filter(Boolean);
  },
  count: function () {
    return Object.keys(state).reduce(function (a, id) { return a + state[id]; }, 0);
  },
  total: function () {
    return Cart.items().reduce(function (a, i) { return a + i.sum; }, 0);
  },
  qty: function (id) { return state[id] || 0; },
  add: function (id, qty, size) {
    qty = qty || 1;
    // Розмір S зберігаємо під «голим» id — сумісно зі старими кошиками.
    var key = (size && size !== "s") ? id + "::" + size : id;
    state[key] = (state[key] || 0) + qty;
    save(state);
    var p = byId(id);
    if (p) toast("Додано до кошика: " + p.name);
    bump();
  },
  // Власний букет із конфігуратора. def: { sig, name, price, img, qty? }.
  // Однакові конфігурації (sig) додаються до однієї позиції.
  addCustom: function (def) {
    if (!def || !def.sig) return;
    var id = "custom:" + def.sig;
    customs[id] = { name: def.name, price: def.price, img: def.img };
    state[id] = (state[id] || 0) + (def.qty || 1);
    save(state);
    toast("Додано до кошика: " + def.name);
    bump();
  },
  setQty: function (id, qty) {
    if (qty <= 0) { delete state[id]; }
    else { state[id] = qty; }
    save(state);
  },
  remove: function (id) { delete state[id]; save(state); },
  clear: function () { state = {}; save(state); }
};

/* ----------------------------- Badge ----------------------------- */
function renderBadge() {
  var c = Cart.count();
  document.querySelectorAll(".cart-count").forEach(function (el) {
    el.textContent = c;
    el.classList.toggle("is-active", c > 0);
  });
}
function bump() {
  document.querySelectorAll(".cart-count").forEach(function (el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  });
}

/* ----------------------------- Drawer ---------------------------- */
function ensureDrawer() {
  if (document.getElementById("cartScrim")) return;
  var html =
    '<div class="scrim" id="cartScrim"></div>' +
    '<aside class="drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Кошик" tabindex="-1">' +
      '<div class="drawer__head">' +
        '<h2>Ваш кошик</h2>' +
        '<button class="drawer__close" id="cartClose" aria-label="Закрити кошик">' +
          '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="drawer__body" id="cartBody"></div>' +
      '<div class="drawer__foot" id="cartFoot"></div>' +
    '</aside>';
  var wrap = document.createElement("div");
  wrap.innerHTML = html;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  document.getElementById("cartScrim").addEventListener("click", closeDrawer);
  document.getElementById("cartClose").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    var d = document.getElementById("cartDrawer");
    if (!d || !d.classList.contains("is-open")) return;
    if (e.key === "Escape") { closeDrawer(); return; }
    if (e.key === "Tab") trapFocus(e, d);
  });
}

// Утримуємо фокус усередині модального кошика (aria-modal).
function trapFocus(e, d) {
  var f = d.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

var lastFocus = null;
function openDrawer() {
  ensureDrawer();
  renderDrawer();
  lastFocus = document.activeElement;
  document.getElementById("cartScrim").classList.add("is-open");
  document.getElementById("cartDrawer").classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(function () { document.getElementById("cartDrawer").focus(); }, 50);
}
function closeDrawer() {
  var s = document.getElementById("cartScrim"), d = document.getElementById("cartDrawer");
  if (s) s.classList.remove("is-open");
  if (d) d.classList.remove("is-open");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}
export { openDrawer as openCart };

function renderDrawer() {
  var body = document.getElementById("cartBody");
  var foot = document.getElementById("cartFoot");
  if (!body) return;
  var items = Cart.items();

  if (!items.length) {
    body.innerHTML =
      '<div class="cart-empty">' +
        '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6"/></svg>' +
        '<p>Кошик поки порожній.<br>Оберіть щось прекрасне у каталозі 🌿</p>' +
        '<a class="btn btn--ghost btn--sm" href="catalog.html" style="margin-top:1rem">До каталогу</a>' +
      '</div>';
    foot.innerHTML = "";
    return;
  }

  var e = escapeHtml;
  body.innerHTML = items.map(function (i) {
    return (
      '<div class="cart-line">' +
        '<img class="cart-line__img" data-img="' + e(i.product.img) + '" alt="' + e(i.product.name) + '" width="72" height="84" loading="lazy">' +
        '<div>' +
          '<div class="cart-line__name">' + e(i.product.name) + '</div>' +
          '<div class="cart-line__price">' + money(i.product.price) + ' / шт</div>' +
          '<button class="cart-line__rm" data-rm="' + e(i.id) + '">' +
            '<svg class="icon" style="width:1em;height:1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg> Видалити' +
          '</button>' +
        '</div>' +
        '<div class="cart-line__end">' +
          '<div class="qty">' +
            '<button data-dec="' + e(i.id) + '" aria-label="Менше">−</button>' +
            '<span>' + i.qty + '</span>' +
            '<button data-inc="' + e(i.id) + '" aria-label="Більше">+</button>' +
          '</div>' +
          '<div class="cart-line__sum">' + money(i.sum) + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  foot.innerHTML =
    '<div class="summary-row"><span>Сума товарів</span><span>' + money(Cart.total()) + '</span></div>' +
    '<div class="summary-row"><span>Доставка</span><span>розраховується при оформленні</span></div>' +
    '<div class="summary-row summary-row--total"><span>Разом</span><b>' + money(Cart.total()) + '</b></div>' +
    '<a class="btn btn--accent btn--block btn--lg" href="cart.html" style="margin-top:1rem">Оформити замовлення</a>' +
    '<button class="btn btn--ghost btn--block btn--sm" id="cartContinue" style="margin-top:.6rem">Продовжити покупки</button>';

  applyImageFallbacks(body);

  body.querySelectorAll("[data-inc]").forEach(function (b) { b.onclick = function () { Cart.setQty(b.dataset.inc, Cart.qty(b.dataset.inc) + 1); renderDrawer(); }; });
  body.querySelectorAll("[data-dec]").forEach(function (b) { b.onclick = function () { Cart.setQty(b.dataset.dec, Cart.qty(b.dataset.dec) - 1); renderDrawer(); }; });
  body.querySelectorAll("[data-rm]").forEach(function (b) { b.onclick = function () { Cart.remove(b.dataset.rm); renderDrawer(); }; });
  var cont = document.getElementById("cartContinue");
  if (cont) cont.onclick = closeDrawer;
}

/* ----------------------------- Toast ----------------------------- */
export function toast(msg) {
  var wrap = document.getElementById("toastWrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.id = "toastWrap"; wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  var t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>' + escapeHtml(msg) + '</span>';
  wrap.appendChild(t);
  requestAnimationFrame(function () { t.classList.add("show"); });
  setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 320); }, 2600);
}

/* --------------------------- Wire up ----------------------------- */
document.addEventListener("cart:change", function () {
  renderBadge();
  if (document.getElementById("cartDrawer") && document.getElementById("cartDrawer").classList.contains("is-open")) renderDrawer();
});

document.addEventListener("DOMContentLoaded", function () {
  renderBadge();
  document.querySelectorAll("[data-open-cart]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openDrawer(); });
  });
});
