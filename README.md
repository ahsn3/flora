# Flora & Gifts

An artisanal botanical boutique — full-stack web app with a refined Material 3 design language, served by an Express + Postgres backend.

## Features

- **Real authentication** — bcrypt-hashed passwords, JWT-based sessions, role-based access (`user` / `admin`)
- **Email PIN verification on signup** — 6-digit code, 10-min TTL, 30-sec resend cooldown, max 5 attempts, branded HTML email template, works with Gmail/Resend/SendGrid/Brevo or any SMTP
- **Live database** — Postgres-backed users, products, orders, and reservations
- **9 dedicated pages** — Home, Shop, Product detail, Cart, Checkout, Events, Auth, Orders, Admin
- **Live admin dashboard** — stats, orders (with status updates), reservations, users, and product CRUD
- **Persistent shopping cart** in `localStorage` (survives reloads, anonymous-friendly)
- **Bookmarkable URLs** — e.g. `product.html?id=3`
- **Responsive layout** with a sliding mobile drawer
- **Polished motion** — page fade-in, scroll-reveal, card shine, ambient floating blooms
- **Auth-aware navigation** — admin users see an extra Admin link; logged-in users see "My Orders" instead of "Login"
- **Accessibility** — `prefers-reduced-motion` respected, semantic landmarks, keyboard navigation

## Default admin

```
email:    admin@flora.com
password: admin123
```

The admin account is auto-seeded on first server boot.

## Project structure

```
flora-gifts/
├── server.js                Express app, routes, schema init, seeds
├── package.json
├── railway.json             Railway build/deploy config
├── .env.example
├── db/
│   └── seed-products.js     Default product catalog
└── public/                  All static assets, served at /
    ├── index.html           Home
    ├── shop.html            Product gallery + filters + search
    ├── product.html         Detail page (?id=N)
    ├── cart.html
    ├── checkout.html
    ├── events.html          Events / reservation form
    ├── auth.html            Login / Register
    ├── orders.html          My orders
    ├── admin.html           Admin dashboard
    └── assets/
        ├── css/styles.css
        └── js/
            ├── tailwind-config.js
            └── app.js       Frontend: API client, page renderers
```

## API

| Method | Path                              | Auth   | Description                            |
| ------ | --------------------------------- | ------ | -------------------------------------- |
| GET    | `/api/health`                     | —      | DB ping                                |
| POST   | `/api/auth/send-pin`              | —      | Email a 6-digit verification code      |
| POST   | `/api/auth/register`              | —      | Verify PIN + create account            |
| POST   | `/api/auth/login`                 | —      | Issue JWT (requires verified email)    |
| GET    | `/api/auth/me`                    | user   | Current user                           |
| GET    | `/api/products`                   | —      | List all products                      |
| GET    | `/api/products/:id`               | —      | One product                            |
| POST   | `/api/products`                   | admin  | Create product                         |
| DELETE | `/api/products/:id`               | admin  | Delete product                         |
| GET    | `/api/orders`                     | user   | My orders                              |
| POST   | `/api/orders`                     | user   | Place order                            |
| GET    | `/api/reservations/dates`         | —      | List booked dates (conflict check)     |
| POST   | `/api/reservations`               | —      | Submit reservation inquiry             |
| GET    | `/api/admin/stats`                | admin  | Dashboard counts + revenue             |
| GET    | `/api/admin/users`                | admin  | All users + order count                |
| GET    | `/api/admin/orders`               | admin  | All orders with user email             |
| PATCH  | `/api/admin/orders/:id`           | admin  | Update status                          |
| GET    | `/api/admin/reservations`         | admin  | All reservations                       |
| PATCH  | `/api/admin/reservations/:id`     | admin  | Update reservation status              |

Auth via `Authorization: Bearer <jwt>` header.

## Local development

Requirements: **Node 18+** and a local or remote Postgres database.

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env
# edit .env and set DATABASE_URL + JWT_SECRET

# 3. Run
npm run dev   # auto-restarts on file changes
# or
npm start
```

Open <http://localhost:3000>. Schema and seed data are created automatically on first run.

## Email PIN verification

When a new user clicks **Register**, they enter name + email + password and are sent a 6-digit code by email. After entering the code, the account is created and they're logged in. The seeded admin (`admin@flora.com`) is pre-verified and bypasses this step.

The mailer is configured entirely via env vars (no code changes required) and supports any SMTP provider. See `.env.example` for ready-to-paste settings for **Gmail (App Password)**, **Resend**, **SendGrid**, and **Brevo**.

If SMTP isn't configured, the server logs PINs to the console so you can still test the flow locally:

```
✉  [DEV MODE] PIN for someone@example.com: 482910
```

Security guards baked in:
- PIN hashed with bcrypt at rest
- 10-minute TTL
- 30-second cooldown between resend requests
- Max 5 incorrect attempts before the code is invalidated
- 401-clearing on login if email isn't verified

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway, create a new project → **Deploy from GitHub repo** → pick this repo.
3. Add the **Postgres** plugin to the project. Railway will inject `DATABASE_URL` automatically.
4. Under **Variables**, add:
   - `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 48`)
   - `NODE_ENV=production`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — see `.env.example` for provider-specific values
5. Railway auto-detects Node and runs `npm start`. The healthcheck at `/api/health` will go green once the DB is reachable.

That's it — admin@flora.com / admin123 is seeded on first boot.

## Tech

- **Backend:** Node.js, Express, `pg`, `bcryptjs`, `jsonwebtoken`
- **Frontend:** Tailwind CSS (Play CDN) with a custom Material 3 theme, vanilla JS
- **Fonts:** [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) + [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3)
- **Icons:** [Material Symbols Outlined](https://fonts.google.com/icons)
