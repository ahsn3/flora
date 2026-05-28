# Flora & Gifts — Database Documentation

PostgreSQL database for the Flora & Gifts e-commerce and event reservation system.

## Setup

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

On application start, `server.js` also runs `CREATE TABLE IF NOT EXISTS` and seeds the admin account plus product catalogue from `db/seed-products.js`.

## Entity relationship

```
users (1) ──────< orders (many)
```

Other tables (`email_pins`, `contact_messages`, `products`, `reservations`) are independent except `email_pins.email` which matches `users.email` during signup.

## Tables

### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | User ID |
| name | TEXT | NOT NULL | Display name |
| email | TEXT | NOT NULL, UNIQUE | Login email |
| password_hash | TEXT | NOT NULL | bcrypt hash |
| role | TEXT | NOT NULL, DEFAULT 'user' | `user` or `admin` |
| email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Email confirmed |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Registration time |

### `email_pins`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| email | TEXT | PRIMARY KEY | Email the PIN was sent to |
| pin_hash | TEXT | NOT NULL | bcrypt hash of 6-digit code |
| attempts | INT | NOT NULL, DEFAULT 0 | Failed verification count |
| purpose | TEXT | NOT NULL, DEFAULT 'signup' | `signup` or password reset |
| created_at | TIMESTAMPTZ | NOT NULL | PIN issue time (10 min TTL) |

### `contact_messages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Message ID |
| name | TEXT | NOT NULL | Sender name |
| email | TEXT | NOT NULL | Sender email |
| subject | TEXT | | Subject line |
| message | TEXT | NOT NULL | Message body |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Submission time |

Note: `POST /api/contact` writes to this table. The public Contact page currently shows store info only (no form).

### `products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Product ID |
| name | TEXT | NOT NULL | Product name |
| tagline | TEXT | | Short subtitle |
| category | TEXT | NOT NULL | `flowers`, `gifts`, or `wedding` |
| price | NUMERIC(10,2) | NOT NULL, >= 0 | Price in TRY |
| image | TEXT | | Main image URL path |
| description | TEXT | | Long description |
| wrapping | JSONB | | Wrapping option labels |
| card_available | BOOLEAN | DEFAULT TRUE | Gift card available |
| stock | INT | DEFAULT 0, >= 0 | Units in stock |
| attributes | JSONB | | Extra specs (icons, labels) |
| care | JSONB | | Care instructions |
| gallery | JSONB | | Array of image URLs per colour |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Added to catalogue |

### `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Order ID |
| user_id | INT | FK → users(id), ON DELETE SET NULL | Buyer |
| items | JSONB | NOT NULL | Line items (cart snapshot) |
| total | NUMERIC(10,2) | NOT NULL, >= 0 | Order total TRY |
| status | TEXT | DEFAULT 'Processing' | Fulfillment status |
| address | TEXT | | Delivery address |
| payment | TEXT | | Payment method |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Order time |

### `reservations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Reservation ID |
| name | TEXT | NOT NULL | Client name |
| email | TEXT | | Contact email |
| phone | TEXT | | Contact phone |
| service | TEXT | NOT NULL | Event type |
| event_date | DATE | NOT NULL | Requested date |
| guests | INT | | Guest count |
| status | TEXT | DEFAULT 'pending' | `pending`, `confirmed`, etc. |
| notes | TEXT | | Extra details |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Request time |

## Indexes

| Index | Table | Column(s) |
|-------|-------|-----------|
| idx_orders_user_id | orders | user_id |
| idx_orders_created_at | orders | created_at DESC |
| idx_products_category | products | category |
| idx_reservations_event_date | reservations | event_date |
| idx_reservations_status | reservations | status |

## Seed data

| Data | Source |
|------|--------|
| Admin user | `admin@flora.com` / `admin123` (auto on first boot) |
| 23 products | `db/seed-products.js` |
| Sample reservations | `server.js` init (if table empty) |
