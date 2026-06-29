/* =====================================================================
   card.js — ЄДИНЕ джерело розмітки картки товару (.product).
   Використовують home.js (популярні) і catalog.js (каталог).
   opts: { delay?:number, fav?:bool, link?:bool }
     delay — inline data-delay (головна; у каталозі ставиться пізніше);
     fav   — рендерити кнопку «в обране» (каталог);
     link  — назва-посилання на catalog.html?cat=… (головна).
   ===================================================================== */
import { catLabel } from "./products.js";
import { escapeHtml } from "./ui.js";
import { money } from "./cart.js";
import { noteChips } from "./modal.js";
import { Favs } from "./favs.js";

export function productCard(p, opts) {
  opts = opts || {};
  var e = escapeHtml;
  var badge = p.badge
    ? '<span class="product__badge' + (p.badge === "Акція" ? " product__badge--sale" : "") + '">' + e(p.badge) + "</span>"
    : "";
  var oldP = p.old ? "<small>" + money(p.old) + "</small>" : "";
  var fav = !!(opts.fav && Favs && Favs.has(p.id));
  var favBtn = opts.fav
    ? '<button class="product__fav' + (fav ? " is-active" : "") + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "Прибрати з обраного" : "Додати в обране") + '" data-fav="' + e(p.id) + '">' +
        '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>' +
      "</button>"
    : "";
  var delayAttr = opts.delay != null ? ' data-delay="' + opts.delay + '"' : "";
  // Назва — кнопка швидкого перегляду (фокусується з клавіатури; відкриває модалку).
  var name = '<button type="button" class="product__name-btn" data-quickview="' + e(p.id) + '">' + e(p.name) + "</button>";
  return (
    '<article class="product reveal"' + delayAttr + ">" +
      '<div class="product__media">' +
        '<img data-img="' + e(p.img) + '" data-w="600" alt="' + e(p.name) + '" loading="lazy" width="600" height="750">' +
        badge +
        favBtn +
      "</div>" +
      '<div class="product__body">' +
        '<span class="product__cat">' + e(catLabel(p.cat)) + "</span>" +
        '<h3 class="product__name">' + name + "</h3>" +
        '<p class="product__desc">' + e(p.desc) + "</p>" +
        noteChips(p.notes) +
        '<div class="product__foot">' +
          '<span class="price">' + money(p.price) + " " + oldP + "</span>" +
          '<button class="add-btn" data-add="' + e(p.id) + '">' +
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span>У кошик</span>' +
          "</button>" +
        "</div>" +
      "</div>" +
    "</article>"
  );
}
