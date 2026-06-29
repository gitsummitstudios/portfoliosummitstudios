# Квіткова майстерня «Лілея» — сайт

Статичний інтернет-магазин квітів (демо для м. Лубни). Чистий HTML/CSS/JS, **без збірки та залежностей** — відкривається у будь-якому браузері й хоститься будь-де.

---

## Зміст
- [Запуск](#запуск)
- [Структура проєкту](#структура-проєкту)
- [Як замінити демо-контент](#як-замінити-демо-контент)
- [Відправка заявок магазину](#відправка-заявок-магазину) — Formspree / Telegram
- [Онлайн-оплата (LiqPay)](#онлайн-оплата-liqpay)
- [Деплой](#деплой)
- [Технічні нотатки](#технічні-нотатки)

---

## Запуск

Подвійний клік на `index.html` працює, але для коректних `fetch`/шрифтів краще локальний сервер:

```bash
# Python (є на Windows)
python -m http.server 8000
# → відкрийте http://localhost:8000

# або Node
npx serve .
```

---

## Структура проєкту

```
index.html      Головна (+ конфігуратор «зберіть букет»)
catalog.html    Каталог (фільтри ?cat=…, сортування, обране)
cart.html       Оформлення замовлення (checkout)
about.html      Про нас + команда + #delivery + #contacts
404.html        Сторінка «не знайдено»
css/styles.css  Дизайн-система (токени, компоненти, адаптив)
js/
  products.js     ДАНІ каталогу (товари, ціни, фото) ← редагуєте найчастіше
  chrome.js       Спільні шапка + підвал (одне джерело для всіх сторінок)
  cart.js         Кошик (localStorage), drawer, тости — export Cart/money/toast/openCart
  ui.js           Навігація, scroll-reveal, плейсхолдери фото
  catalog.js      Рендер каталогу + фільтри + сортування
  card.js         Розмітка картки товару
  modal.js        Швидкий перегляд товару
  configurator.js «Зберіть власний букет»
  favs.js         Обране (localStorage)
  checkout.js     Кошик-сторінка, валідація, (хук) оплата
  contact.js      Форма заявки на about.html
  page-*.js       Точка входу на кожну сторінку (єдиний <script type="module">)
assets/
  favicon.svg, logo.svg
  img/            фото товарів і сторінок (*.jpg)
```

> **JS = нативні ES-модулі.** Кожна сторінка підключає рівно один `<script type="module" src="js/page-*.js">`, який імпортує потрібні модулі у правильному порядку (`import`/`export`, без `window.*`-глобалів і без залежності від порядку `<script>`-тегів). Збірка не потрібна — модулі працюють у браузері напряму; лише відкривайте через локальний сервер (див. [Запуск](#запуск)), бо `file://` блокує імпорти модулів.

---

## Як замінити демо-контент

### Товари та ціни
Відкрийте **`js/products.js`** і відредагуйте масив `PRODUCTS`. Кожен товар:

```js
{ id: "neznist", name: "Букет «Ніжність»", cat: "bouquets",
  price: 1250, old: null, badge: "Хіт",
  desc: "Опис букета.", img: "photo-1518895949257-7621c3c786d7" }
```

- `cat` — ключ категорії з масиву `CATEGORIES` (`bouquets`, `roses`, `wedding`, `boxes`, `plants`).
- `old` — стара ціна для знижки (або `null`).
- `badge` — `"Хіт"`, `"Акція"`, `"Premium"` або `null`.
- `id` — унікальний; **не змінюйте** для товарів, що вже в чиїхось кошиках.

### Фото товарів
`img` — це **локальний шлях** до файлу (напр. `assets/img/neznist.jpg`). Усі фото вже лежать у `assets/img/`. Щоб поставити **власні**:

1. Покладіть файл у `assets/img/` (напр. `neznist.jpg`).
2. У `js/products.js` вкажіть шлях у полі `img`: `img: "assets/img/neznist.jpg"`.

Жодних хелперів переписувати **не треба**. Функція `imgURL()` (експорт ES-модуля у `products.js`, не `window.*`) сама віддає локальні шляхи як є. Вона вміє й Unsplash-ID, але **CSP за замовчуванням блокує зовнішні зображення** (`img-src 'self' data:`). Хочете тягнути фото з Unsplash — додайте `https://images.unsplash.com` до `img-src` у CSP-мета **кожного** `*.html`.

> Якщо фото не завантажиться, автоматично підставляється елегантний SVG-плейсхолдер (`js/ui.js`), тож сайт ніколи не «ламається».

### Контакти, адреса, телефон, соцмережі
Жорстко прописані в HTML кожної сторінки (шапка + футер). Зробіть пошук-заміну по всіх `*.html`:

| Що шукати | На що замінити |
|---|---|
| `+380501234567` та `+38 (050) 123-45-67` | ваш телефон |
| `hello@lileya.ua` | ваш email |
| `вул. Ярослава Мудрого, 12` | ваша адреса |
| `Лілея` | назва вашого магазину |
| `viber://chat`, `href="#"` у соцмережах | ваші посилання |

### Параметри доставки
У **`js/checkout.js`** зверху:
```js
var DELIVERY_FREE_FROM = 1500; // безкоштовно від суми
var DELIVERY_COST = 150;       // вартість доставки
```

---

## Відправка заявок магазину

Зараз при оплаті «при отриманні»/«переказ» заявка показує екран успіху, але **нікуди не надсилається**. Точка інтеграції — функція `success(data)` / коментар `// TODO` у **`js/checkout.js`**. `data` містить усі поля форми + `data.items` (рядок із товарами) + `data.total`.

### Варіант А — Formspree (найпростіше, без коду на сервері)

1. Зареєструйтесь на [formspree.io](https://formspree.io), створіть форму, скопіюйте її endpoint (`https://formspree.io/f/abcwxyz`).
2. У `js/checkout.js`, у `onSubmit`, **замість** виклику `success(data)` для гілки готівка/переказ, надішліть дані (`toast` уже імпортовано вгорі файлу: `import { ..., toast } from "./cart.js"`):

```js
// заявку надсилаємо магазину, потім показуємо успіх
fetch("https://formspree.io/f/ВАШ_ID", {
  method: "POST",
  headers: { "Accept": "application/json", "Content-Type": "application/json" },
  body: JSON.stringify(data)
}).then(function (r) {
  if (r.ok) success(data);
  else toast("Помилка надсилання. Зателефонуйте нам.");
}).catch(function () { toast("Немає зв'язку. Спробуйте ще раз."); });
```

> ⚠️ **CSP:** додайте `https://formspree.io` у `connect-src` CSP-мета кожного `*.html`, інакше `fetch` мовчки заблокується (`connect-src 'self'`).

Заявки приходитимуть вам на email.

### Варіант Б — Telegram-бот (миттєві сповіщення флористу)

1. У Telegram напишіть [@BotFather](https://t.me/BotFather) → `/newbot` → отримайте **TOKEN**.
2. Дізнайтесь свій **chat_id**: напишіть боту будь-що, відкрийте
   `https://api.telegram.org/botTOKEN/getUpdates` → знайдіть `"chat":{"id":...}`.
3. У `js/checkout.js` замініть `success(data)` на:

```js
var TG_TOKEN = "123456:ABC...";   // токен бота
var TG_CHAT  = "987654321";       // ваш chat_id
var text = "🌷 НОВЕ ЗАМОВЛЕННЯ\n" +
  "Ім'я: " + data.name + "\nТел: " + data.phone +
  "\nАдреса: " + data.address +
  "\nТовари: " + data.items + "\nСума: " + data.total + " грн" +
  "\nЛистівка: " + (data.card_text || "—");
fetch("https://api.telegram.org/bot" + TG_TOKEN + "/sendMessage", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: TG_CHAT, text: text })
}).then(function () { success(data); });
```

> ⚠️ **CSP:** додайте `https://api.telegram.org` у `connect-src` CSP-мета кожного `*.html`, інакше браузер заблокує запит до бота.
>
> ⚠️ **Безпека:** токен у клієнтському коді видно будь-кому. Для Telegram це прийнятний ризик (максимум — спам у ваш чат, токен легко перевипустити). Для серйозного продакшну винесіть відправку на невелику serverless-функцію (Netlify/Vercel Functions), куди браузер шле лише дані замовлення.

---

## Онлайн-оплата (LiqPay)

LiqPay (від ПриватБанку) — найпоширеніший шлюз в Україні (картки, Apple/Google Pay). Кнопка вже є у `cart.html` («Онлайн-оплата карткою»), а хук — у `js/checkout.js` (гілка `if (pay === "liqpay")`).

**Чому потрібен бекенд:** платіж формується як пара `data` + `signature`, де
`signature = base64(sha1(private_key + data + private_key))`.
**Приватний ключ не можна тримати в браузері** — інакше будь-хто зможе підробляти платежі. Тому потрібна крихітна серверна функція, що приймає суму й повертає підпис.

### Крок 1. Serverless-функція (приклад для Netlify/Vercel, Node)

```js
// /api/liqpay-sign.js
const crypto = require("crypto");
const PRIVATE = process.env.LIQPAY_PRIVATE_KEY;
const PUBLIC  = process.env.LIQPAY_PUBLIC_KEY;

module.exports = async (req, res) => {
  const { amount, orderId, description } = req.body;
  const params = {
    public_key: PUBLIC, version: "3", action: "pay",
    amount: String(amount), currency: "UAH",
    description: description || "Замовлення квітів",
    order_id: orderId, result_url: "https://ваш-сайт/cart.html?paid=1"
  };
  const data = Buffer.from(JSON.stringify(params)).toString("base64");
  const signature = crypto.createHash("sha1")
    .update(PRIVATE + data + PRIVATE).digest("base64");
  res.json({ data, signature });
};
```
Ключі візьміть у кабінеті [liqpay.ua](https://www.liqpay.ua) і покладіть у змінні оточення `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY` (не в код!).

### Крок 2. Виклик у `js/checkout.js`

У гілці `if (pay === "liqpay")` замініть тимчасовий `toast` на:

```js
fetch("/api/liqpay-sign", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: data.total, orderId: "ord-" + Date.now(),
                         description: "Замовлення: " + data.items })
})
.then(function (r) { return r.json(); })
.then(function (sig) {
  // POST-форма на checkout LiqPay
  var f = document.createElement("form");
  f.method = "POST";
  f.action = "https://www.liqpay.ua/api/3/checkout";
  f.acceptCharset = "utf-8";
  f.innerHTML = '<input type="hidden" name="data" value="' + sig.data + '">' +
                '<input type="hidden" name="signature" value="' + sig.signature + '">';
  document.body.appendChild(f);
  Cart.clear(); // Cart імпортовано вгорі checkout.js
  f.submit(); // редірект на сторінку оплати LiqPay
});
```

> ⚠️ **CSP:** форма постить на `https://www.liqpay.ua` — тут спрацьовує не `connect-src`, а `form-action 'self'`, який заблокує сабміт. Додайте `https://www.liqpay.ua` у `form-action` CSP-мета `cart.html`. (Виклик `/api/liqpay-sign` — свій origin, тож `connect-src 'self'` його пропускає.)

### Крок 3. (Опц.) Підтвердження оплати
LiqPay шле `server_callback` на ваш бекенд після оплати — там перевіряйте підпис і фіксуйте замовлення як оплачене. Деталі: [LiqPay API docs](https://www.liqpay.ua/documentation/api/home).

---

## Деплой

Будь-який статичний хостинг (усі мають безкоштовний тариф):

- **Netlify / Vercel** — перетягніть папку або під'єднайте Git. Потрібні для serverless-функцій (Telegram/LiqPay).
- **GitHub Pages** — `Settings → Pages`, гілка з кореня. Тільки статика (без бекенд-функцій).
- **Cloudflare Pages** — швидкий CDN.

Власний домен (напр. `lileya.lubny.ua`) налаштовується у панелі хостингу.

---

## Технічні нотатки

- **Продуктивність:** анімації лише `transform`/`opacity` (GPU), scroll-reveal через `IntersectionObserver`, `loading="lazy"` + `width`/`height`/`aspect-ratio` проти зсувів макета (CLS), `font-display: swap`, `preconnect` до Google Fonts. Фото локальні (`assets/img/`), а LCP-кадр героя предзавантажується через `<link rel="preload" as="image">` в `index.html`.
- **Доступність:** skip-link, видимі focus-стани, контраст ≥ 4.5:1, `aria-label` на іконкових кнопках, керування кошиком-drawer з клавіатури (Esc, повернення фокуса), повага до `prefers-reduced-motion`.
- **Кошик** зберігається у `localStorage` (ключ `lileya_cart_v1`) і живе між сторінками та перезавантаженнями.
- **Без фреймворків і збірки** — нема чого оновлювати чи зламати залежностями.

---

*Демонстраційний контент (товари, ціни, відгуки, контакти) — вигаданий. Замініть на реальні дані перед запуском.*
