/* =====================================================================
   favs.js — «обране» зі збереженням у localStorage.
   Спільний публічний API (export): Favs. Подія: "favs:change".
   ===================================================================== */
var KEY = "lileya_favs_v1";

function load() {
  try { var a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  document.dispatchEvent(new CustomEvent("favs:change"));
}

var ids = load(); // ["neznist", ...]

export const Favs = {
  list: function () { return ids.slice(); },
  count: function () { return ids.length; },
  has: function (id) { return ids.indexOf(id) !== -1; },
  add: function (id) { if (ids.indexOf(id) === -1) { ids.push(id); save(ids); } },
  remove: function (id) { var i = ids.indexOf(id); if (i !== -1) { ids.splice(i, 1); save(ids); } },
  // тогл: повертає true, якщо тепер в обраному
  toggle: function (id) {
    var i = ids.indexOf(id);
    if (i === -1) ids.push(id); else ids.splice(i, 1);
    save(ids);
    return i === -1;
  }
};

/* ----------------------------- Badge ----------------------------- */
// Лічильник «обраного» у шапці (дзеркало .cart-count). chrome.js рендерить
// шапку синхронно ПЕРЕД цим модулем (перший import у entry), тож
// .fav-count/.fav-btn вже існують.
function renderBadge() {
  var c = ids.length;
  document.querySelectorAll(".fav-count").forEach(function (el) {
    el.textContent = c;
    el.classList.toggle("is-active", c > 0);
  });
  document.querySelectorAll(".fav-btn").forEach(function (el) {
    el.classList.toggle("has-favs", c > 0);
  });
}
function bump() {
  document.querySelectorAll(".fav-count").forEach(function (el) {
    el.classList.remove("bump");
    void el.offsetWidth; // reflow → перезапуск анімації
    el.classList.add("bump");
  });
}

document.addEventListener("favs:change", function () { renderBadge(); bump(); });
renderBadge(); // шапка вже на місці (chrome.js — перший import у entry)
document.addEventListener("DOMContentLoaded", renderBadge); // підстраховка
