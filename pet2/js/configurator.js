/* =====================================================================
   configurator.js — «Зберіть власний букет» (головна сторінка).
   Розмір + гама + оформлення + листівка → жива ціна та прев'ю →
   кастомний товар у кошик (Cart.addCustom). Розмітка форми — статична
   в index.html (доступні radio-групи), цей файл лише рахує й додає.
   ===================================================================== */
import { applyImageFallbacks } from "./ui.js";
import { Cart, money, openCart } from "./cart.js";

function run() {
  var root = document.getElementById("configRoot");
  var form = document.getElementById("cfgForm");
  if (!root || !form) return;

  var SIZE = {
    s: { base: 900,  label: "S" },
    m: { base: 1300, label: "M" },
    l: { base: 1800, label: "L" }
  };
  var WRAP = {
    kraft: { add: 0,   label: "крафт" },
    paper: { add: 120, label: "дизайнерський папір" },
    box:   { add: 280, label: "коробка" }
  };
  var PALETTE = {
    pastel: { label: "пастельна", img: "assets/img/pastel.jpg" },
    red:    { label: "червона",   img: "assets/img/classic25.jpg" },
    white:  { label: "біла",      img: "assets/img/angel.jpg" },
    bright: { label: "яскрава",   img: "assets/img/sonce.jpg" }
  };
  var CARD_ADD = 60;

  var imgEl = document.getElementById("cfgImg");
  var capEl = document.getElementById("cfgCap");
  var priceEl = document.getElementById("cfgPrice");
  var btnPriceEl = document.getElementById("cfgBtnPrice");
  var addBtn = document.getElementById("cfgAdd");

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function compute() {
    var size = val("cfg-size") || "m";
    var palette = val("cfg-palette") || "pastel";
    var wrap = val("cfg-wrap") || "kraft";
    var card = val("cfg-card") === "yes";
    var price = SIZE[size].base + WRAP[wrap].add + (card ? CARD_ADD : 0);
    return { size: size, palette: palette, wrap: wrap, card: card, price: price };
  }

  function setImage(palette) {
    var pal = PALETTE[palette];
    if (!pal || !imgEl) return;
    var media = imgEl.parentNode;
    media.classList.add("is-swapping");
    imgEl.setAttribute("data-img", pal.img);
    imgEl.setAttribute("data-w", "700");
    imgEl.alt = "Прев'ю букета · " + pal.label + " гама";
    imgEl.addEventListener("load", function onLoad() {
      imgEl.removeEventListener("load", onLoad);
      media.classList.remove("is-swapping");
    });
    if (applyImageFallbacks) applyImageFallbacks(media);
    else imgEl.src = pal.img;
  }

  function render() {
    var c = compute();
    var pal = PALETTE[c.palette];
    if (capEl) capEl.textContent = cap(pal.label) + " гама";
    var m = money(c.price);
    if (priceEl) priceEl.textContent = m;
    if (btnPriceEl) btnPriceEl.textContent = m;
  }

  function add() {
    var c = compute();
    var pal = PALETTE[c.palette];
    var sig = [c.size, c.palette, c.wrap, c.card ? "c" : "n"].join("-");
    var name = "Власний букет · " + SIZE[c.size].label + " · " + cap(pal.label) +
      " · " + WRAP[c.wrap].label + (c.card ? " · з листівкою" : "");
    Cart.addCustom({ sig: sig, name: name, price: c.price, img: pal.img });
    if (openCart) openCart();
  }

  form.addEventListener("change", function (ev) {
    if (ev.target && ev.target.name === "cfg-palette") setImage(ev.target.value);
    render();
  });
  if (addBtn) addBtn.addEventListener("click", add);

  render(); // початковий стан (M · пастельна · крафт · без листівки)
}
run();
