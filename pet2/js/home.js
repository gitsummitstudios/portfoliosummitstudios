/* =====================================================================
   home.js — рендер 4 популярних букетів на головній сторінці.
   ===================================================================== */
import { PRODUCTS } from "./products.js";
import { applyImageFallbacks } from "./ui.js";
import { Cart } from "./cart.js";
import { productCard } from "./card.js";

function run() {
  var grid = document.getElementById("featuredGrid");
  if (!grid || !PRODUCTS) return;
  var ids = ["neznist", "classic25", "pastel", "rozkish"];
  var list = ids.map(function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); }).filter(Boolean);
  grid.innerHTML = list.map(function (p, i) {
    return productCard(p, { delay: (i % 4) + 1, link: true });
  }).join("");
  applyImageFallbacks(grid);
  grid.querySelectorAll("[data-add]").forEach(function (b) {
    b.onclick = function () { Cart.add(b.dataset.add); var s = b.querySelector("span"); var p = s.textContent; s.textContent = "Додано"; b.classList.add("added"); setTimeout(function(){ b.classList.remove("added"); s.textContent = p; }, 1300); };
  });
}
run();
