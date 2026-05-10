/* Flora & Gifts — frontend
 * All business state (users, products, orders, reservations) lives in Postgres
 * and is fetched via /api/*. Cart stays in localStorage for anonymous shoppers. */
(function () {
  'use strict';

  // ─── CONSTANTS ────────────────────────────────────────────────
  const CURRENCY = { symbol: '₺', code: 'TRY' };
  const fmt = (n) => CURRENCY.symbol + Number(n || 0).toLocaleString('tr-TR');
  const WRAP_BASIC = 75, WRAP_LUX = 150, CARD_COST = 100, DELIVERY = 300;
  const eventServices = ['Wedding Full Package','Engagement Party','Birthday Celebration','Corporate Event','Baptism / Baby Shower','Anniversary Dinner'];
  const categories = ['all','flowers','gifts','wedding'];

  // ─── PERSISTENCE (cart + token only) ──────────────────────────
  const KEY = 'flora.';
  const Store = {
    get(k, fb) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {} },
    clear(k) { try { localStorage.removeItem(KEY + k); } catch {} },
  };

  let cart = Store.get('cart', []);
  let token = Store.get('token', null);
  let currentUser = Store.get('user', null);
  let products = [];
  let productsLoaded = false;

  // Normalize state on load: a cached user without a token is meaningless.
  // Always start logged-out unless we have a token to validate against the server.
  if (!token && currentUser) {
    currentUser = null;
    Store.clear('user');
  }

  // ─── API CLIENT ───────────────────────────────────────────────
  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = 'Bearer ' + token;
    // Fail-fast: don't let a hung request lock up the UI.
    const controller = new AbortController();
    const timeoutMs = opts.timeoutMs || 20000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(path, {
        ...opts,
        headers,
        signal: controller.signal,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Request timed out — please check your connection.');
      throw new Error('Network error: ' + (e.message || 'could not reach server'));
    }
    clearTimeout(timer);
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { error: text }; }
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText || 'Request failed');
      err.status = res.status;
      err.data = data;
      if (res.status === 401) {
        // Always clear stale auth on any 401, even if no token was sent.
        // This prevents the nav showing "logged in" state while the API rejects everything.
        if (token) { token = null; Store.clear('token'); }
        if (currentUser) { currentUser = null; Store.clear('user'); }
      }
      throw err;
    }
    return data;
  }

  const Api = {
    sendPin:  (body) => api('/api/auth/send-pin', { method: 'POST', body }),
    register: (body) => api('/api/auth/register', { method: 'POST', body }),
    login:    (body) => api('/api/auth/login',    { method: 'POST', body }),
    me:       ()     => api('/api/auth/me'),
    products: ()     => api('/api/products'),
    productById: (id) => api('/api/products/' + id),
    addProduct: (body) => api('/api/products', { method: 'POST', body }),
    deleteProduct: (id) => api('/api/products/' + id, { method: 'DELETE' }),
    myOrders: () => api('/api/orders'),
    placeOrder: (body) => api('/api/orders', { method: 'POST', body }),
    bookedDates: () => api('/api/reservations/dates'),
    submitReservation: (body) => api('/api/reservations', { method: 'POST', body }),
    adminStats: () => api('/api/admin/stats'),
    adminUsers: () => api('/api/admin/users'),
    adminOrders: () => api('/api/admin/orders'),
    adminUpdateOrder: (id, status) => api('/api/admin/orders/' + id, { method: 'PATCH', body: { status } }),
    adminReservations: () => api('/api/admin/reservations'),
    adminUpdateReservation: (id, status) => api('/api/admin/reservations/' + id, { method: 'PATCH', body: { status } }),
  };

  // ─── LAYOUT TEMPLATES ─────────────────────────────────────────
  function navHTML(activePage) {
    const adminItem = currentUser && currentUser.role === 'admin'
      ? `<a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${activePage==='admin'?'is-active':''}" href="admin.html">Admin</a>` : '';
    const adminDrawerItem = currentUser && currentUser.role === 'admin'
      ? `<a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='admin'?'is-active':''}" href="admin.html">Admin</a>` : '';
    const authLabel = currentUser ? 'My Orders' : 'Login';
    const authHref  = currentUser ? 'orders.html' : 'auth.html';
    const authActive = (currentUser && activePage==='orders') || (!currentUser && activePage==='auth');
    const logoutItem = currentUser
      ? `<button class="nav-link font-label text-label-sm text-on-surface-variant hover:text-error transition flex items-center gap-1" id="navLogoutBtn" title="Logout from ${currentUser.email}">
           <span class="material-symbols-outlined text-[18px]">logout</span>
           <span>Logout</span>
         </button>` : '';

    return `
    <div class="bg-primary text-on-primary py-2 text-center">
      <p class="font-label text-label-sm uppercase tracking-[0.2em] px-4">Complimentary artisanal gift wrapping on orders above 1.500 TRY</p>
    </div>
    <nav class="bg-surface/95 backdrop-blur border-b border-outline-variant/20 sticky top-0 z-40">
      <div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 md:py-5 max-w-container-max mx-auto">
        <a class="font-display text-2xl md:text-headline-md text-primary italic tracking-tight" href="index.html">Flora <span class="not-italic font-normal">&amp;</span> Gifts</a>
        <div class="hidden md:flex items-center gap-10">
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${activePage==='shop'?'is-active':''}" href="shop.html">Shop</a>
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${activePage==='events'?'is-active':''}" href="events.html">Events</a>
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${authActive?'is-active':''}" href="${authHref}">${authLabel}</a>
          ${adminItem}
          ${logoutItem}
          <a class="relative" href="cart.html" aria-label="Cart">
            <span class="material-symbols-outlined text-primary text-[28px]">shopping_bag</span>
            <span class="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold" data-cart-badge>0</span>
          </a>
        </div>
        <div class="md:hidden flex items-center gap-3">
          <a class="relative" href="cart.html" aria-label="Cart">
            <span class="material-symbols-outlined text-primary text-[26px]">shopping_bag</span>
            <span class="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold" data-cart-badge>0</span>
          </a>
          <button class="text-primary p-1" id="navOpenBtn" aria-label="Open menu">
            <span class="material-symbols-outlined text-[28px]">menu</span>
          </button>
        </div>
      </div>
    </nav>
    <div class="drawer-overlay fixed inset-0 bg-black/40 z-50" id="drawerOverlay"></div>
    <aside class="drawer fixed top-0 right-0 w-[85%] max-w-sm h-full bg-surface z-[60] shadow-2xl flex flex-col" id="drawer">
      <div class="flex justify-between items-center px-6 py-5 border-b border-outline-variant/30">
        <span class="font-display italic text-headline-md text-primary">Flora &amp; Gifts</span>
        <button id="navCloseBtn" aria-label="Close menu">
          <span class="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>
      <nav class="flex flex-col p-4 gap-1">
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='home'?'is-active':''}" href="index.html">Home</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='shop'?'is-active':''}" href="shop.html">Shop</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='events'?'is-active':''}" href="events.html">Events</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='cart'?'is-active':''}" href="cart.html">Cart</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${authActive?'is-active':''}" href="${authHref}">${authLabel}</a>
        ${adminDrawerItem}
        ${currentUser ? `<button class="drawer-link block w-full text-left px-4 py-4 rounded-lg font-display text-2xl text-on-surface-variant hover:bg-surface-container-low transition" id="logoutDrawerBtn">Logout</button>` : ''}
      </nav>
      <div class="mt-auto p-6 border-t border-outline-variant/30 text-center">
        <p class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">${currentUser ? 'Signed in as ' + currentUser.email : 'Crafted with botanical poetry'}</p>
      </div>
    </aside>`;
  }

  function footerHTML() {
    return `
    <footer class="bg-surface-container-low border-t border-outline-variant/20 relative z-10 mt-20">
      <div class="w-full pt-16 md:pt-20 pb-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start gap-12">
          <div class="max-w-sm">
            <a class="font-display italic text-headline-md text-primary mb-4 block" href="index.html">Flora &amp; Gifts</a>
            <p class="font-body text-on-surface-variant mb-6">Crafting botanical poetry through curated floral experiences. Bringing beauty and emotional connection into every home.</p>
            <div class="flex gap-3">
              <a class="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition" href="#"><span class="material-symbols-outlined text-[18px]">share</span></a>
              <a class="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition" href="#"><span class="material-symbols-outlined text-[18px]">mail</span></a>
              <a class="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition" href="#"><span class="material-symbols-outlined text-[18px]">photo_camera</span></a>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
            <div class="flex flex-col gap-3">
              <span class="font-label text-label-sm text-primary uppercase tracking-widest mb-1">Shop</span>
              <a class="text-on-surface-variant hover:text-primary transition" href="shop.html">All Flowers</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="events.html">Events</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="cart.html">Cart</a>
            </div>
            <div class="flex flex-col gap-3">
              <span class="font-label text-label-sm text-primary uppercase tracking-widest mb-1">Company</span>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Our Story</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Sustainability</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Contact</a>
            </div>
            <div class="flex flex-col gap-3">
              <span class="font-label text-label-sm text-primary uppercase tracking-widest mb-1">Resources</span>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Flower Care</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Shipping</a>
              <a class="text-on-surface-variant hover:text-primary transition" href="#">Returns</a>
            </div>
          </div>
        </div>
        <div class="mt-12 pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-3">
          <p class="font-label text-label-sm text-on-surface-variant uppercase tracking-widest">© 2025 Flora &amp; Gifts. Crafted with botanical poetry.</p>
          <div class="flex gap-6">
            <a class="font-label text-label-sm text-on-surface-variant hover:text-primary" href="#">Privacy</a>
            <a class="font-label text-label-sm text-on-surface-variant hover:text-primary" href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function ambientHTML() {
    return `
    <span class="ambient-bloom b1 material-symbols-outlined">local_florist</span>
    <span class="ambient-bloom b2 material-symbols-outlined">eco</span>
    <div class="toast" id="toast"></div>`;
  }

  // ─── UI HELPERS ───────────────────────────────────────────────
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) { console.log('[toast]', msg); return; }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function applyReveal() {
    const items = document.querySelectorAll('.reveal:not(.reveal-bound)');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => { el.classList.add('show', 'reveal-bound'); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('show'), i * 40);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(el => { el.classList.add('reveal-bound'); io.observe(el); });
  }

  function setupDrawer() {
    const open    = document.getElementById('navOpenBtn');
    const close   = document.getElementById('navCloseBtn');
    const drawer  = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    if (!drawer || !overlay) return;
    const openD = () => { drawer.classList.add('open'); overlay.classList.add('open'); document.body.classList.add('menu-open'); };
    const closeD = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.classList.remove('menu-open'); };
    if (open) open.addEventListener('click', openD);
    if (close) close.addEventListener('click', closeD);
    overlay.addEventListener('click', closeD);
  }

  function bindLogoutButtons() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      if (btn._floraBound) return;
      btn._floraBound = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        doLogout();
      });
    });
    // Also wire up the legacy id-based buttons
    ['navLogoutBtn', 'logoutDrawerBtn', 'logoutBtn', 'adminLogoutBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._floraBound) {
        el._floraBound = true;
        el.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
      }
    });
  }

  function doLogout() {
    token = null;
    currentUser = null;
    Store.clear('token');
    Store.clear('user');
    toast('Logged out — see you again soon');
    setTimeout(() => { location.href = 'index.html'; }, 500);
  }

  function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach(el => el.textContent = String(count));
  }

  function loadingHTML(label) {
    return `<div class="text-center py-16 text-on-surface-variant"><span class="material-symbols-outlined animate-spin text-4xl text-primary block mb-3">refresh</span>${label || 'Loading...'}</div>`;
  }

  function errorHTML(msg) {
    return `<div class="text-center py-16 text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl text-error block mb-3">error_outline</span>
      <p class="mb-4">${msg || 'Something went wrong.'}</p>
      <button class="bg-primary text-on-primary px-6 py-3 rounded-full font-label text-label-sm uppercase tracking-widest" onclick="location.reload()">Retry</button>
    </div>`;
  }

  // ─── PRODUCT CACHE ────────────────────────────────────────────
  async function ensureProducts() {
    if (productsLoaded) return products;
    products = await Api.products();
    productsLoaded = true;
    return products;
  }

  // ─── CART ─────────────────────────────────────────────────────
  function calcPrice(p, opts) {
    let price = p.price;
    if (opts && opts.wrap) {
      const i = (p.wrapping || []).indexOf(opts.wrap);
      if (i === 0) price += WRAP_BASIC;
      else if (i === 1) price += WRAP_LUX;
    }
    if (opts && opts.card) price += CARD_COST;
    return price;
  }

  function addToCart(id, qty, opts) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const price = calcPrice(p, opts || {});
    const key = JSON.stringify(opts || {});
    const existing = cart.find(i => i.id === id && JSON.stringify(i.opts) === key);
    if (existing) existing.qty = Math.min(p.stock, existing.qty + qty);
    else cart.push({ id, qty, opts: opts || {}, price, name: p.name, image: p.image });
    Store.set('cart', cart);
    updateCartBadge();
    toast('Added to your collection');
  }

  // ─── PRODUCT CARD ─────────────────────────────────────────────
  function productCardHTML(p) {
    return `
    <a href="product.html?id=${p.id}" class="product-card group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full border border-outline-variant/10 cursor-pointer reveal block">
      <div class="aspect-[4/5] overflow-hidden bg-surface-container-low relative">
        <img alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${p.image}" loading="lazy"/>
        ${p.stock <= 5 ? `<span class="absolute top-3 left-3 bg-primary text-on-primary text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">Only ${p.stock} left</span>` : ''}
      </div>
      <div class="p-4 md:p-6 flex flex-col flex-grow text-center">
        <span class="font-label text-[10px] text-outline tracking-[0.2em] uppercase mb-1 md:mb-2">${p.category}</span>
        <h3 class="font-display text-lg md:text-xl text-on-surface mb-1">${p.name}</h3>
        <p class="font-body italic text-on-surface-variant text-xs md:text-sm mb-2 md:mb-3 hidden md:block">${p.tagline || ''}</p>
        <p class="mt-auto font-body text-secondary font-semibold text-base md:text-lg">${fmt(p.price)} <span class="text-xs text-on-surface-variant font-normal">${CURRENCY.code}</span></p>
        <button class="mt-3 md:mt-4 w-full bg-primary/5 text-primary py-2.5 md:py-3 rounded-lg font-label text-label-sm group-hover:bg-primary group-hover:text-on-primary transition-colors" data-add="${p.id}">Add to Cart</button>
      </div>
    </a>`;
  }

  function bindCardAddButtons(root) {
    (root || document).querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(parseInt(btn.dataset.add, 10), 1, {});
      });
    });
  }

  // ─── PAGE: HOME ───────────────────────────────────────────────
  async function initHome() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) { applyReveal(); return; }
    grid.innerHTML = loadingHTML('Loading featured collection...');
    try {
      await ensureProducts();
      grid.innerHTML = products.slice(0, 4).map(productCardHTML).join('');
      bindCardAddButtons(grid);
    } catch (e) {
      grid.innerHTML = errorHTML('Could not load products. ' + e.message);
    }
    applyReveal();
  }

  // ─── PAGE: SHOP ───────────────────────────────────────────────
  let shopState = { category: 'all', q: '' };

  function renderShop() {
    const fb = document.getElementById('filterBtns');
    if (fb) {
      fb.innerHTML = categories.map(c => `
        <li>
          <button class="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${c === shopState.category ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low'}" data-cat="${c}">
            <span class="capitalize">${c}</span>
            <span class="text-[10px] opacity-60">${c === 'all' ? products.length : products.filter(p=>p.category===c).length}</span>
          </button>
        </li>`).join('');
      fb.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
        shopState.category = b.dataset.cat; renderShop();
      }));
    }
    const grid = document.getElementById('productsGrid');
    if (grid) {
      const filtered = products.filter(p => {
        const okCat = shopState.category === 'all' || p.category === shopState.category;
        const okQ = !shopState.q || p.name.toLowerCase().includes(shopState.q) || (p.desc || '').toLowerCase().includes(shopState.q);
        return okCat && okQ;
      });
      grid.innerHTML = filtered.length
        ? filtered.map(productCardHTML).join('')
        : `<div class="col-span-full text-center py-16 text-on-surface-variant"><span class="material-symbols-outlined text-4xl block mb-3 opacity-50">search_off</span>No products match your search.</div>`;
      bindCardAddButtons(grid);
    }
    applyReveal();
  }

  async function initShop() {
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = loadingHTML('Loading collection...');
    try {
      await ensureProducts();
    } catch (e) {
      if (grid) grid.innerHTML = errorHTML('Could not load products. ' + e.message);
      return;
    }
    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', (e) => { shopState.q = e.target.value.toLowerCase(); renderShop(); });
    renderShop();
  }

  // ─── PAGE: PRODUCT DETAIL ─────────────────────────────────────
  let detailState = { qty: 1, opts: {}, gallery: 0 };

  function renderDetail(p) {
    const root = document.getElementById('detailContent');
    if (!root) return;
    document.title = `${p.name} | Flora & Gifts`;
    const total = calcPrice(p, detailState.opts) * detailState.qty;
    const gallery = (p.gallery && p.gallery.length) ? p.gallery : [p.image];
    const heroImg = gallery[detailState.gallery] || p.image;
    const attrs = p.attributes || [
      { icon: 'local_florist',  label: 'Freshness', value: 'Crafted Today' },
      { icon: 'workspace_premium', label: 'Quality', value: 'Hand-Selected' },
    ];
    const careNotes = p.care || [
      { icon: 'spa', title: 'A Gentle Touch',  text: 'Trim stems at an angle every two days and refresh the water to keep your blooms radiant for longer.' },
      { icon: 'water_drop', title: 'The Daily Ritual', text: 'Place away from direct sunlight, drafts, and ripening fruit. Mist the petals lightly each morning.' },
    ];
    const wrappingArr = Array.isArray(p.wrapping) ? p.wrapping : [];

    root.innerHTML = `
      <a class="font-label text-label-sm text-on-surface-variant hover:text-primary transition mb-8 inline-flex items-center gap-2" href="shop.html">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span> Back to Shop
      </a>
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-16 md:mb-24">
        <div class="lg:col-span-7 flex flex-col gap-4 md:gap-6 reveal">
          <div class="aspect-square bg-surface-container overflow-hidden rounded-xl shadow-sm shadow-primary/5">
            <img alt="${p.name}" class="w-full h-full object-cover transition-opacity duration-500" src="${heroImg}"/>
          </div>
          <div class="grid grid-cols-4 gap-3 md:gap-4">
            ${gallery.slice(0, 4).map((src, i) => `
              <button class="aspect-square bg-surface-container rounded-md overflow-hidden cursor-pointer transition-all ${detailState.gallery === i ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40'}" data-gallery="${i}">
                <img alt="${p.name} thumbnail ${i+1}" class="w-full h-full object-cover" src="${src}"/>
              </button>`).join('')}
            ${gallery.length < 4 ? Array.from({ length: 4 - gallery.length }).map(() => `
              <div class="aspect-square bg-surface-container rounded-md overflow-hidden flex items-center justify-center opacity-50">
                <span class="material-symbols-outlined text-primary/40">image</span>
              </div>`).join('') : ''}
          </div>
        </div>
        <div class="lg:col-span-5 lg:sticky lg:top-32 reveal">
          <nav class="flex gap-2 text-on-surface-variant font-label text-label-sm mb-6 uppercase tracking-wider flex-wrap">
            <a class="hover:text-primary transition" href="shop.html">Shop</a><span>/</span>
            <span class="capitalize">${p.category}</span><span>/</span>
            <span class="text-primary font-bold truncate">${p.name}</span>
          </nav>
          <h1 class="font-display text-headline-md md:text-headline-lg text-primary mb-2">${p.name}</h1>
          <p class="font-display text-2xl md:text-headline-md text-secondary mb-6">${fmt(total)} <span class="text-base text-on-surface-variant font-normal">${CURRENCY.code}</span></p>
          <div class="botanical-divider mb-6"></div>
          <p class="font-body text-body-lg text-on-surface italic mb-4">"${p.tagline || ''}"</p>
          <p class="font-body text-body-md text-on-surface-variant leading-relaxed mb-8">${p.desc || ''}</p>
          <div class="grid grid-cols-2 gap-3 mb-8">
            ${attrs.map(a => `
              <div class="flex items-center gap-3 bg-surface-container-low p-3 md:p-4 rounded-lg">
                <span class="material-symbols-outlined text-secondary">${a.icon}</span>
                <div>
                  <p class="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">${a.label}</p>
                  <p class="font-body text-on-surface font-semibold text-sm">${a.value}</p>
                </div>
              </div>`).join('')}
          </div>
          ${wrappingArr.length ? `
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Wrapping Style</label>
            <div class="flex flex-wrap gap-2">
              ${wrappingArr.map((w, i) => `
                <button class="px-4 py-2 rounded-lg text-sm border transition ${detailState.opts.wrap === w ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:border-primary'}" data-wrap="${w}">
                  ${w}${i === 0 ? ` +${fmt(WRAP_BASIC)}` : i === 1 ? ` +${fmt(WRAP_LUX)}` : ''}
                </button>`).join('')}
            </div>
          </div>` : ''}
          ${p.card ? `
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Personal Card</label>
            <button class="w-full text-left px-4 py-3 rounded-lg border transition ${detailState.opts.card ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:border-primary'}" id="cardToggle">
              ${detailState.opts.card ? '✓ Card included' : 'Add a personal card'} <span class="opacity-70 text-xs ml-2">+${fmt(CARD_COST)}</span>
            </button>
            ${detailState.opts.card ? `<input class="w-full mt-3 bg-surface-container-low border border-outline-variant/40 rounded-lg p-3 focus:outline-none focus:border-primary" placeholder="Your message..." id="cardMsg" value="${detailState.opts.msg || ''}"/>` : ''}
          </div>` : ''}
          <div class="mb-8">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Quantity</label>
            <div class="flex items-center gap-4">
              <button class="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary flex items-center justify-center transition" data-qty="-1">−</button>
              <span class="font-display text-2xl min-w-[2rem] text-center">${detailState.qty}</span>
              <button class="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary flex items-center justify-center transition" data-qty="1">+</button>
              <span class="text-sm text-on-surface-variant ml-2">${p.stock} in stock</span>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <button class="w-full bg-primary text-on-primary py-4 md:py-5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/10" id="addCartBtn">
              <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
              Add to Cart — ${fmt(total)} ${CURRENCY.code}
            </button>
            ${p.card ? `
            <button class="w-full border border-secondary text-secondary py-4 md:py-5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:bg-secondary/5 transition" id="personalizeBtn">Personalize with a Message</button>` : ''}
          </div>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-4 border-y border-outline-variant/30">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-on-surface-variant text-[18px]">local_shipping</span>
              <span class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Same Day Delivery</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-on-surface-variant text-[18px]">workspace_premium</span>
              <span class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </section>
      <section class="mb-16 md:mb-24">
        <div class="flex flex-col items-center text-center mb-10 reveal">
          <span class="material-symbols-outlined text-primary mb-3 text-4xl">card_giftcard</span>
          <h2 class="font-display text-headline-md md:text-headline-lg text-primary mb-2">Complete the Gift</h2>
          <p class="text-on-surface-variant max-w-lg">Thoughtful additions curated to elevate the experience.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-gutter" id="completeGrid">
          ${products.filter(x => x.id !== p.id).slice(0, 3).map(productCardHTML).join('')}
        </div>
      </section>
      <section class="bg-surface-container rounded-2xl p-6 md:p-12 lg:p-16 mb-16 md:mb-24 relative overflow-hidden reveal">
        <div class="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
          <span class="material-symbols-outlined text-[260px] md:text-[300px] text-primary">potted_plant</span>
        </div>
        <div class="max-w-2xl relative z-10">
          <h2 class="font-display text-headline-md md:text-headline-lg text-primary mb-6">Care as Poetry</h2>
          <div class="space-y-6 md:space-y-8">
            ${careNotes.map(c => `
              <div class="flex gap-5 md:gap-6">
                <div class="w-12 h-12 rounded-full border border-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary">${c.icon}</span>
                </div>
                <div>
                  <h4 class="font-display text-lg md:text-xl text-primary mb-2">${c.title}</h4>
                  <p class="text-on-surface-variant font-body">${c.text}</p>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;

    root.querySelectorAll('[data-gallery]').forEach(b => b.addEventListener('click', () => { detailState.gallery = parseInt(b.dataset.gallery, 10); renderDetail(p); }));
    root.querySelectorAll('[data-wrap]').forEach(b => b.addEventListener('click', () => { detailState.opts.wrap = b.dataset.wrap; renderDetail(p); }));
    root.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
      const d = parseInt(b.dataset.qty, 10);
      detailState.qty = Math.max(1, Math.min(p.stock, detailState.qty + d));
      renderDetail(p);
    }));
    const cardToggle = document.getElementById('cardToggle');
    if (cardToggle) cardToggle.addEventListener('click', () => { detailState.opts.card = !detailState.opts.card; renderDetail(p); });
    const personalizeBtn = document.getElementById('personalizeBtn');
    if (personalizeBtn) personalizeBtn.addEventListener('click', () => {
      detailState.opts.card = true; renderDetail(p);
      setTimeout(() => { const el = document.getElementById('cardMsg'); if (el) el.focus(); }, 80);
    });
    const addBtn = document.getElementById('addCartBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
      const el = document.getElementById('cardMsg');
      if (el) detailState.opts.msg = el.value;
      addToCart(p.id, detailState.qty, { ...detailState.opts });
      setTimeout(() => location.href = 'cart.html', 600);
    });
    bindCardAddButtons(document.getElementById('completeGrid'));
    applyReveal();
  }

  async function initProduct() {
    const root = document.getElementById('detailContent');
    if (!root) return;
    root.innerHTML = loadingHTML('Loading product...');
    detailState = { qty: 1, opts: {}, gallery: 0 };
    const id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    if (!id) { root.innerHTML = errorHTML('No product selected.'); return; }
    try {
      await ensureProducts();
      const p = products.find(x => x.id === id);
      if (!p) {
        root.innerHTML = `<div class="text-center py-16"><p class="text-on-surface-variant mb-4">Product not found.</p><a class="bg-primary text-on-primary px-6 py-3 rounded-full font-label text-label-sm uppercase tracking-widest" href="shop.html">Browse Collection</a></div>`;
        return;
      }
      renderDetail(p);
    } catch (e) {
      root.innerHTML = errorHTML(e.message);
    }
  }

  // ─── PAGE: CART ───────────────────────────────────────────────
  function renderCart() {
    const el = document.getElementById('cartContent');
    if (!el) return;
    if (!cart.length) {
      el.innerHTML = `
        <div class="text-center py-16 md:py-24 reveal">
          <span class="material-symbols-outlined text-6xl text-primary/30 mb-4">shopping_bag</span>
          <h2 class="font-display text-headline-md text-on-surface mb-3">Your cart awaits a story</h2>
          <p class="text-on-surface-variant mb-8 max-w-md mx-auto">Discover our beautiful collection and let botanical poetry fill your space.</p>
          <a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block" href="shop.html">Browse Collection</a>
        </div>`;
      applyReveal();
      return;
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    el.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden reveal">
          ${cart.map((item, idx) => `
            <div class="flex items-center gap-4 p-4 md:p-6 border-b border-outline-variant/30 last:border-b-0">
              <img src="${item.image}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"/>
              <div class="flex-1 min-w-0">
                <h3 class="font-display text-base md:text-lg text-on-surface truncate">${item.name}</h3>
                <p class="text-xs md:text-sm text-on-surface-variant">${item.opts.wrap || ''}${item.opts.card ? ' · With Card' : ''}</p>
                <p class="md:hidden text-secondary font-semibold mt-1">${fmt(item.price * item.qty)}</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary transition" data-idx="${idx}" data-d="-1">−</button>
                <span class="w-6 text-center font-semibold">${item.qty}</span>
                <button class="w-8 h-8 rounded-full bg-surface-container-low hover:bg-primary hover:text-on-primary transition" data-idx="${idx}" data-d="1">+</button>
              </div>
              <p class="hidden md:block font-body text-secondary font-semibold min-w-[100px] text-right">${fmt(item.price * item.qty)}</p>
              <button class="text-on-surface-variant hover:text-error transition p-1" data-remove="${idx}" aria-label="Remove">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>`).join('')}
        </div>
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 lg:sticky lg:top-32 h-fit reveal">
          <h3 class="font-display text-headline-md text-primary mb-6">Order Summary</h3>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-on-surface-variant"><span>Subtotal</span><span>${fmt(subtotal)} ${CURRENCY.code}</span></div>
            <div class="flex justify-between text-on-surface-variant"><span>Delivery</span><span>${fmt(DELIVERY)} ${CURRENCY.code}</span></div>
          </div>
          <div class="flex justify-between font-display text-2xl text-primary pt-4 border-t border-outline-variant/30 mb-6">
            <span>Total</span><span>${fmt(subtotal + DELIVERY)} ${CURRENCY.code}</span>
          </div>
          <a class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition block text-center" href="checkout.html">Proceed to Checkout</a>
          <a class="w-full mt-3 border border-outline-variant/40 text-on-surface-variant py-3 rounded-lg font-label text-label-sm hover:border-primary hover:text-primary transition block text-center" href="shop.html">Continue Shopping</a>
        </div>
      </div>`;
    el.querySelectorAll('[data-idx]').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.idx, 10), d = parseInt(b.dataset.d, 10);
      const p = products.find(x => x.id === cart[idx].id);
      const max = p ? p.stock : 99;
      cart[idx].qty = Math.max(1, Math.min(max, cart[idx].qty + d));
      Store.set('cart', cart); updateCartBadge(); renderCart();
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      cart.splice(parseInt(b.dataset.remove, 10), 1);
      Store.set('cart', cart); updateCartBadge(); renderCart();
    }));
    applyReveal();
  }

  async function initCart() {
    if (cart.length) {
      try { await ensureProducts(); } catch {}
    }
    renderCart();
  }

  // ─── PAGE: CHECKOUT ───────────────────────────────────────────
  let checkoutState = { pm: 'cash' };

  async function initCheckout() {
    const el = document.getElementById('checkoutContent');
    if (!el) return;
    if (!currentUser) {
      el.innerHTML = `
        <div class="text-center py-16 reveal">
          <span class="material-symbols-outlined text-5xl text-primary/40 mb-4">lock</span>
          <h2 class="font-display text-headline-md text-on-surface mb-3">Login Required</h2>
          <p class="text-on-surface-variant mb-6">You need an account to complete your purchase.</p>
          <a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block" href="auth.html">Login / Register</a>
        </div>`;
      applyReveal();
      return;
    }
    if (!cart.length) {
      el.innerHTML = `<div class="text-center py-16 reveal"><h2 class="font-display text-headline-md text-on-surface mb-3">Your cart is empty</h2><a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest inline-block" href="shop.html">Shop Now</a></div>`;
      applyReveal();
      return;
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    el.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div class="space-y-6 reveal">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8">
            <h3 class="font-display text-headline-md text-primary mb-6 pb-4 border-b border-outline-variant/30">01. Delivery Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant block mb-2">Full Name</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" value="${currentUser.name}" id="chkName"/></div>
              <div><label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant block mb-2">Phone</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" placeholder="+90 555 000 00 00" id="chkPhone"/></div>
            </div>
            <div class="mb-4"><label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant block mb-2">Address</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" placeholder="Street, building, floor..." id="chkAddr"/></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant block mb-2">City</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" placeholder="Istanbul" id="chkCity"/></div>
              <div><label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant block mb-2">Delivery Date</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" type="date" min="${new Date().toISOString().split('T')[0]}" id="chkDate"/></div>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8">
            <h3 class="font-display text-headline-md text-primary mb-6 pb-4 border-b border-outline-variant/30">02. Payment Method</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3" id="pmGroup">
              ${[['cash','Cash on Delivery','payments'],['card','Card','credit_card'],['transfer','Bank Transfer','account_balance']].map(([k,l,ic]) => `
                <button class="pm-btn flex items-center gap-2 p-4 rounded-lg border transition ${checkoutState.pm===k?'bg-primary text-on-primary border-primary':'bg-surface-container-low border-outline-variant/40 hover:border-primary'}" data-pm="${k}">
                  <span class="material-symbols-outlined text-[20px]">${ic}</span>
                  <span class="text-sm">${l}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 lg:sticky lg:top-32 h-fit reveal">
          <h3 class="font-display text-headline-md text-primary mb-5">Order Review</h3>
          <div class="space-y-3 mb-5 max-h-72 overflow-y-auto">
            ${cart.map(i => `
              <div class="flex items-center gap-3 text-sm">
                <img src="${i.image}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                <div class="flex-1 min-w-0"><p class="truncate font-semibold">${i.name}</p><p class="text-xs text-on-surface-variant">×${i.qty}</p></div>
                <span class="text-secondary font-semibold">${fmt(i.price * i.qty)}</span>
              </div>`).join('')}
          </div>
          <div class="border-t border-outline-variant/30 pt-4 space-y-2">
            <div class="flex justify-between text-on-surface-variant"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div class="flex justify-between text-on-surface-variant"><span>Delivery</span><span>${fmt(DELIVERY)}</span></div>
            <div class="flex justify-between font-display text-2xl text-primary pt-3 border-t border-outline-variant/30"><span>Total</span><span>${fmt(subtotal + DELIVERY)}</span></div>
          </div>
          <button class="w-full mt-6 bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="placeOrderBtn">Place Order</button>
        </div>
      </div>`;
    document.querySelectorAll('.pm-btn').forEach(b => b.addEventListener('click', () => {
      checkoutState.pm = b.dataset.pm;
      document.querySelectorAll('.pm-btn').forEach(x => {
        const a = x.dataset.pm === checkoutState.pm;
        x.classList.toggle('bg-primary', a); x.classList.toggle('text-on-primary', a); x.classList.toggle('border-primary', a);
        x.classList.toggle('bg-surface-container-low', !a); x.classList.toggle('border-outline-variant/40', !a);
      });
    }));
    document.getElementById('placeOrderBtn').addEventListener('click', async () => {
      const addr = document.getElementById('chkAddr').value.trim();
      if (!addr) { toast('Please enter your address'); return; }
      const btn = document.getElementById('placeOrderBtn');
      btn.disabled = true; btn.textContent = 'Placing order...';
      try {
        await Api.placeOrder({
          items: cart, total: subtotal + DELIVERY, address: addr, payment: checkoutState.pm,
        });
        cart = [];
        Store.set('cart', cart);
        updateCartBadge();
        toast('Order placed — botanical poetry on its way ✿');
        setTimeout(() => location.href = 'orders.html', 800);
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Place Order';
        toast(e.message || 'Could not place order');
      }
    });
    applyReveal();
  }

  // ─── PAGE: EVENTS / RESERVATION ───────────────────────────────
  let eventsSuccess = false;
  let bookedDates = [];

  function renderEventForm() {
    const el = document.getElementById('reservationContent');
    if (!el) return;
    if (eventsSuccess) {
      el.innerHTML = `
        <div class="bg-success-container rounded-xl border border-success/30 p-8 md:p-12 text-center">
          <span class="material-symbols-outlined text-5xl text-success mb-4">spa</span>
          <h3 class="font-display text-headline-md text-success mb-3">Inquiry Received</h3>
          <p class="text-on-surface-variant mb-6">Our creative director will contact you within 24 hours to discuss your vision.</p>
          <button class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="resAgainBtn">Make Another Inquiry</button>
        </div>`;
      document.getElementById('resAgainBtn').addEventListener('click', () => { eventsSuccess = false; renderEventForm(); });
      return;
    }
    el.innerHTML = `
      <form class="bg-surface p-6 md:p-10 rounded-xl shadow-sm shadow-primary/5 space-y-8" id="resForm">
        <div class="bg-primary-fixed/30 border border-primary/20 rounded-lg p-4 text-sm">
          <strong class="text-primary block mb-2">📅 Already Booked Dates</strong>
          <div class="flex flex-wrap gap-2">${bookedDates.length ? bookedDates.map(d => `<span class="bg-primary text-on-primary text-xs px-3 py-1 rounded-full">${d}</span>`).join('') : '<span class="text-xs text-on-surface-variant italic">No bookings yet — your date is wide open.</span>'}</div>
        </div>
        <div>
          <h3 class="font-display text-headline-md text-primary mb-6 pb-3 border-b border-outline-variant/30">01. The Occasion</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Full Name</label><input class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rName" placeholder="Your full name"/></div>
            <div><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Phone</label><input class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rPhone" placeholder="+90 555 000 00 00"/></div>
            <div class="md:col-span-2"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Email</label><input type="email" class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rEmail" placeholder="email@example.com"/></div>
            <div class="md:col-span-2"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Event Type</label>
              <select class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rService">${eventServices.map(s => `<option>${s}</option>`).join('')}</select>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-display text-headline-md text-primary mb-6 pb-3 border-b border-outline-variant/30">02. The Setting</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Event Date</label><input type="date" class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rDate" min="${new Date().toISOString().split('T')[0]}"/></div>
            <div><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Estimated Guests</label><input type="number" class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rGuests" placeholder="Approx. 100" min="1"/></div>
          </div>
          <div id="dateWarning" class="mt-3"></div>
        </div>
        <div>
          <h3 class="font-display text-headline-md text-primary mb-6 pb-3 border-b border-outline-variant/30">03. The Palette</h3>
          <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-3">Creative Notes</label>
          <textarea class="w-full bg-surface-container-low border-none p-4 rounded-lg focus:ring-1 focus:ring-secondary" id="rNotes" rows="4" placeholder="Theme, color palette, special requests..."></textarea>
        </div>
        <button type="submit" class="w-full bg-primary text-on-primary py-5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:bg-primary-container transition" id="resSubmit">Submit Inquiry for Review</button>
      </form>`;
    document.getElementById('rDate').addEventListener('change', (e) => {
      const dw = document.getElementById('dateWarning');
      if (bookedDates.includes(e.target.value)) {
        dw.innerHTML = `<div class="bg-error-container border border-error/30 rounded-lg p-3 text-sm text-on-error-container">⚠ This date is already booked. Please choose another.</div>`;
        e.target.value = '';
      } else dw.innerHTML = '';
    });
    document.getElementById('resForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('rName').value.trim();
      const date = document.getElementById('rDate').value;
      const email = document.getElementById('rEmail').value.trim();
      if (!name || !date || !email) { toast('Please fill all required fields'); return; }
      const btn = document.getElementById('resSubmit');
      btn.disabled = true; btn.textContent = 'Submitting...';
      try {
        await Api.submitReservation({
          name, email,
          phone: document.getElementById('rPhone').value.trim() || null,
          service: document.getElementById('rService').value,
          date,
          guests: document.getElementById('rGuests').value || null,
          notes: document.getElementById('rNotes').value.trim() || null,
        });
        eventsSuccess = true;
        bookedDates = await Api.bookedDates();
        renderEventForm();
        const inquiry = document.getElementById('inquiry');
        if (inquiry) window.scrollTo({ top: inquiry.offsetTop - 80, behavior: 'smooth' });
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Submit Inquiry for Review';
        toast(err.message || 'Could not submit inquiry');
      }
    });
  }

  async function initEvents() {
    try { bookedDates = await Api.bookedDates(); } catch { bookedDates = []; }
    renderEventForm();
  }

  // ─── PAGE: AUTH ───────────────────────────────────────────────
  let authMode = 'login'; // 'login' | 'register' | 'verify'
  let pendingRegistration = null; // { name, email, password, sentAt }
  let resendTimer = null;

  function startResendCountdown(sec) {
    clearInterval(resendTimer);
    const btn = document.getElementById('resendBtn');
    if (!btn) return;
    let remaining = sec;
    const tick = () => {
      if (remaining <= 0) {
        btn.disabled = false;
        btn.textContent = 'Resend code';
        clearInterval(resendTimer);
        return;
      }
      btn.disabled = true;
      btn.textContent = `Resend in ${remaining}s`;
      remaining -= 1;
    };
    tick();
    resendTimer = setInterval(tick, 1000);
  }

  function renderAuth() {
    const el = document.getElementById('authContent');
    if (!el) return;
    clearInterval(resendTimer);
    if (currentUser) {
      el.innerHTML = `
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <span class="material-symbols-outlined text-5xl text-primary mb-4 block text-center">spa</span>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Welcome, ${currentUser.name}</h2>
          <p class="text-center text-on-surface-variant mb-8">Logged in as ${currentUser.email}</p>
          <a class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition mb-3 block text-center" href="orders.html">My Orders</a>
          ${currentUser.role === 'admin' ? `<a class="w-full bg-secondary text-on-secondary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition mb-3 block text-center" href="admin.html">Admin Dashboard</a>` : ''}
          <button class="w-full border border-outline-variant/40 text-on-surface-variant py-3 rounded-lg font-label text-label-sm hover:border-primary hover:text-primary transition" id="logoutBtn">Logout</button>
        </div>`;
      bindLogoutButtons();
      applyReveal();
      return;
    }

    // PIN verification step (after register details submitted)
    if (authMode === 'verify' && pendingRegistration) {
      const masked = pendingRegistration.email;
      el.innerHTML = `
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <button class="font-label text-label-sm text-on-surface-variant hover:text-primary transition mb-6 inline-flex items-center gap-2" id="backToRegBtn">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span> Back
          </button>
          <span class="material-symbols-outlined text-5xl text-primary mb-4 block text-center">mark_email_read</span>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Check your email</h2>
          <p class="text-center text-on-surface-variant mb-6">We sent a 6-digit verification code to<br/><strong class="text-on-surface">${masked}</strong></p>
          <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2 text-center">Verification Code</label>
          <input class="w-full bg-surface-container-low border border-outline-variant/40 p-4 rounded-lg focus:outline-none focus:border-primary text-center font-display text-2xl tracking-[0.4em]" id="aPin" placeholder="000000" inputmode="numeric" maxlength="6" autocomplete="one-time-code"/>
          <button class="w-full bg-primary text-on-primary py-4 mt-6 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="verifyBtn">Verify &amp; Create Account</button>
          <div class="flex items-center justify-between mt-5 text-sm">
            <span class="text-on-surface-variant">Didn't receive it?</span>
            <button class="text-primary hover:underline disabled:opacity-50 disabled:no-underline font-label text-label-sm" id="resendBtn" disabled>Resend in 30s</button>
          </div>
          <p class="text-center text-xs text-on-surface-variant mt-5">Code expires in 10 minutes</p>
        </div>`;
      startResendCountdown(30);

      document.getElementById('backToRegBtn').addEventListener('click', () => { authMode = 'register'; renderAuth(); });
      document.getElementById('resendBtn').addEventListener('click', async () => {
        const btn = document.getElementById('resendBtn');
        btn.disabled = true; btn.textContent = 'Sending...';
        try {
          await Api.sendPin({ email: pendingRegistration.email });
          toast('A new code was sent');
          startResendCountdown(30);
        } catch (e) {
          toast(e.message || 'Could not resend code');
          btn.disabled = false; btn.textContent = 'Resend code';
        }
      });
      const verifyBtn = document.getElementById('verifyBtn');
      const pinInput = document.getElementById('aPin');
      pinInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
      const handleVerify = async () => {
        const pin = pinInput.value;
        if (!/^\d{6}$/.test(pin)) { toast('Enter the 6-digit code'); return; }
        verifyBtn.disabled = true;
        const orig = verifyBtn.textContent;
        verifyBtn.textContent = 'Verifying...';
        try {
          const result = await Api.register({ ...pendingRegistration, pin });
          token = result.token; currentUser = result.user;
          Store.set('token', token); Store.set('user', currentUser);
          pendingRegistration = null;
          clearInterval(resendTimer);
          toast('Welcome to Flora, ' + currentUser.name);
          setTimeout(() => location.href = 'index.html', 600);
        } catch (e) {
          verifyBtn.disabled = false; verifyBtn.textContent = orig;
          toast(e.message || 'Verification failed');
          pinInput.focus(); pinInput.select();
        }
      };
      verifyBtn.addEventListener('click', handleVerify);
      pinInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') handleVerify(); });
      setTimeout(() => pinInput.focus(), 100);
      applyReveal();
      return;
    }

    el.innerHTML = `
      <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
        <h2 class="font-display text-headline-md text-primary text-center mb-2">${authMode === 'login' ? 'Welcome Back' : 'Join Flora'}</h2>
        <p class="text-center text-on-surface-variant mb-8">${authMode === 'login' ? 'Sign in to your account' : 'Create your botanical journey'}</p>
        <div class="flex bg-surface-container-low rounded-lg p-1 mb-6">
          <button class="flex-1 py-2 rounded-md font-label text-label-sm transition ${authMode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}" data-mode="login">Login</button>
          <button class="flex-1 py-2 rounded-md font-label text-label-sm transition ${authMode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}" data-mode="register">Register</button>
        </div>
        ${authMode === 'register' ? `<div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Full Name</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aName" placeholder="Your name" autocomplete="name"/></div>` : ''}
        <div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Email</label><input type="email" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aEmail" placeholder="email@example.com" autocomplete="email"/></div>
        <div class="mb-6"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Password</label><input type="password" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aPass" placeholder="${authMode === 'register' ? 'Min. 6 characters' : 'Enter password'}" autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}"/></div>
        <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="authSubmit">${authMode === 'login' ? 'Sign In' : 'Send Verification Code'}</button>
        ${authMode === 'register' ? `<p class="text-center text-xs text-on-surface-variant mt-4">We'll email you a 6-digit code to verify your address.</p>` : ''}
        <p class="text-center text-xs text-on-surface-variant mt-5">Demo admin: admin@flora.com / admin123</p>
      </div>`;
    el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { authMode = b.dataset.mode; renderAuth(); }));
    const submit = document.getElementById('authSubmit');
    const handle = async () => {
      const email = document.getElementById('aEmail').value.trim();
      const pass  = document.getElementById('aPass').value;
      if (!email || !pass) { toast('Please fill all fields'); return; }
      submit.disabled = true; const orig = submit.textContent;
      submit.textContent = authMode === 'login' ? 'Signing in...' : 'Sending code...';
      try {
        if (authMode === 'login') {
          const result = await Api.login({ email, password: pass });
          token = result.token; currentUser = result.user;
          Store.set('token', token); Store.set('user', currentUser);
          toast('Welcome back, ' + currentUser.name);
          setTimeout(() => location.href = currentUser.role === 'admin' ? 'admin.html' : 'index.html', 600);
        } else {
          const name = document.getElementById('aName').value.trim();
          if (!name) { submit.disabled = false; submit.textContent = orig; toast('Please enter your name'); return; }
          if (pass.length < 6) { submit.disabled = false; submit.textContent = orig; toast('Password must be at least 6 characters'); return; }
          await Api.sendPin({ email });
          pendingRegistration = { name, email, password: pass };
          authMode = 'verify';
          renderAuth();
          toast('Verification code sent — check your inbox');
        }
      } catch (e) {
        submit.disabled = false; submit.textContent = orig;
        toast(e.message || 'Authentication failed');
      }
    };
    submit.addEventListener('click', handle);
    ['aEmail', 'aPass', 'aName'].forEach(id => {
      const i = document.getElementById(id);
      if (i) i.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') handle(); });
    });
    applyReveal();
  }

  function initAuth() { renderAuth(); }

  // ─── PAGE: ORDERS ─────────────────────────────────────────────
  async function initOrders() {
    const el = document.getElementById('ordersContent');
    if (!el) return;
    if (!currentUser) {
      el.innerHTML = `
        <div class="text-center py-16 reveal">
          <span class="material-symbols-outlined text-5xl text-primary/40 mb-4">lock</span>
          <h2 class="font-display text-headline-md text-on-surface mb-3">Login Required</h2>
          <a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block" href="auth.html">Login</a>
        </div>`;
      applyReveal();
      return;
    }
    el.innerHTML = loadingHTML('Loading your orders...');
    let my;
    try { my = await Api.myOrders(); }
    catch (e) { el.innerHTML = errorHTML(e.message); return; }
    if (!my.length) {
      el.innerHTML = `
        <div class="text-center py-16 reveal">
          <span class="material-symbols-outlined text-5xl text-primary/30 mb-4">inventory_2</span>
          <h2 class="font-display text-headline-md text-on-surface mb-3">No orders yet</h2>
          <p class="text-on-surface-variant mb-6">Start your botanical journey today.</p>
          <a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block" href="shop.html">Shop Now</a>
        </div>`;
      applyReveal();
      return;
    }
    el.innerHTML = `<div class="space-y-4">${my.map(o => `
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 md:p-6 reveal">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <p class="font-label text-label-sm text-on-surface-variant uppercase tracking-widest">Order ${o.id} · ${o.date} · ${o.payment || 'cash'}</p>
            <h3 class="font-display text-lg md:text-xl text-on-surface mt-1">${o.items.map(i => i.name).join(', ')}</h3>
          </div>
          <span class="bg-success-container text-success font-label text-label-sm px-3 py-1 rounded-full uppercase tracking-widest self-start">${o.status}</span>
        </div>
        <div class="flex items-center gap-2 mb-4 flex-wrap">${o.items.map(i => `<img src="${i.image}" class="w-10 h-10 rounded-lg object-cover"/>`).join('')}</div>
        <p class="font-display text-xl text-secondary">${fmt(o.total)} ${CURRENCY.code}</p>
      </div>`).join('')}</div>`;
    applyReveal();
  }

  // ─── PAGE: ADMIN ──────────────────────────────────────────────
  let adminSection = 'dashboard';
  let adminCache = { stats: null, users: null, orders: null, reservations: null };

  function setAdminTabActive() {
    document.querySelectorAll('.admin-tab').forEach(b => {
      const a = b.dataset.section === adminSection;
      b.classList.toggle('text-white', a); b.classList.toggle('bg-white/10', a);
      b.classList.toggle('border-l-4', a); b.classList.toggle('border-secondary-fixed', a);
    });
  }

  async function renderAdmin() {
    const el = document.getElementById('adminContent');
    if (!el) return;
    if (!currentUser || currentUser.role !== 'admin') {
      el.innerHTML = `
        <div class="text-center py-16 text-on-surface-variant">
          <span class="material-symbols-outlined text-5xl text-primary/40 mb-3 block">lock</span>
          Access denied. Admin privileges required.
          <div class="mt-6"><a class="bg-primary text-on-primary px-6 py-3 rounded-full text-sm uppercase tracking-widest" href="auth.html">Login as admin</a></div>
        </div>`;
      return;
    }
    setAdminTabActive();
    el.innerHTML = loadingHTML('Loading...');

    try {
      if (adminSection === 'dashboard') {
        const [stats, orders] = await Promise.all([Api.adminStats(), Api.adminOrders()]);
        adminCache.stats = stats; adminCache.orders = orders;
        el.innerHTML = `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            ${[['shopping_cart', stats.orders, 'Orders'], ['payments', fmt(stats.revenue), 'Revenue'], ['event', stats.reservations, 'Reservations'], ['group', stats.users, 'Users']].map(([ic,v,l]) => `
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5">
                <span class="material-symbols-outlined text-secondary text-2xl mb-3 block">${ic}</span>
                <p class="font-display text-2xl text-primary">${v}</p>
                <p class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">${l}</p>
              </div>`).join('')}
          </div>
          <h3 class="font-display text-headline-md text-primary mb-4">Recent Orders</h3>
          ${orders.length
            ? `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','User','Total','Date','Status'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${orders.slice(0,5).map(o => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${o.id}</td><td class="px-4 py-3">${o.user || '—'}</td><td class="px-4 py-3 text-secondary font-semibold">${fmt(o.total)}</td><td class="px-4 py-3">${o.date}</td><td class="px-4 py-3"><span class="bg-success-container text-success px-2 py-1 rounded-full text-[10px] uppercase tracking-widest">${o.status}</span></td></tr>`).join('')}</tbody></table></div>`
            : '<p class="text-on-surface-variant">No orders yet.</p>'}`;
      } else if (adminSection === 'aproducts') {
        await ensureProducts();
        el.innerHTML = `
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 mb-6">
            <h3 class="font-display text-xl text-primary mb-4">Add New Product</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" id="apName" placeholder="Name"/>
              <select class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" id="apCat">${categories.slice(1).map(c => `<option>${c}</option>`).join('')}</select>
              <input class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" type="number" id="apPrice" placeholder="Price (TRY)"/>
              <input class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" type="number" id="apStock" placeholder="Stock"/>
              <input class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg md:col-span-2" id="apImage" placeholder="Image URL (optional)"/>
              <textarea class="bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg md:col-span-2" id="apDesc" placeholder="Description" rows="2"></textarea>
            </div>
            <button class="mt-4 bg-primary text-on-primary px-6 py-3 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="addProductBtn">Add Product</button>
          </div>
          <div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['','Name','Category','Price','Stock','Action'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${products.map(p => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3"><img src="${p.image}" class="w-10 h-10 rounded-lg object-cover"/></td><td class="px-4 py-3">${p.name}</td><td class="px-4 py-3 capitalize">${p.category}</td><td class="px-4 py-3 text-secondary">${fmt(p.price)}</td><td class="px-4 py-3">${p.stock}</td><td class="px-4 py-3"><button class="text-error text-xs hover:underline" data-del="${p.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>`;
        document.getElementById('addProductBtn').addEventListener('click', async () => {
          const name = document.getElementById('apName').value.trim();
          const price = parseInt(document.getElementById('apPrice').value, 10);
          if (!name || !price) { toast('Fill name and price'); return; }
          try {
            await Api.addProduct({
              name,
              category: document.getElementById('apCat').value,
              price,
              image: document.getElementById('apImage').value.trim() || null,
              description: document.getElementById('apDesc').value.trim() || null,
              stock: parseInt(document.getElementById('apStock').value, 10) || 10,
            });
            productsLoaded = false;
            toast('Product added');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not add product'); }
        });
        el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('Remove this product?')) return;
          try {
            await Api.deleteProduct(b.dataset.del);
            productsLoaded = false;
            toast('Product removed');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not remove'); }
        }));
      } else if (adminSection === 'aorders') {
        const orders = await Api.adminOrders();
        adminCache.orders = orders;
        el.innerHTML = `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','User','Total','Date','Address','Payment','Status'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${orders.length ? orders.map(o => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${o.id}</td><td class="px-4 py-3">${o.user || '—'}</td><td class="px-4 py-3 text-secondary">${fmt(o.total)}</td><td class="px-4 py-3">${o.date}</td><td class="px-4 py-3 max-w-[160px] truncate">${o.address || ''}</td><td class="px-4 py-3">${o.payment || 'cash'}</td><td class="px-4 py-3"><select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-status="${o.rawId}">${['Processing','Shipped','Delivered','Cancelled'].map(s => `<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('') : '<tr><td colspan="7" class="text-center px-4 py-12 text-on-surface-variant">No orders yet.</td></tr>'}</tbody></table></div>`;
        el.querySelectorAll('[data-status]').forEach(s => s.addEventListener('change', async () => {
          try { await Api.adminUpdateOrder(s.dataset.status, s.value); toast('Order updated'); }
          catch (e) { toast(e.message || 'Update failed'); }
        }));
      } else if (adminSection === 'aresv') {
        const resv = await Api.adminReservations();
        adminCache.reservations = resv;
        el.innerHTML = `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','Client','Service','Date','Guests','Notes','Status'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${resv.length ? resv.map(r => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${r.id}</td><td class="px-4 py-3">${r.name}<br/><span class="text-[10px] text-on-surface-variant">${r.email || ''}</span></td><td class="px-4 py-3">${r.service}</td><td class="px-4 py-3">${r.date}</td><td class="px-4 py-3">${r.guests || '—'}</td><td class="px-4 py-3 text-xs text-on-surface-variant max-w-[160px]">${r.notes || ''}</td><td class="px-4 py-3"><select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-resv="${r.rawId}">${['pending','confirmed','cancelled'].map(s => `<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('') : '<tr><td colspan="7" class="text-center px-4 py-12 text-on-surface-variant">No reservations yet.</td></tr>'}</tbody></table></div>`;
        el.querySelectorAll('[data-resv]').forEach(s => s.addEventListener('change', async () => {
          try { await Api.adminUpdateReservation(s.dataset.resv, s.value); toast('Reservation updated'); }
          catch (e) { toast(e.message || 'Update failed'); }
        }));
      } else if (adminSection === 'ausers') {
        const users = await Api.adminUsers();
        adminCache.users = users;
        el.innerHTML = `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','Name','Email','Role','Orders','Joined'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${users.map(u => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${u.id}</td><td class="px-4 py-3">${u.name}</td><td class="px-4 py-3">${u.email}</td><td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest ${u.role==='admin'?'bg-secondary-fixed text-on-secondary-container':'bg-primary-fixed text-primary'}">${u.role}</span></td><td class="px-4 py-3">${u.order_count}</td><td class="px-4 py-3 text-xs text-on-surface-variant">${u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''}</td></tr>`).join('')}</tbody></table></div>`;
      }
    } catch (e) {
      // If session was invalidated mid-render, send them to login.
      if (e.status === 401 || e.status === 403) {
        el.innerHTML = `
          <div class="text-center py-16 text-on-surface-variant">
            <span class="material-symbols-outlined text-5xl text-primary/40 mb-3 block">lock</span>
            <p class="mb-2">${e.status === 401 ? 'Your session has expired.' : 'Admin access required.'}</p>
            <p class="text-sm mb-6">Please log in again to continue.</p>
            <a class="bg-primary text-on-primary px-6 py-3 rounded-full text-sm uppercase tracking-widest" href="auth.html">Sign in</a>
          </div>`;
        // Re-render nav so it shows logged-out state
        injectLayout();
        bindLogoutButtons();
        return;
      }
      el.innerHTML = errorHTML(e.message || 'Could not load admin data.');
    }
  }

  function initAdmin() {
    document.querySelectorAll('.admin-tab').forEach(b => b.addEventListener('click', () => {
      adminSection = b.dataset.section; renderAdmin();
    }));
    renderAdmin();
  }

  // ─── BOOT ─────────────────────────────────────────────────────
  function injectLayout() {
    const page = document.body.dataset.page || 'home';
    const headEl = document.getElementById('site-nav');
    const footEl = document.getElementById('site-footer');
    const ambEl  = document.getElementById('site-ambient');
    if (headEl) headEl.outerHTML = navHTML(page);
    if (footEl) footEl.outerHTML = footerHTML();
    if (ambEl)  ambEl.outerHTML  = ambientHTML();
  }

  async function refreshSession() {
    if (!token) {
      // No token means logged out, regardless of cached user.
      if (currentUser) { currentUser = null; Store.clear('user'); }
      return;
    }
    try {
      const { user } = await Api.me();
      currentUser = user;
      Store.set('user', currentUser);
    } catch (e) {
      // api() helper already cleared token + user on 401; continue as guest.
    }
  }

  async function boot() {
    // 1. Render layout immediately with whatever cached state we have. This
    //    guarantees the nav + footer appear instantly, even if the API is
    //    slow or unreachable.
    injectLayout();
    setupDrawer();
    bindLogoutButtons();
    updateCartBadge();
    applyReveal();

    // 2. Refresh session in the background. If the cached user turns out to
    //    be stale (token expired, etc.), re-inject the layout so the nav
    //    reflects the corrected state.
    const userBefore = currentUser ? currentUser.email : null;
    refreshSession().then(() => {
      const userAfter = currentUser ? currentUser.email : null;
      if (userBefore !== userAfter) {
        injectLayout();
        setupDrawer();
        bindLogoutButtons();
        updateCartBadge();
      }
    }).catch(() => {});

    // 3. Initialize the current page in parallel with the session refresh.
    const page = document.body.dataset.page;
    const init = { home:initHome, shop:initShop, product:initProduct, cart:initCart, checkout:initCheckout, events:initEvents, auth:initAuth, orders:initOrders, admin:initAdmin }[page];
    if (init) {
      try { await init(); }
      catch (e) { console.error(e); toast(e.message || 'Page error'); }
    }
    bindLogoutButtons();
    applyReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.Flora = { addToCart, fmt, toast, api };
})();
