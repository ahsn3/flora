const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { sendPinEmail, smtpEnabled, getEmailProviderStatus } = require('./db/mailer');

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

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
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
    CREATE TABLE IF NOT EXISTS user_carts (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      items JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, product_id)
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE email_pins ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'signup'`);
  console.log('✓ Schema ready');

  const adminEmail = 'admin@flora.com';
  const adminCheck = await pool.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
  if (!adminCheck.rows.length) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role, email_verified) VALUES ($1, $2, $3, 'admin', TRUE)",
      ['Admin User', adminEmail, hash]
    );
    console.log('✓ Seeded admin user (admin@flora.com / admin123)');
  } else {

    await pool.query("UPDATE users SET email_verified = TRUE WHERE email = $1 AND email_verified = FALSE", [adminEmail]);
  }

  const seedProducts = require('./db/seed-products.js');
  let productsAdded = 0;
  let imagesUpdated = 0;
  for (const p of seedProducts) {
    const exists = await pool.query('SELECT id FROM products WHERE name=$1', [p.name]);
    if (exists.rows.length) {
      await pool.query(
        `UPDATE products SET image=$1, gallery=$2 WHERE name=$3`,
        [p.image || null, p.gallery ? JSON.stringify(p.gallery) : null, p.name]
      );
      imagesUpdated += 1;
      continue;
    }
    await pool.query(
      `INSERT INTO products (name, tagline, category, price, image, description, wrapping, card_available, stock, attributes, care, gallery)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.name, p.tagline || null, p.category, p.price, p.image || null, p.desc || null,
       JSON.stringify(p.wrapping || []), p.card !== false, p.stock || 0,
       p.attributes ? JSON.stringify(p.attributes) : null,
       p.care ? JSON.stringify(p.care) : null,
       p.gallery ? JSON.stringify(p.gallery) : null]
    );
    productsAdded += 1;
  }
  if (productsAdded) console.log(`✓ Added ${productsAdded} new product(s) to catalog`);
  if (imagesUpdated) console.log(`✓ Refreshed images for ${imagesUpdated} product(s)`);

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

let dbReady = false;

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    env: NODE_ENV,
    db: dbReady ? 'up' : 'connecting',
    email: getEmailProviderStatus(),
  });
});

app.get('/api/health/ready', wrap(async (req, res) => {
  if (!dbReady) return res.status(503).json({ ok: false, db: 'connecting' });
  await pool.query('SELECT 1');
  res.json({ ok: true, env: NODE_ENV, email: getEmailProviderStatus() });
}));

const PIN_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const PIN_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between sends
const PIN_MAX_ATTEMPTS = 5;

function makeToken(u) {
  return jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
}

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function emailSendErrorHint(err) {
  const msg = String(err && err.message ? err.message : err);
  if (/Invalid grant|reconnect your Gmail/i.test(msg)) {
    return 'Your Gmail link in EmailJS expired. Open EmailJS → Email Services → reconnect Gmail, then try again.';
  }
  if (/EmailJS/i.test(msg)) return `Could not send via EmailJS. (${msg.replace(/^EmailJS \d+: /, '')})`;
  if (/only send testing emails to your own email/i.test(msg)) {
    return 'With Resend’s free test sender, codes can only go to the Gmail on your Resend account, or verify your domain at resend.com/domains.';
  }
  if (/Resend API/i.test(msg)) return msg.replace(/^Resend API \d+: /, 'Email error: ');
  if (/invalid login|auth|535|credentials/i.test(msg)) {
    return 'Email credentials were rejected — check EMAILJS_* or RESEND_API_KEY on Railway.';
  }
  if (/ENETUNREACH|network unreachable/i.test(msg)) {
    return 'Email server unreachable from Railway. Use EmailJS or Resend (see README).';
  }
  if (/timeout|timed out/i.test(msg)) {
    return `Email timed out (${getEmailProviderStatus().provider}). Try again shortly.`;
  }
  return 'Could not send email. Please try again shortly.';
}

