/* =====================================================================
   catalog.js — рендер каталогу, фільтри за категорією, сортування.
   ===================================================================== */
import { PRODUCTS, CATEGORIES } from "./products.js";
import { escapeHtml, applyImageFallbacks } from "./ui.js";
import { Cart } from "./cart.js";
import { Favs } from "./favs.js";
import { productCard } from "./card.js";

function run() {
  var grid = document.getElementById("catalogGrid");
  if (!grid) return;
  var filtersEl = document.getElementById("catalogFilters");
  var sortEl = document.getElementById("catalogSort");
  var countEl = document.getElementById("catalogCount");

  var activeCat = new URLSearchParams(location.search).get("cat") || "all";
  var sort = "default";
  var io = null; // активний reveal-observer; перевідключаємо на кожен re-render

  function render() {
    var list = (PRODUCTS || []).slice();
    if (activeCat === "favs") {
      list = list.filter(function (p) { return Favs && Favs.has(p.id); });
    } else if (activeCat !== "all") {
      list = list.filter(function (p) { return p.cat === activeCat; });
    }
    if (sort === "asc") list.sort(function (a, b) { return a.price - b.price; });
    if (sort === "desc") list.sort(function (a, b) { return b.price - a.price; });

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
        (activeCat === "favs"
          ? "Ви ще нічого не додали в обране.<br>Натисніть ♥ на букеті, який сподобався — і він зʼявиться тут." +
            '<div style="margin-top:1.2rem"><a class="btn btn--accent" href="catalog.html">Переглянути каталог</a></div>'
          : "Поки немає товарів у цій категорії.") +
        "</div>";
    } else {
      grid.innerHTML = list.map(function (p) { return productCard(p, { fav: true }); }).join("");
    }
    if (countEl) countEl.textContent = list.length + " " + plural(list.length, ["товар", "товари", "товарів"]);
    applyImageFallbacks(grid);
    bind();
    // reveal newly added
    grid.querySelectorAll(".reveal").forEach(function (el, i) {
      el.setAttribute("data-delay", (i % 5) + 1);
    });
    if (io) { io.disconnect(); io = null; } // прибрати попередній перед новим рендером
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      grid.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    } else {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      grid.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    }
  }

  function plural(n, forms) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  function bind() {
    grid.querySelectorAll("[data-add]").forEach(function (b) {
      b.onclick = function () {
        Cart.add(b.dataset.add);
        b.classList.add("added");
        var span = b.querySelector("span"); var prev = span ? span.textContent : "";
        if (span) span.textContent = "Додано";
        setTimeout(function () { b.classList.remove("added"); if (span) span.textContent = prev; }, 1300);
      };
    });
    grid.querySelectorAll("[data-fav]").forEach(function (b) {
      b.onclick = function () {
        var active = Favs ? Favs.toggle(b.dataset.fav) : b.classList.toggle("is-active");
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.setAttribute("aria-label", active ? "Прибрати з обраного" : "Додати в обране");
        // У вью «Обране» зняте серце має одразу прибрати картку зі списку.
        if (activeCat === "favs") render();
      };
    });
  }

  function buildFilters() {
    if (!filtersEl) return;
    var favChip =
      '<button class="chip chip--fav" data-cat="favs" aria-pressed="' + (activeCat === "favs") + '">' +
        '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>' +
        "<span>Обране</span></button>";
    filtersEl.innerHTML = favChip + (CATEGORIES || []).map(function (c) {
      return '<button class="chip" data-cat="' + escapeHtml(c.key) + '" aria-pressed="' + (c.key === activeCat) + '">' + escapeHtml(c.label) + "</button>";
    }).join("");
    filtersEl.querySelectorAll("[data-cat]").forEach(function (b) {
      b.onclick = function () {
        activeCat = b.dataset.cat;
        filtersEl.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.cat === activeCat); });
        history.replaceState(null, "", activeCat === "all" ? location.pathname : "?cat=" + activeCat);
        render();
      };
    });
  }

  if (sortEl) sortEl.addEventListener("change", function () { sort = sortEl.value; render(); });

  buildFilters();
  render();
}
run();
