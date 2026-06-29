/* =====================================================================
   ui.js — навігація, scroll-reveal, плейсхолдери зображень.
   ===================================================================== */
import { imgURL } from "./products.js";

/* ---- Екранування для будь-яких даних, що йдуть у innerHTML ----- */
export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---- Елегантний SVG-плейсхолдер, якщо фото не завантажилось ---- */
export function placeholder(label) {
  var txt = (label || "Лілея").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#F3EEE6"/><stop offset="1" stop-color="#E7F0E8"/></linearGradient></defs>' +
    '<rect width="600" height="750" fill="url(#g)"/>' +
    '<g fill="none" stroke="#15803D" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(300 320)">' +
    '<path d="M0 120 L0 0"/>' +
    '<path d="M0 30 C-70 20 -110 -25 -120 -85 C-50 -75 -10 -35 0 30Z" fill="#15803D" fill-opacity="0.08"/>' +
    '<path d="M0 60 C70 50 110 5 120 -55 C50 -45 10 0 0 60Z" fill="#15803D" fill-opacity="0.08"/>' +
    '<path d="M0 0 C-55 -55 -55 -150 0 -210 C55 -150 55 -55 0 0Z"/>' +
    '<path d="M0 0 C65 -40 165 -45 230 0 C150 45 50 35 0 0Z"/>' +
    '<path d="M0 0 C-65 -40 -165 -45 -230 0 C-150 45 -50 35 0 0Z"/>' +
    '<circle cx="0" cy="-15" r="14" fill="#DB2777" fill-opacity="0.5" stroke="none"/></g>' +
    '<text x="300" y="560" text-anchor="middle" font-family="Prata, Georgia, serif" font-size="34" fill="#14532D" fill-opacity="0.55">' + txt + '</text>' +
    '</svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Перетворює <img data-img="photoId" alt="..."> на справжній src + fallback
export function applyImageFallbacks(root) {
  (root || document).querySelectorAll("img[data-img]").forEach(function (img) {
    var id = img.getAttribute("data-img");
    img.removeAttribute("data-img");
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      img.src = placeholder(img.getAttribute("alt"));
    });
    img.src = imgURL(id, img.dataset.w || 700);
  });
}

/* ---------------------- Header scroll state --------------------- */
function header() {
  var h = document.querySelector(".site-header");
  if (!h) return;
  var on = function () { h.classList.toggle("is-scrolled", window.scrollY > 24); };
  on();
  window.addEventListener("scroll", on, { passive: true });
}

/* ------------------------- Mobile nav --------------------------- */
function mobileNav() {
  var t = document.querySelector(".nav__toggle");
  if (!t) return;
  t.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    t.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("nav-open"); t.setAttribute("aria-expanded", "false"); });
  });
}

/* ----------------------- Scroll reveal -------------------------- */
function reveal() {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });
}

/* --------------------------- Year ------------------------------ */
function year() {
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
}

/* --------------- М'який тематичний курсор (пелюстка) ------------ */
/* Делікатний слід-пелюстка, що з затримкою тягнеться за вказівником
   і м'яко розкривається над інтерактивним. Лише десктоп (точний
   вказівник) і за вимкненого reduced-motion — щоб не заважати. */
function softCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var el = document.createElement("div");  el.className = "cursor-petal"; el.setAttribute("aria-hidden", "true");
  var dot = document.createElement("div"); dot.className = "cursor-dot";  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(el); document.body.appendChild(dot);

  var x = 0, y = 0, tx = 0, ty = 0, shown = false, raf = null;
  function loop() {
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    el.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%) rotate(45deg)";
    // засинаємо, коли курсор у спокої — не тримаємо кадри даремно
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(loop);
    else raf = null;
  }
  function hot(on) {
    return function (e) {
      if (e.target.closest("a, button, .product, input, select, textarea, label, [role='button']")) {
        el.classList.toggle("is-hot", on); dot.classList.toggle("is-hot", on);
      }
    };
  }
  window.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";  // крапка точно за вказівником
    if (!shown) { shown = true; x = tx; y = ty; el.classList.add("is-on"); dot.classList.add("is-on"); }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener("mouseover", hot(true));
  document.addEventListener("mouseout", hot(false));
  document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); dot.classList.remove("is-on"); });
}

/* ----------- Пелюстковий «вибух» при додаванні в кошик ---------- */
function petalBurst(x, y) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var COLORS = ["#CE8675", "#D9C29A", "#F1DDD6", "#B5604C", "#C2705B"];
  for (var i = 0; i < 7; i++) {
    var s = document.createElement("span");
    s.className = "petal-fly";
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.setProperty("--dx", Math.round(Math.random() * 100 - 50) + "px");
    s.style.setProperty("--dy", -(45 + Math.round(Math.random() * 80)) + "px");
    s.style.setProperty("--rot", Math.round(Math.random() * 320 - 160) + "deg");
    s.style.background = COLORS[i % COLORS.length];
    s.style.animationDelay = Math.round(Math.random() * 70) + "ms";
    s.addEventListener("animationend", function () { this.remove(); });
    document.body.appendChild(s);
  }
}
document.addEventListener("click", function (e) {
  if (e.target.closest("[data-add], #cfgAdd, #pmAdd")) petalBurst(e.clientX, e.clientY);
});

/* -------------------- Магнітні CTA-кнопки ---------------------- */
function magneticButtons() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".btn--accent").forEach(function (b) {
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.25) + "px," +
                                          ((e.clientY - r.top - r.height / 2) * 0.4) + "px)";
    });
    b.addEventListener("mouseleave", function () { b.style.transform = ""; });
  });
}

/* --------- «Живий» hero: паралакс глибини + лічильники ---------- */
function heroAlive() {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Паралакс шарів (лише точний вказівник, не reduced-motion)
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    var raf = null, nx = 0, ny = 0;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      ny = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        hero.style.setProperty("--px", nx.toFixed(3));
        hero.style.setProperty("--py", ny.toFixed(3));
        raf = null;
      });
    }, { passive: true });
    hero.addEventListener("mouseleave", function () {
      hero.style.setProperty("--px", "0"); hero.style.setProperty("--py", "0");
    });
  }

  // Лічильники в hero__stats (рахуються вгору при завантаженні)
  if (reduce) return;
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  document.querySelectorAll(".hero__stats b").forEach(function (b) {
    var raw = b.textContent;
    var m = raw.match(/\d[\d \s]*\d|\d/);
    if (!m) return;
    var target = parseInt(m[0].replace(/[^\d]/g, ""), 10);
    if (!target) return;
    var pre = raw.slice(0, m.index), suf = raw.slice(m.index + m[0].length);
    var dur = 2400, t0 = null;
    b.textContent = pre + "0" + suf;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      b.textContent = pre + fmt(Math.round(target * e)) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  applyImageFallbacks(document);
  header(); mobileNav(); reveal(); year(); softCursor(); magneticButtons(); heroAlive();
});