async function issuePinEmail(lower, pin, purpose) {
  const recent = await pool.query('SELECT created_at FROM email_pins WHERE email=$1', [lower]);
  if (recent.rows.length) {
    const ms = Date.now() - new Date(recent.rows[0].created_at).getTime();
    if (ms < PIN_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((PIN_RESEND_COOLDOWN_MS - ms) / 1000);
      const err = new Error(`Please wait ${wait}s before requesting another code.`);
      err.status = 429;
      throw err;
    }
  }
  try {
    await sendPinEmail(lower, pin, { purpose });
  } catch (err) {
    console.error('sendPinEmail failed:', err && err.message ? err.message : err);
    const e = new Error(emailSendErrorHint(err));
    e.status = 502;
    throw e;
  }
  const pinHash = await bcrypt.hash(pin, 10);
  await pool.query(
    `INSERT INTO email_pins (email, pin_hash, attempts, purpose, created_at)
     VALUES ($1, $2, 0, $3, NOW())
     ON CONFLICT (email) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, attempts = 0, purpose = EXCLUDED.purpose, created_at = NOW()`,
    [lower, pinHash, purpose]
  );
}
app.post('/api/auth/send-pin', wrap(async (req, res) => {
  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
  const lower = email.toLowerCase().trim();

  const exists = await pool.query('SELECT email_verified FROM users WHERE email=$1', [lower]);
  if (exists.rows.length && exists.rows[0].email_verified) {
    return res.status(409).json({ error: 'This email is already registered. Try logging in.' });
  }

  const pin = generatePin();
  try {
    await issuePinEmail(lower, pin, 'signup');
  } catch (err) {
    return res.status(err.status || 502).json({ error: err.message });
  }
  res.json({ ok: true, email: lower, expiresInSec: PIN_TTL_MS / 1000, devMode: !smtpEnabled });
}));
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password, pin } = req.body || {};
  if (!name || !email || !password || !pin) return res.status(400).json({ error: 'Name, email, password, and verification code are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^\d{6}$/.test(String(pin))) return res.status(400).json({ error: 'Verification code must be 6 digits' });
  const lower = email.toLowerCase().trim();

  const exists = await pool.query('SELECT id, email_verified FROM users WHERE email=$1', [lower]);
  if (exists.rows.length && exists.rows[0].email_verified) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  const pinRow = await pool.query(
    'SELECT pin_hash, attempts, created_at FROM email_pins WHERE email=$1 AND purpose=$2',
    [lower, 'signup']
  );
  if (!pinRow.rows.length) return res.status(400).json({ error: 'No verification code on file. Please request a new one.' });

  const { pin_hash, attempts, created_at } = pinRow.rows[0];
  if (Date.now() - new Date(created_at).getTime() > PIN_TTL_MS) {
    await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }
  if (attempts >= PIN_MAX_ATTEMPTS) {
    await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }

  const pinOk = await bcrypt.compare(String(pin), pin_hash);
  if (!pinOk) {
    await pool.query('UPDATE email_pins SET attempts = attempts + 1 WHERE email=$1', [lower]);
    return res.status(400).json({ error: 'Incorrect verification code' });
  }

  await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);

  const hash = await bcrypt.hash(password, 10);
  let user;
  if (exists.rows.length) {

    const upd = await pool.query(
      "UPDATE users SET name=$1, password_hash=$2, email_verified=TRUE WHERE email=$3 RETURNING id, name, email, role",
      [name.trim(), hash, lower]
    );
    user = upd.rows[0];
  } else {
    const ins = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, email_verified) VALUES ($1, $2, $3, 'user', TRUE) RETURNING id, name, email, role",
      [name.trim(), lower, hash]
    );
    user = ins.rows[0];
  }
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
  if (!rows[0].email_verified) return res.status(403).json({ error: 'Email not verified yet. Please complete signup with the code we sent you.' });
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
  res.json({ user, token: makeToken(user) });
}));

