/* Entry-модуль головної. Порядок: shell (chrome→ui→cart→favs) → сторінкові.
   chrome.js — перший: рендерить шапку синхронно, далі favs знаходить .fav-count. */
import "./chrome.js";
import "./ui.js";
import "./cart.js";
import "./favs.js";
import "./modal.js";
import "./home.js";
import "./configurator.js";
import "./hero.js";
