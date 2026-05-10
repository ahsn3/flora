/* Flora & Gifts — Express + Postgres backend
 * Serves static files from public/ and exposes a JSON API at /api/*
 *
 * Required env:
 *   DATABASE_URL  Postgres connection string (Railway provides automatically)
 *   JWT_SECRET    Secret for signing JWTs (set this in Railway → Variables)
 *   PORT          Port to listen on (Railway provides automatically) */

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'flora-dev-secret-change-me-in-production';
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. The API will fail until you configure it.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── DB SCHEMA + SEED ───────────────────────────────────────────────
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      category TEXT NOT NULL,
      price NUMERIC NOT NULL,
      image TEXT,
      description TEXT,
      wrapping JSONB,
      card_available BOOLEAN DEFAULT TRUE,
      stock INT DEFAULT 0,
      attributes JSONB,
      care JSONB,
      gallery JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      items JSONB NOT NULL,
      total NUMERIC NOT NULL,
      status TEXT DEFAULT 'Processing',
      address TEXT,
      payment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      service TEXT NOT NULL,
      event_date DATE NOT NULL,
      guests INT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✓ Schema ready');

  const adminEmail = 'admin@flora.com';
  const adminCheck = await pool.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
  if (!adminCheck.rows.length) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
      ['Admin User', adminEmail, hash]
    );
    console.log('✓ Seeded admin user (admin@flora.com / admin123)');
  }

  const productCount = await pool.query('SELECT COUNT(*)::int AS c FROM products');
  if (productCount.rows[0].c === 0) {
    const seedProducts = require('./db/seed-products.js');
    for (const p of seedProducts) {
      await pool.query(
        `INSERT INTO products (name, tagline, category, price, image, description, wrapping, card_available, stock, attributes, care, gallery)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [p.name, p.tagline || null, p.category, p.price, p.image || null, p.desc || null,
         JSON.stringify(p.wrapping || []), p.card !== false, p.stock || 0,
         p.attributes ? JSON.stringify(p.attributes) : null,
         p.care ? JSON.stringify(p.care) : null,
         p.gallery ? JSON.stringify(p.gallery) : null]
      );
    }
    console.log(`✓ Seeded ${seedProducts.length} products`);
  }

  const resvCount = await pool.query('SELECT COUNT(*)::int AS c FROM reservations');
  if (resvCount.rows[0].c === 0) {
    await pool.query(`
      INSERT INTO reservations (name, email, service, event_date, guests, status, notes) VALUES
      ($1, $2, $3, $4, $5, $6, $7),
      ($8, $9, $10, $11, $12, $13, $14)
    `, [
      'Ayşe & Mehmet', 'ayse@example.com', 'Wedding Full Package', '2025-12-20', 200, 'confirmed', 'Rose theme, ivory and gold',
      'Zeynep Kaya',   'zeynep@example.com','Corporate Event',      '2025-11-15', 80,  'pending',   'Modern minimalist style',
    ]);
    console.log('✓ Seeded sample reservations');
  }
}

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────
function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'Authentication required' });
      req.user = null; return next();
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      if (required) return res.status(401).json({ error: 'Invalid or expired token' });
      req.user = null; next();
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── HEALTHCHECK ────────────────────────────────────────────────────
app.get('/api/health', wrap(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, env: NODE_ENV });
}));

// ─── AUTH ROUTES ────────────────────────────────────────────────────
function makeToken(u) {
  return jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
}

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const lower = email.toLowerCase().trim();
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [lower]);
  if (exists.rows.length) return res.status(409).json({ error: 'Email is already registered' });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role",
    [name.trim(), lower, hash]
  );
  const user = rows[0];
  res.json({ user, token: makeToken(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const lower = email.toLowerCase().trim();
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [lower]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
  res.json({ user, token: makeToken(user) });
}));

app.get('/api/auth/me', auth(true), wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
}));

// ─── PRODUCTS ───────────────────────────────────────────────────────
function rowToProduct(r) {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    category: r.category,
    price: parseFloat(r.price),
    image: r.image,
    desc: r.description,
    wrapping: r.wrapping || ['Classic Wrap', 'Luxury Wrap', 'No Wrapping'],
    card: r.card_available,
    stock: r.stock,
    attributes: r.attributes,
    care: r.care,
    gallery: r.gallery,
  };
}

app.get('/api/products', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id ASC');
  res.json(rows.map(rowToProduct));
}));

app.get('/api/products/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  res.json(rowToProduct(rows[0]));
}));

app.post('/api/products', auth(true), requireAdmin, wrap(async (req, res) => {
  const { name, tagline, category, price, image, description, desc, stock, wrapping, card } = req.body || {};
  if (!name || !category || price == null) return res.status(400).json({ error: 'name, category, and price are required' });
  const { rows } = await pool.query(
    `INSERT INTO products (name, tagline, category, price, image, description, wrapping, card_available, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      name.trim(),
      tagline || null,
      category,
      Number(price),
      image || null,
      description || desc || null,
      JSON.stringify(wrapping && wrapping.length ? wrapping : ['Classic Wrap', 'Luxury Wrap', 'No Wrapping']),
      card !== false,
      Number(stock) || 0,
    ]
  );
  res.json(rowToProduct(rows[0]));
}));