app.get('/api/auth/me', auth(true), wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role, email_verified FROM users WHERE id=$1', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
}));
app.post('/api/auth/forgot-password', wrap(async (req, res) => {
  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
  const lower = email.toLowerCase().trim();
  const user = await pool.query('SELECT id, email_verified FROM users WHERE email=$1', [lower]);
  if (user.rows.length && user.rows[0].email_verified) {
    const pin = generatePin();
    try {
      await issuePinEmail(lower, pin, 'reset');
    } catch (err) {
      return res.status(err.status || 502).json({ error: err.message });
    }
  }
  res.json({
    ok: true,
    message: 'If an account exists for this email, we sent a reset code.',
    expiresInSec: PIN_TTL_MS / 1000,
  });
}));
app.post('/api/auth/reset-password', wrap(async (req, res) => {
  const { email, pin, password } = req.body || {};
  if (!isValidEmail(email) || !pin || !password) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^\d{6}$/.test(String(pin))) return res.status(400).json({ error: 'Reset code must be 6 digits' });
  const lower = email.toLowerCase().trim();

  const user = await pool.query('SELECT id FROM users WHERE email=$1 AND email_verified=TRUE', [lower]);
  if (!user.rows.length) return res.status(400).json({ error: 'No verified account found for this email' });

  const pinRow = await pool.query(
    'SELECT pin_hash, attempts, created_at FROM email_pins WHERE email=$1 AND purpose=$2',
    [lower, 'reset']
  );
  if (!pinRow.rows.length) return res.status(400).json({ error: 'No reset code on file. Request a new one.' });

  const { pin_hash, attempts, created_at } = pinRow.rows[0];
  if (Date.now() - new Date(created_at).getTime() > PIN_TTL_MS) {
    await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);
    return res.status(400).json({ error: 'Reset code expired. Request a new one.' });
  }
  if (attempts >= PIN_MAX_ATTEMPTS) {
    await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);
    return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }
  const pinOk = await bcrypt.compare(String(pin), pin_hash);
  if (!pinOk) {
    await pool.query('UPDATE email_pins SET attempts = attempts + 1 WHERE email=$1', [lower]);
    return res.status(400).json({ error: 'Incorrect reset code' });
  }

  await pool.query('DELETE FROM email_pins WHERE email=$1', [lower]);
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, lower]);
  res.json({ ok: true, message: 'Password updated. You can sign in now.' });
}));

app.post('/api/contact', wrap(async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !isValidEmail(email) || !message) {
    return res.status(400).json({ error: 'Name, valid email, and message are required' });
  }
  const cleanName = String(name).trim().slice(0, 120);
  const cleanEmail = email.toLowerCase().trim();
  const cleanSubject = String(subject || 'General inquiry').trim().slice(0, 200);
  const cleanMessage = String(message).trim().slice(0, 5000);
  if (cleanMessage.length < 10) return res.status(400).json({ error: 'Message must be at least 10 characters' });

  await pool.query(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1,$2,$3,$4)',
    [cleanName, cleanEmail, cleanSubject, cleanMessage]
  );
  res.json({ ok: true, message: 'Thank you — we will reply within 1–2 business days.' });
}));

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

function rowToProductSummary(r) {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    category: r.category,
    price: parseFloat(r.price),
    image: r.image,
    stock: r.stock,
    card: r.card_available,
  };
}

app.get('/api/products', wrap(async (req, res) => {
  const full = req.query.full === '1' || req.query.full === 'true';
  if (full) {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.set('Cache-Control', 'private, max-age=30');
    return res.json(rows.map(rowToProduct));
  }
  const { rows } = await pool.query(
    'SELECT id, name, tagline, category, price, image, stock, card_available FROM products ORDER BY id ASC'
  );
  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
  res.json(rows.map(rowToProductSummary));
}));

app.get('/api/products/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Product not found' });
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
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
  await pool.query('DELETE FROM user_carts WHERE user_id=$1', [req.user.id]);
  res.json(rowToOrder(rows[0], req.user.email));
}));

function cartLineKey(item) {
  const opts = item.opts && typeof item.opts === 'object' ? item.opts : {};
  return `${item.id}|${JSON.stringify(opts)}`;
}

function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  for (const raw of items) {
    const id = Number(raw.id);
    if (!id || id < 1) continue;
    const opts = raw.opts && typeof raw.opts === 'object' ? raw.opts : {};
    const qty = Math.max(1, Math.min(99, Math.floor(Number(raw.qty) || 1)));
    const item = {
      id,
      qty,
      opts,
      price: Number(raw.price) || 0,
      name: String(raw.name || '').slice(0, 200),
      image: raw.image ? String(raw.image).slice(0, 500) : null,
    };
    const key = cartLineKey(item);
    const existing = map.get(key);
    if (!existing) map.set(key, item);
    else existing.qty = Math.max(existing.qty, qty);
  }
  return Array.from(map.values());
}

