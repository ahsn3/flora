# Flora & Gifts

An artisanal botanical boutique — built as a static multi-page website with a refined Material 3 design language, Tailwind CSS, and vanilla JavaScript. No build step required.

## Features

- **9 dedicated pages** — Home, Shop, Product detail, Cart, Checkout, Events & reservations, Auth, My orders, Admin dashboard
- **Persistent state** via `localStorage` — cart, login session, orders, and reservations survive across pages and reloads
- **Bookmarkable URLs** — e.g. `product.html?id=3`
- **Responsive layout** with a sliding mobile drawer
- **Polished motion** — page fade-in, scroll-reveal, card shine, ambient floating blooms
- **Auth-aware navigation** — admin users see an extra Admin link; logged-in users see "My Orders" instead of "Login"
- **Accessibility** — `prefers-reduced-motion` respected, semantic landmarks, keyboard-navigable
- Demo admin credentials: `admin@flora.com` / `admin123`

## Project structure

```
flora-gifts/
├── index.html          Home
├── shop.html           Product gallery + filters + search
├── product.html        Detail page (?id=N)
├── cart.html
├── checkout.html
├── events.html         Events / reservation form
├── auth.html           Login / Register
├── orders.html         My orders
├── admin.html          Admin dashboard
└── assets/
    ├── css/styles.css           Shared styles + animations
    └── js/
        ├── tailwind-config.js   Material 3 theme tokens
        └── app.js               Data, state, layout injection, page renderers
```

## How it works

Each HTML page is a thin shell with a `<body data-page="...">` attribute. `assets/js/app.js`:

1. Injects the shared nav, footer, drawer, and ambient decorations into placeholder divs.
2. Reads `body.dataset.page` and runs the matching initializer (`initHome`, `initShop`, `initProduct`, ...).
3. Persists the cart, user session, orders, and reservations in `localStorage` under the `flora.*` namespace.

## Running locally

No build step or dependencies needed. Open `index.html` directly in a browser, or serve the folder:

```bash
# Python 3
python3 -m http.server 8000

# Node
npx serve
```

Then visit <http://localhost:8000>.

## Tech

- [Tailwind CSS (Play CDN)](https://tailwindcss.com/docs/installation/play-cdn) with a custom Material 3 theme
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) + [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3)
- [Material Symbols Outlined](https://fonts.google.com/icons)
- Vanilla JavaScript (no framework, no bundler)
