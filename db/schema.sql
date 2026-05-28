-- Flora & Gifts — PostgreSQL schema
-- Usage: psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_pins (
  email TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL DEFAULT 'signup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image TEXT,
  description TEXT,
  wrapping JSONB,
  card_available BOOLEAN NOT NULL DEFAULT TRUE,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB,
  care JSONB,
  gallery JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Processing',
  address TEXT,
  payment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  service TEXT NOT NULL,
  event_date DATE NOT NULL,
  guests INT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

COMMENT ON TABLE users IS 'Registered customers and administrators';
COMMENT ON TABLE email_pins IS 'Temporary verification and password-reset codes';
COMMENT ON TABLE contact_messages IS 'Messages submitted through the contact form';
COMMENT ON TABLE products IS 'Shop catalogue (flowers, gifts, wedding items)';
COMMENT ON TABLE orders IS 'Customer purchase records';
COMMENT ON TABLE reservations IS 'Event and venue reservation requests';