app.get('/api/cart', auth(true), wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT items FROM user_carts WHERE user_id=$1', [req.user.id]);
  const raw = rows.length && Array.isArray(rows[0].items) ? rows[0].items : [];
  const items = sanitizeCartItems(raw);
  await pool.query(
    `INSERT INTO user_carts (user_id, items, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
    [req.user.id, JSON.stringify(items)]
  );
  res.json({ items, type: 'user', userId: req.user.id });
}));

app.put('/api/cart', auth(true), wrap(async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
  const safe = sanitizeCartItems(items);
  await pool.query(
    `INSERT INTO user_carts (user_id, items, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
    [req.user.id, JSON.stringify(safe)]
  );
  res.json({ ok: true, items: safe, type: 'user', userId: req.user.id });
}));

app.get('/api/favorites', auth(true), wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT product_id FROM user_favorites WHERE user_id=$1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json({ productIds: rows.map((r) => r.product_id), type: 'user', userId: req.user.id });
}));

app.put('/api/favorites', auth(true), wrap(async (req, res) => {
  const { productIds } = req.body || {};
  if (!Array.isArray(productIds)) return res.status(400).json({ error: 'productIds must be an array' });
  const ids = [...new Set(productIds.map((id) => parseInt(id, 10)).filter((id) => id > 0))];
  await pool.query('DELETE FROM user_favorites WHERE user_id=$1', [req.user.id]);
  if (ids.length) {
    const valid = await pool.query('SELECT id FROM products WHERE id = ANY($1::int[])', [ids]);
    const validIds = valid.rows.map((r) => r.id);
    if (validIds.length) {
      const values = validIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO user_favorites (user_id, product_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [req.user.id, ...validIds]
      );
    }
    return res.json({ ok: true, productIds: validIds, type: 'user', userId: req.user.id });
  }
  res.json({ ok: true, productIds: [], type: 'user', userId: req.user.id });
}));

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
    SELECT u.id, u.name, u.email, u.role, u.email_verified, u.created_at,
           COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id), 0)::int AS order_count
    FROM users u
    ORDER BY u.id ASC
  `);
  res.json(rows);
}));

app.patch('/api/admin/users/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be user or admin' });

  const target = await pool.query('SELECT id, role, email FROM users WHERE id=$1', [id]);
  if (!target.rows.length) return res.status(404).json({ error: 'User not found' });

  if (target.rows[0].role === 'admin' && role === 'user') {
    const admins = await pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role='admin'");
    if (admins.rows[0].c <= 1) return res.status(400).json({ error: 'Cannot demote the only admin account' });
  }

  await pool.query('UPDATE users SET role=$1 WHERE id=$2', [role, id]);
  res.json({ ok: true });
}));

app.delete('/api/admin/users/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  const target = await pool.query('SELECT id, email, role FROM users WHERE id=$1', [id]);
  if (!target.rows.length) return res.status(404).json({ error: 'User not found' });

  const email = target.rows[0].email.toLowerCase();
  if (email === 'admin@flora.com') {
    return res.status(400).json({ error: 'Cannot delete the primary admin account' });
  }
  if (target.rows[0].role === 'admin') {
    const admins = await pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role='admin'");
    if (admins.rows[0].c <= 1) return res.status(400).json({ error: 'Cannot delete the only admin account' });
  }

  await pool.query('DELETE FROM email_pins WHERE email=$1', [email]);
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.json({ ok: true });
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

app.delete('/api/admin/orders/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM orders WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
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

app.delete('/api/admin/reservations/:id', auth(true), requireAdmin, wrap(async (req, res) => {
  const r = await pool.query('DELETE FROM reservations WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Reservation not found' });
  res.json({ ok: true });
}));

const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
app.use('/assets/js', express.static(path.join(ASSETS_DIR, 'js'), { maxAge: 0, etag: true }));
app.use('/assets', express.static(ASSETS_DIR, {
  maxAge: NODE_ENV === 'production' ? '7d' : 0,
  immutable: NODE_ENV === 'production',
  etag: true,
}));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: 0, etag: true }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`✿ Flora & Gifts listening on :${PORT} (${NODE_ENV})`);
  initDb()
    .then(() => {
      dbReady = true;
      console.log('✓ Database ready');
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
});
