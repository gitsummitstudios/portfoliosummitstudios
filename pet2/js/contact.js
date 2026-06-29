/* =====================================================================
   contact.js — валідація форми зворотного звʼязку на about.html.
   ===================================================================== */
import { toast } from "./cart.js";

function run() {
  var f = document.getElementById("contactForm");
  if (!f) return;
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    f.querySelectorAll("[required]").forEach(function (i) {
      var v = i.value.trim() !== "";
      i.closest(".field").classList.toggle("invalid", !v);
      if (!v) ok = false;
    });
    if (!ok) return;
    f.reset();
    document.getElementById("contactMsg").textContent = "Дякуємо! Ми зателефонуємо вам найближчим часом.";
    if (toast) toast("Заявку надіслано 🌷");
  });
}
run();