app.delete('/api/products/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

// ─── ORDERS ─────────────────────────────────────────────────────────
function rowToOrder(r, userEmail) {
  return {
    id: 'ORD' + String(r.id).padStart(4, '0'),
    rawId: r.id,
    user: userEmail || null,
    items: r.items,
    total: parseFloat(r.total),
    status: r.status,
    address: r.address,
    payment: r.payment,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR') : '',
    createdAt: r.created_at,
  };
}

app.get('/api/orders', auth(true), wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(rows.map(r => rowToOrder(r, req.user.email)));
}));

app.post('/api/orders', auth(true), wrap(async (req, res) => {
  const { items, total, address, payment } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty' });
  if (!address) return res.status(400).json({ error: 'Delivery address is required' });
  const { rows } = await pool.query(
    `INSERT INTO orders (user_id, items, total, address, payment, status)
     VALUES ($1, $2, $3, $4, $5, 'Processing') RETURNING *`,
    [req.user.id, JSON.stringify(items), Number(total) || 0, address, payment || 'cash']
  );
  res.json(rowToOrder(rows[0], req.user.email));
}));

// ─── RESERVATIONS ───────────────────────────────────────────────────
app.get('/api/reservations/dates', wrap(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT to_char(event_date,'YYYY-MM-DD') AS d FROM reservations WHERE status <> 'cancelled'"
  );
  res.json(rows.map(r => r.d));
}));

app.post('/api/reservations', wrap(async (req, res) => {
  const { name, email, phone, service, date, guests, notes } = req.body || {};
  if (!name || !service || !date) return res.status(400).json({ error: 'Name, service, and date are required' });
  const dup = await pool.query("SELECT id FROM reservations WHERE event_date=$1 AND status <> 'cancelled'", [date]);
  if (dup.rows.length) return res.status(409).json({ error: 'This date is already booked' });
  const { rows } = await pool.query(
    `INSERT INTO reservations (name, email, phone, service, event_date, guests, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
    [name.trim(), email || null, phone || null, service, date, guests ? Number(guests) : null, notes || null]
  );
  res.json(rows[0]);
}));

// ─── ADMIN ──────────────────────────────────────────────────────────
app.get('/api/admin/stats', auth(true), requireAdmin, wrap(async (req, res) => {
  const [orders, users, resv] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c, COALESCE(SUM(total),0)::float AS rev FROM orders'),
    pool.query('SELECT COUNT(*)::int AS c FROM users'),
    pool.query('SELECT COUNT(*)::int AS c FROM reservations'),
  ]);
  res.json({
    orders: orders.rows[0].c,
    revenue: orders.rows[0].rev,
    users: users.rows[0].c,
    reservations: resv.rows[0].c,
  });
}));

app.get('/api/admin/users', auth(true), requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id), 0)::int AS order_count
    FROM users u
    ORDER BY u.id ASC
  `);
  res.json(rows);
}));

app.get('/api/admin/orders', auth(true), requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, u.email AS user_email
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `);
  res.json(rows.map(r => rowToOrder(r, r.user_email)));
}));

app.patch('/api/admin/orders/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status required' });
  await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/admin/reservations', auth(true), requireAdmin, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM reservations ORDER BY event_date ASC');
  res.json(rows.map(r => ({
    id: 'RES' + String(r.id).padStart(4, '0'),
    rawId: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    service: r.service,
    date: r.event_date ? new Date(r.event_date).toISOString().slice(0, 10) : '',
    guests: r.guests,
    status: r.status,
    notes: r.notes,
  })));
}));

app.patch('/api/admin/reservations/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status required' });
  await pool.query('UPDATE reservations SET status=$1 WHERE id=$2', [status, req.params.id]);
  res.json({ ok: true });
}));

// ─── STATIC + SPA FALLBACK ──────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// ─── BOOT ───────────────────────────────────────────────────────────
initDb()
  .then(() => app.listen(PORT, () => console.log(`✿ Flora & Gifts running on :${PORT} (${NODE_ENV})`)))
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
