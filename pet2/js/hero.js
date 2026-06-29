/* =====================================================================
   hero.js — м'який паралакс героїчного колажу (Stage 4 · hero).
   • вказівник (тільки fine-pointer): кадри ледь зміщуються в різні боки
     → відчуття глибини сцени;
   • скрол: уся сцена дрейфує повільніше за сторінку.
   Падіння пелюсток — суто CSS (розмітка в index.html), JS не потрібен.
   Повністю вимикається при prefers-reduced-motion. Зовнішній файл —
   жодних inline-скриптів (CSP script-src 'self').
   ===================================================================== */
function run() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var hero = document.querySelector(".hero");
  var stack = document.querySelector(".hero__stack");
  if (!hero || !stack) return;
  var mainImg = hero.querySelector(".hero__frame--main img");
  var subImg = hero.querySelector(".hero__frame--sub img");

  var mx = 0, my = 0, tmx = 0, tmy = 0, sy = 0, raf = 0;

  function render() {
    raf = 0;
    mx += (tmx - mx) * 0.12;
    my += (tmy - my) * 0.12;
    // scale 1.07 дає запас, щоб зсув ніколи не оголював краї рамки
    if (mainImg) mainImg.style.transform = "scale(1.07) translate(" + (mx * 10) + "px," + (my * 10) + "px)";
    if (subImg) subImg.style.transform = "scale(1.07) translate(" + (-mx * 7) + "px," + (-my * 7) + "px)";
    stack.style.transform = "translate3d(0," + sy.toFixed(2) + "px,0)";
    if (Math.abs(tmx - mx) > 0.001 || Math.abs(tmy - my) > 0.001) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(render); }

  if (window.matchMedia("(pointer: fine)").matches) {
    [mainImg, subImg].forEach(function (im) { if (im) im.style.willChange = "transform"; });
    hero.addEventListener("pointermove", function (ev) {
      var r = hero.getBoundingClientRect();
      tmx = ((ev.clientX - r.left) / r.width - 0.5) * 2;   // -1..1
      tmy = ((ev.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    });
    hero.addEventListener("pointerleave", function () { tmx = 0; tmy = 0; schedule(); });
  }

  window.addEventListener("scroll", function () {
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > window.innerHeight + 200) return;  // героя вже не видно — не рахуємо
    sy = y * -0.05;
    schedule();
  }, { passive: true });

  render();
}
run();
