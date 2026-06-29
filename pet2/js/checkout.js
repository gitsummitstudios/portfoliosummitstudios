/* =====================================================================
   checkout.js — сторінка кошика + оформлення + (хук) оплата.
   ===================================================================== */
import { escapeHtml, applyImageFallbacks } from "./ui.js";
import { Cart, money, toast } from "./cart.js";

function run() {
  var root = document.getElementById("checkoutRoot");
  if (!root) return;

  var DELIVERY_FREE_FROM = 1500;
  var DELIVERY_COST = 150;

  function deliveryMethod() {
    return (document.querySelector('input[name="delivery"]:checked') || {}).value;
  }
  function deliveryCost() {
    if (deliveryMethod() === "pickup") return 0;
    return Cart.total() >= DELIVERY_FREE_FROM ? 0 : DELIVERY_COST;
  }

  // Самовивіз не потребує адреси — ховаємо поле й знімаємо required,
  // щоб валідація не блокувала оформлення.
  function syncDelivery() {
    var addr = document.getElementById("addr");
    if (!addr) return;
    var field = addr.closest(".field");
    var pickup = deliveryMethod() === "pickup";
    addr.required = !pickup;
    if (field) field.style.display = pickup ? "none" : "";
    if (pickup) { field && field.classList.remove("invalid"); }
  }

  function renderItems() {
    var box = document.getElementById("osItems");
    var items = Cart.items();
    if (!items.length) { renderEmpty(); return; }
    var e = escapeHtml;
    box.innerHTML = items.map(function (i) {
      return (
        '<div class="os-line">' +
          '<img data-img="' + e(i.product.img) + '" alt="' + e(i.product.name) + '" width="56" height="66" loading="lazy">' +
          '<div><div class="os-line__name">' + e(i.product.name) + "</div>" +
          '<div class="os-line__qty">' + i.qty + " × " + money(i.product.price) + "</div></div>" +
          '<div class="cart-line__sum">' + money(i.sum) + "</div>" +
        "</div>"
      );
    }).join("");
    applyImageFallbacks(box);
    renderTotals();
  }

  function renderTotals() {
    var d = deliveryCost();
    var sub = Cart.total();
    var box = document.getElementById("osTotals");
    box.innerHTML =
      '<div class="summary-row"><span>Товари (' + Cart.count() + ")</span><span>" + money(sub) + "</span></div>" +
      '<div class="summary-row"><span>Доставка</span><span>' + (d === 0 ? "Безкоштовно" : money(d)) + "</span></div>" +
      '<div class="summary-row summary-row--total"><span>До сплати</span><b>' + money(sub + d) + "</b></div>" +
      (sub < DELIVERY_FREE_FROM
        ? '<p class="hint" style="margin-top:.6rem">Додайте товарів на ' + money(DELIVERY_FREE_FROM - sub) + " — і доставка безкоштовна 🌿</p>"
        : "");
  }

  function renderEmpty() {
    root.innerHTML =
      '<div class="cart-empty" style="padding:5rem 1rem">' +
        '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D9C29A" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6"/></svg>' +
        '<h2 style="margin:1rem 0 .4rem">Кошик порожній</h2>' +
        '<p>Оберіть букет — і повертайтеся до оформлення.</p>' +
        '<a class="btn btn--accent btn--lg" href="catalog.html" style="margin-top:1.4rem">Перейти до каталогу</a>' +
      "</div>";
  }

  /* ----------------------------- Validation ------------------------ */
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (f) {
      var field = f.closest(".field");
      var valid = f.value.trim() !== "" && (f.type !== "tel" || /[0-9]{6,}/.test(f.value.replace(/\D/g, "")));
      if (f.type === "email") valid = valid && EMAIL_RE.test(f.value);
      field.classList.toggle("invalid", !valid);
      if (!valid && ok) { f.focus(); ok = false; }
    });
    // Email необов'язковий — але якщо введено, має бути коректним.
    var email = form.querySelector('input[type="email"]:not([required])');
    if (email && email.value.trim() !== "" && !EMAIL_RE.test(email.value)) {
      email.closest(".field").classList.add("invalid");
      if (ok) { email.focus(); ok = false; }
    }
    return ok;
  }

  /* ----------------------------- Submit ---------------------------- */
  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    if (!Cart.items().length) { toast("Кошик порожній"); return; }
    if (!validate(form)) { toast("Перевірте виділені поля"); return; }

    var pay = (document.querySelector('input[name="pay"]:checked') || {}).value;
    var data = Object.fromEntries(new FormData(form).entries());
    data.items = Cart.items().map(function (i) { return i.qty + "× " + i.product.name; }).join(", ");
    data.total = Cart.total() + deliveryCost();

    if (pay === "liqpay") {
      // --- ХУК ОНЛАЙН-ОПЛАТИ (LiqPay) ---------------------------------
      // Потрібен бекенд, що поверне { data, signature } (підпис приватним
      // ключем). Деталі та приклад — у README.md, розділ «Онлайн-оплата».
      toast("Онлайн-оплату буде активовано після підключення LiqPay (див. README)");
      // submitToLiqPay(data);  // ← розкоментуйте, коли буде бекенд
      return;
    }

    // Оплата при отриманні / переказ — заявку «надсилаємо» магазину.
    // TODO: підключіть Formspree / Telegram-бот (приклад у README).
    success(data);
  }

  function success(data) {
    Cart.clear();
    root.innerHTML =
      '<div class="panel center" style="max-width:560px;margin-inline:auto">' +
        '<div class="feature__icon" style="margin:0 auto 1rem;width:64px;height:64px;background:var(--green-50)">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
        "</div>" +
        '<h2>Дякуємо за замовлення!</h2>' +
        '<p style="margin:.6rem 0 0">' + escapeHtml(data.name || "") + ", ваше замовлення прийнято. Флорист зателефонує вам найближчим часом для підтвердження деталей доставки.</p>" +
        '<p class="hint" style="margin-top:1rem">Сума: <b>' + money(data.total) + "</b></p>" +
        '<a class="btn btn--ghost btn--lg" href="catalog.html" style="margin-top:1.4rem">Повернутись до каталогу</a>' +
      "</div>";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("cart:change", function () {
    if (document.getElementById("osItems")) { renderItems(); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.name === "delivery") { syncDelivery(); renderTotals(); }
    else if (e.target.name === "pay") renderTotals();
  });

  if (!Cart.items().length) { renderEmpty(); return; }
  renderItems();
  syncDelivery();
  var form = document.getElementById("checkoutForm");
  if (form) form.addEventListener("submit", onSubmit);
}
run();
