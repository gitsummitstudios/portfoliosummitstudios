/* =====================================================================
   chrome.js — ЄДИНЕ джерело шапки (header) та підвалу (footer)
   для всіх сторінок. Кожна сторінка містить лише порожні плейсхолдери:

     <header class="site-header" data-chrome="header"></header>
     <footer class="site-footer" data-chrome="footer" data-variant="…"></footer>

   а активний пункт меню задається через <body data-page="home|catalog|about|cart">.

   Заповнюємо синхронно (одразу, ще до DOMContentLoaded), тому:
   • cart.js / ui.js знаходять .cart-count, [data-open-cart], .nav__toggle;
   • ui.js year() заповнює [data-year] у вже вставленому підвалі;
   • шапка position:fixed → жодного зсуву макета (CLS).

   Розмітка тут статична й довірена — екранування не потрібне.
   ===================================================================== */

  /* Логотип-лілея: 40px у шапці, 36px (без центральної крапки) у підвалі. */
  var MARK_HEADER =
    '<svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 37c0-7 0-13 0-17"/><path d="M20 20c-3.5-3.5-3.5-11 0-16 3.5 5 3.5 12.5 0 16Z"/><path d="M20 20c4-2.5 11-3 15.5.5C30.5 23.5 23.5 22.5 20 20Z"/><path d="M20 20c-4-2.5-11-3-15.5.5C9.5 23.5 16.5 22.5 20 20Z"/><circle cx="20" cy="19" r="1.4" fill="currentColor" stroke="none"/></svg>';
  var MARK_FOOTER =
    '<svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 37c0-7 0-13 0-17"/><path d="M20 20c-3.5-3.5-3.5-11 0-16 3.5 5 3.5 12.5 0 16Z"/><path d="M20 20c4-2.5 11-3 15.5.5C30.5 23.5 23.5 22.5 20 20Z"/><path d="M20 20c-4-2.5-11-3-15.5.5C9.5 23.5 16.5 22.5 20 20Z"/></svg>';
  var CART_ICON =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2.2l2.3 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6"/></svg>';
  var FAV_ICON =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';

  /* page === активний пункт; пункти без page ніколи не підсвічуються. */
  var NAV = [
    { href: "index.html", label: "Головна", page: "home" },
    { href: "catalog.html", label: "Каталог", page: "catalog" },
    { href: "about.html", label: "Про нас", page: "about" },
    { href: "about.html#delivery", label: "Доставка" },
    { href: "about.html#contacts", label: "Контакти" }
  ];

  function headerHTML(page) {
    var links = NAV.map(function (n) {
      var current = n.page && n.page === page ? ' aria-current="page"' : "";
      return '<a href="' + n.href + '"' + current + ">" + n.label + "</a>";
    }).join("");
    return (
      '<div class="container nav">' +
        '<a class="brand" href="index.html" aria-label="Лілея — на головну">' +
          '<span class="brand__mark" aria-hidden="true">' + MARK_HEADER + "</span>" +
          "<span><span class=\"brand__name\">Лілея</span><span class=\"brand__sub\">Лубни · флористика</span></span>" +
        "</a>" +
        '<nav class="nav__links" aria-label="Головне меню">' + links + "</nav>" +
        '<div class="nav__actions">' +
          '<a class="btn btn--accent btn--sm" href="catalog.html">Замовити букет</a>' +
          '<a class="cart-btn fav-btn" href="catalog.html?cat=favs" aria-label="Обране" title="Обране">' + FAV_ICON +
            '<span class="fav-count" aria-live="polite">0</span></a>' +
          '<button class="cart-btn" data-open-cart aria-label="Відкрити кошик">' + CART_ICON +
            '<span class="cart-count" aria-live="polite">0</span></button>' +
          '<button class="nav__toggle" aria-label="Меню" aria-expanded="false"><span></span></button>' +
        "</div>" +
      "</div>"
    );
  }

  var SOCIALS =
    '<a href="#" aria-label="Instagram"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>' +
    '<a href="#" aria-label="Facebook"><svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.6-1.5H16V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.9V11H7.5v3H10v8h3Z"/></svg></a>' +
    '<a href="#" aria-label="Telegram"><svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3Z"/></svg></a>' +
    '<a href="viber://chat" aria-label="Viber"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3c4.5 0 8 3 8 7.5 0 3.7-2.5 6.6-6.2 7.3l-3.8 2.7v-2.8C6 24 4 21 4 17.5 4 13 7.5 3 12 3Z"/><path d="M9 9c1.5 0 4.5 1 6 4"/></svg></a>';

  var FOOTER_GRID =
    '<div class="footer-grid">' +
      '<div class="footer-brand">' +
        '<a class="brand" href="index.html"><span class="brand__mark" aria-hidden="true">' + MARK_FOOTER + '</span><span class="brand__name">Лілея</span></a>' +
        "<p>Квіткова майстерня у Лубнах. Свіжі квіти та авторські букети з доставкою по місту.</p>" +
        '<div class="socials">' + SOCIALS + "</div>" +
      "</div>" +
      '<div class="footer-col"><h4>Каталог</h4>' +
        '<a href="catalog.html?cat=bouquets">Авторські букети</a><a href="catalog.html?cat=roses">Троянди</a><a href="catalog.html?cat=wedding">Весільні</a><a href="catalog.html?cat=boxes">Композиції</a><a href="catalog.html?cat=plants">Рослини</a>' +
      "</div>" +
      '<div class="footer-col"><h4>Інформація</h4>' +
        '<a href="about.html">Про нас</a><a href="about.html#delivery">Доставка й оплата</a><a href="about.html#contacts">Контакти</a><a href="catalog.html">Замовити</a>' +
      "</div>" +
      '<div class="footer-col"><h4>Контакти</h4>' +
        '<a href="tel:+380501234567">+38 (050) 123-45-67</a><a href="mailto:hello@lileya.ua">hello@lileya.ua</a><span>м. Лубни, вул. Ярослава Мудрого, 12</span><span>Щодня 8:00 – 20:00</span>' +
      "</div>" +
    "</div>";

  var COPYRIGHT =
    "<span>© <span data-year>2026</span> Квіткова майстерня «Лілея». Демонстраційний сайт.</span>" +
    "<span>Зроблено з любов'ю до квітів 🌷</span>";

  function footerHTML(variant) {
    var bottom = variant === "minimal"
      ? '<div class="footer-bottom" style="border:0;margin:0;padding-top:0">' + COPYRIGHT + "</div>"
      : FOOTER_GRID + '<div class="footer-bottom">' + COPYRIGHT + "</div>";
    return '<div class="container">' + bottom + "</div>";
  }

  function render() {
    var body = document.body;
    var header = document.querySelector('[data-chrome="header"]');
    if (header) header.innerHTML = headerHTML(body && body.getAttribute("data-page"));
    var footer = document.querySelector('[data-chrome="footer"]');
    if (footer) footer.innerHTML = footerHTML(footer.getAttribute("data-variant") || "full");
  }

  // Скрипт підключено в кінці <body>, тож плейсхолдери вже розпарсені.
  // Та про всяк випадок підстраховуємось, якщо його перемістять у <head>.
  if (document.body) render();
  else document.addEventListener("DOMContentLoaded", render);
