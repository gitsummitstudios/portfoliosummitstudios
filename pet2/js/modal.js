/* =====================================================================
   modal.js — швидкий перегляд букета (lightbox-модалка).
   Публічний API (export): Modal.open(id) / .close()
   Допоміжне: noteChips(notes, extraClass) — чипи-аромати
   (використовується також у картках товарів).
   Переюзує патерни drawer'а з cart.js: scrim, focus-trap, ESC,
   body overflow:hidden, відновлення фокуса, prefers-reduced-motion.
   ===================================================================== */
import { PRODUCTS, sizePrice, catLabel } from "./products.js";
import { escapeHtml, applyImageFallbacks } from "./ui.js";
import { money, Cart, openCart } from "./cart.js";
import { Favs } from "./favs.js";

var e = escapeHtml;
function byId(id) { return (PRODUCTS || []).find(function (p) { return p.id === id; }); }
function priceFor(p, size) { return sizePrice(p, size); }

/* Чипи-аромати — спільний рендер для карток і модалки. */
export function noteChips(notes, extra) {
  if (!notes || !notes.length) return "";
  return '<ul class="note-chips' + (extra ? " " + extra : "") + '">' +
    notes.map(function (n) {
      return '<li class="note-chip"><span class="note-chip__d" aria-hidden="true">♦</span>' + e(n) + "</li>";
    }).join("") + "</ul>";
}

var ICON_CLOSE = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
var ICON_CART = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
var ICON_HEART = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';

var current = null; // { id, size, qty }
var lastFocus = null;

function ensureModal() {
  if (document.getElementById("pmScrim")) return;
  var html =
    '<div class="modal-scrim" id="pmScrim"></div>' +
    '<div class="pmodal" id="pmodal" role="dialog" aria-modal="true" aria-labelledby="pmName" tabindex="-1">' +
      '<button class="pmodal__close" id="pmClose" aria-label="Закрити перегляд">' + ICON_CLOSE + "</button>" +
      '<div class="pmodal__grid">' +
        '<div class="pmodal__media"><img id="pmImg" alt="" width="720" height="900" decoding="async"></div>' +
        '<div class="pmodal__info" id="pmInfo"></div>' +
      "</div>" +
    "</div>";
  var wrap = document.createElement("div");
  wrap.innerHTML = html;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  document.getElementById("pmScrim").addEventListener("click", close);
  document.getElementById("pmClose").addEventListener("click", close);
  document.addEventListener("keydown", function (ev) {
    var m = document.getElementById("pmodal");
    if (!m || !m.classList.contains("is-open")) return;
    if (ev.key === "Escape") { close(); return; }
    if (ev.key === "Tab") trapFocus(ev, m);
  });
}

function trapFocus(ev, m) {
  var f = m.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
}

function renderInfo() {
  var p = byId(current.id);
  if (!p) return;
  var info = document.getElementById("pmInfo");
  var fav = !!(Favs && Favs.has(p.id));
  var sizes = p.sizes || [];

  var sizeBtns = sizes.map(function (s) {
    var on = s.key === current.size;
    return '<button type="button" class="size-opt' + (on ? " is-active" : "") + '" data-size="' + e(s.key) + '" aria-pressed="' + on + '">' +
      "<b>" + e(s.label) + "</b><small>" + e(s.note || "") + "</small></button>";
  }).join("");

  var comp = (p.composition || []).map(function (c) { return "<li>" + e(c) + "</li>"; }).join("");

  info.innerHTML =
    '<span class="pmodal__cat">' + e(catLabel(p.cat)) + "</span>" +
    '<h2 class="pmodal__name" id="pmName">' + e(p.name) + "</h2>" +
    (p.story ? '<p class="pmodal__story">' + e(p.story) + "</p>" : "") +
    (p.notes && p.notes.length
      ? '<div class="pmodal__block"><span class="pmodal__label">Аромат</span>' + noteChips(p.notes, "note-chips--lg") + "</div>"
      : "") +
    (comp
      ? '<div class="pmodal__block"><span class="pmodal__label">Склад</span><ul class="pmodal__comp">' + comp + "</ul></div>"
      : "") +
    (sizes.length
      ? '<div class="pmodal__block"><span class="pmodal__label">Розмір</span><div class="size-opts">' + sizeBtns + "</div></div>"
      : "") +
    '<div class="pmodal__buy">' +
      '<div class="qty qty--lg">' +
        '<button type="button" id="pmDec" aria-label="Менше">−</button>' +
        '<span id="pmQty">' + current.qty + "</span>" +
        '<button type="button" id="pmInc" aria-label="Більше">+</button>' +
      "</div>" +
      '<div class="pmodal__pricewrap">' +
        '<span class="pmodal__price" id="pmPrice">' + money(priceFor(p, current.size) * current.qty) + "</span>" +
        '<small class="pmodal__unit" id="pmUnit">' + (current.qty > 1 ? current.qty + " × " + money(priceFor(p, current.size)) : "") + "</small>" +
      "</div>" +
    "</div>" +
    '<div class="pmodal__actions">' +
      '<button type="button" class="btn btn--accent btn--lg" id="pmAdd">' + ICON_CART + "<span>У кошик</span></button>" +
      '<button type="button" class="pmodal__fav' + (fav ? " is-active" : "") + '" id="pmFav" aria-pressed="' + fav + '" aria-label="' + (fav ? "Прибрати з обраного" : "Додати в обране") + '">' + ICON_HEART + "</button>" +
    "</div>";

  info.querySelectorAll("[data-size]").forEach(function (b) {
    b.onclick = function () { current.size = b.dataset.size; renderInfo(); };
  });
  document.getElementById("pmInc").onclick = function () { current.qty++; updateBuy(); };
  document.getElementById("pmDec").onclick = function () { if (current.qty > 1) { current.qty--; updateBuy(); } };
  document.getElementById("pmAdd").onclick = function () {
    Cart.add(p.id, current.qty, current.size);
    close();
    if (openCart) openCart();
  };
  document.getElementById("pmFav").onclick = function () {
    var active = Favs ? Favs.toggle(p.id) : false;
    var b = document.getElementById("pmFav");
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
    b.setAttribute("aria-label", active ? "Прибрати з обраного" : "Додати в обране");
  };
}

function updateBuy() {
  var p = byId(current.id);
  var q = document.getElementById("pmQty");
  var pr = document.getElementById("pmPrice");
  var un = document.getElementById("pmUnit");
  var unit = priceFor(p, current.size);
  if (q) q.textContent = current.qty;
  if (pr) pr.textContent = money(unit * current.qty);
  if (un) un.textContent = current.qty > 1 ? current.qty + " × " + money(unit) : "";
}

function open(id) {
  var p = byId(id);
  if (!p) return;
  ensureModal();
  current = { id: id, size: (sizesFirst(p)), qty: 1 };

  var img = document.getElementById("pmImg");
  img.setAttribute("data-img", p.img);
  img.setAttribute("data-w", "900");
  img.alt = p.name;
  applyImageFallbacks(document.getElementById("pmodal"));

  renderInfo();

  lastFocus = document.activeElement;
  document.getElementById("pmScrim").classList.add("is-open");
  document.getElementById("pmodal").classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(function () { var m = document.getElementById("pmodal"); if (m) m.focus(); }, 50);
}

function sizesFirst(p) { return p.sizes && p.sizes[0] ? p.sizes[0].key : "s"; }

function close() {
  var s = document.getElementById("pmScrim"), m = document.getElementById("pmodal");
  if (s) s.classList.remove("is-open");
  if (m) m.classList.remove("is-open");
  document.body.style.overflow = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

export const Modal = { open: open, close: close };

/* --- Делеговані тригери відкриття модалки --- */
document.addEventListener("click", function (ev) {
  // 1) Явна кнопка швидкого перегляду (назва товару) — працює і з клавіатури.
  var qv = ev.target.closest("[data-quickview]");
  if (qv) { ev.preventDefault(); open(qv.getAttribute("data-quickview")); return; }

  // 2) Клік будь-де по картці (миша) — крім інтерактивних елементів
  //    (♥ / «У кошик» / посилання / поля), які мають власну поведінку.
  var card = ev.target.closest(".product");
  if (!card) return;
  if (ev.target.closest("button, a, input, label")) return;
  var addBtn = card.querySelector("[data-add]");
  if (!addBtn) return;
  ev.preventDefault();
  open(addBtn.dataset.add);
});
