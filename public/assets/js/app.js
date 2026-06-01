(function () {
  'use strict';

  document.documentElement.classList.add('flora-booting');

  const CURRENCY = { symbol: '₺', code: 'TRY' };
  const fmt = (n) => CURRENCY.symbol + Number(n || 0).toLocaleString('tr-TR');
  const WRAP_BASIC = 75, WRAP_LUX = 150, CARD_COST = 100, DELIVERY = 300;
  const eventServices = ['Wedding Full Package','Engagement Party','Birthday Celebration','Corporate Event','Baptism / Baby Shower','Anniversary Dinner'];
  const categories = ['all','flowers','gifts','wedding'];
  const COVER_COLORS = ['Burgundy', 'Blush Pink', 'Ivory Cream', 'Sage Green', 'Midnight Navy'];
  const FLOWER_COLORS = ['Classic Red', 'Soft Pink', 'Pure White', 'Lavender', 'Sunshine Yellow', 'Seasonal Mix'];
  const PRODUCT_DEFAULT_FLOWER_COLOR = {
    'Romantic Rose Bouquet': 'Classic Red',
    'Spring Wildflowers': 'Lavender',
    'Orchid Elegance': 'Pure White',
    'Sunflower Sunshine': 'Sunshine Yellow',
  };

  function productThumbUrl(url) {
    if (!url || url.includes('/thumbs/')) return url || '';
    const prefix = '/assets/products/';
    if (!url.includes(prefix)) return url;
    const rest = url.slice(prefix.length);
    if (rest.includes('/')) {
      const slash = rest.lastIndexOf('/');
      const dir = rest.slice(0, slash);
      const file = rest.slice(slash + 1);
      return `${prefix}${dir}/thumbs/${file}`;
    }
    return url.replace(prefix, `${prefix}thumbs/`);
  }

  function productGallery(p) {
    if (p.gallery && p.gallery.length) return p.gallery;
    return p.image ? [p.image] : [];
  }
  const FLOWER_COLOR_FILE = {
    'Classic Red': 'classic-red',
    'Soft Pink': 'soft-pink',
    'Pure White': 'pure-white',
    'Lavender': 'lavender',
    'Sunshine Yellow': 'sunshine-yellow',
    'Seasonal Mix': 'seasonal-mix',
  };

  const COVER_TO_FLOWER_FILE = {
    'Burgundy': 'classic-red',
    'Blush Pink': 'soft-pink',
    'Ivory Cream': 'pure-white',
    'Sage Green': 'seasonal-mix',
    'Midnight Navy': 'lavender',
  };

  function galleryIndexForColorFile(gallery, fileKey) {
    if (!fileKey || !gallery.length) return -1;
    const needle = `/${fileKey}.`;
    return gallery.findIndex((url) => url.toLowerCase().includes(needle));
  }

  function flowerColorForImage(src) {
    if (!src) return null;
    for (const [name, key] of Object.entries(FLOWER_COLOR_FILE)) {
      if (src.includes(`/${key}.`)) return name;
    }
    return null;
  }
  const FLOWER_COLOR_SLUGS = {
    'Classic Red': ['romantic-rose-bouquet', 'velvet-jewelry-box-rose', 'chocolate-and-roses'],
    'Soft Pink': ['peony-blush-garden', 'rose-gold-anniversary', 'birthday-bloom-box', 'bridal-bouquet'],
    'Pure White': ['sympathy-white-lilies', 'wedding-centerpiece', 'bridal-bouquet', 'ceremony-aisle-petals'],
    'Lavender': ['lavender-dreams', 'orchid-elegance', 'midnight-tulip-trio'],
    'Sunshine Yellow': ['sunflower-sunshine', 'citrus-and-bloom'],
    'Seasonal Mix': ['spring-wildflowers', 'hydrangea-cloud', 'garden-party-centerpiece', 'artisan-tea-and-bloom'],
  };

  const COVER_COLOR_SLUGS = {
    'Burgundy': ['romantic-rose-bouquet', 'orchid-elegance', 'velvet-jewelry-box-rose', 'chocolate-and-roses'],
    'Blush Pink': ['peony-blush-garden', 'rose-gold-anniversary', 'birthday-bloom-box'],
    'Ivory Cream': ['wedding-centerpiece', 'sympathy-white-lilies', 'ceremony-aisle-petals', 'bridal-bouquet'],
    'Sage Green': ['spring-wildflowers', 'mini-succulent-grove', 'terra-ceramic-vase', 'hydrangea-cloud'],
    'Midnight Navy': ['orchid-elegance-2', 'midnight-tulip-trio', 'lavender-dreams', 'orchid-elegance'],
  };

  const FLOWER_COLOR_FALLBACK = {
    'Classic Red': '/assets/products/romantic-rose-bouquet/classic-red.jpg',
    'Soft Pink': '/assets/products/romantic-rose-bouquet/soft-pink.jpg',
    'Pure White': '/assets/products/romantic-rose-bouquet/pure-white.jpg',
    'Lavender': '/assets/products/romantic-rose-bouquet/lavender.jpg',
    'Sunshine Yellow': '/assets/products/romantic-rose-bouquet/sunshine-yellow.jpg',
    'Seasonal Mix': '/assets/products/romantic-rose-bouquet/seasonal-mix.jpg',
  };

  const COVER_COLOR_FALLBACK = {
    'Burgundy': '/assets/products/romantic-rose-bouquet/classic-red.jpg',
    'Blush Pink': '/assets/products/romantic-rose-bouquet/soft-pink.jpg',
    'Ivory Cream': '/assets/products/romantic-rose-bouquet/pure-white.jpg',
    'Sage Green': '/assets/products/romantic-rose-bouquet/seasonal-mix.jpg',
    'Midnight Navy': '/assets/products/romantic-rose-bouquet/lavender.jpg',
  };

  function galleryIndexForSlugs(gallery, slugs) {
    if (!gallery.length || !slugs?.length) return -1;
    for (let i = 0; i < gallery.length; i++) {
      const path = gallery[i].toLowerCase();
      if (slugs.some((s) => path.includes(s))) return i;
    }
    return -1;
  }

  function galleryIndexForFlowerColor(gallery, flowerColor) {
    const fileIdx = galleryIndexForColorFile(gallery, FLOWER_COLOR_FILE[flowerColor]);
    if (fileIdx >= 0) return fileIdx;
    const idx = galleryIndexForSlugs(gallery, FLOWER_COLOR_SLUGS[flowerColor]);
    if (idx >= 0) return idx;
    const fi = FLOWER_COLORS.indexOf(flowerColor);
    return fi >= 0 ? fi % gallery.length : 0;
  }

  function galleryIndexForCoverColor(gallery, coverColor) {
    const fileIdx = galleryIndexForColorFile(gallery, COVER_TO_FLOWER_FILE[coverColor]);
    if (fileIdx >= 0) return fileIdx;
    const idx = galleryIndexForSlugs(gallery, COVER_COLOR_SLUGS[coverColor]);
    if (idx >= 0) return idx;
    const ci = COVER_COLORS.indexOf(coverColor);
    return ci >= 0 ? ci % gallery.length : 0;
  }

  function resolveDetailImage(gallery, productImage) {
    const flower = detailState.opts.flowerColor;
    const cover = detailState.opts.coverColor;
    if (flower) {
      const matched = galleryIndexForFlowerColor(gallery, flower);
      if (gallery[matched]) return { src: gallery[matched], index: matched };
      if (FLOWER_COLOR_FALLBACK[flower]) return { src: FLOWER_COLOR_FALLBACK[flower], index: -1 };
    }
    if (cover) {
      const matched = galleryIndexForCoverColor(gallery, cover);
      if (gallery[matched]) return { src: gallery[matched], index: matched };
      if (COVER_COLOR_FALLBACK[cover]) return { src: COVER_COLOR_FALLBACK[cover], index: -1 };
    }
    const idx = Math.min(Math.max(0, detailState.gallery), gallery.length - 1);
    return { src: gallery[idx] || productImage, index: idx };
  }

  function syncDetailGalleryToOptions(gallery, productImage) {
    const { src, index } = resolveDetailImage(gallery, productImage);
    detailState._heroSrc = src;
    if (index >= 0) detailState.gallery = index;
    else detailState.gallery = -1;
  }

  function setDetailHeroImage(src, root) {
    const hero = document.getElementById('detailHeroImg');
    if (!hero || !src) return;
    hero.style.opacity = '0.5';
    const preload = new Image();
    preload.onload = () => { hero.src = src; hero.style.opacity = '1'; };
    preload.src = src;
    const link = document.getElementById('detailImgPreload');
    if (link) link.href = src;
    (root || document).querySelectorAll('[data-gallery]').forEach((btn) => {
      const i = parseInt(btn.dataset.gallery, 10);
      const on = detailState.gallery >= 0 && i === detailState.gallery;
      const frame = btn.querySelector('span.aspect-square') || btn;
      frame.className = `aspect-square bg-surface-container rounded-md overflow-hidden transition-all ${on ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40'}`;
    });
  }

  function updateDetailColorButtons(root) {
    root.querySelectorAll('[data-flower-color]').forEach((btn) => {
      const on = btn.dataset.flowerColor === detailState.opts.flowerColor;
      btn.className = `px-3 py-2 rounded-lg text-sm border transition ${on ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}`;
    });
    root.querySelectorAll('[data-cover-color]').forEach((btn) => {
      const on = btn.dataset.coverColor === detailState.opts.coverColor;
      btn.className = `px-3 py-2 rounded-lg text-sm border transition ${on ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}`;
    });
  }

  function applyDetailColorPhoto(gallery, productImage, root) {
    syncDetailGalleryToOptions(gallery, productImage);
    setDetailHeroImage(detailState._heroSrc || gallery[0] || productImage, root);
    updateDetailColorButtons(root);
  }

  const STORE_INFO = {
    name: 'Flora & Gifts Atelier',
    address: 'Teşvikiye Cad. No: 42, Nişantaşı',
    city: 'Şişli, Istanbul 34365',
    country: 'Türkiye',
    phone: '+90 (212) 555 0142',
    phoneHref: 'tel:+902125550142',
    email: 'hello@floragifts.com',
    emailHref: 'mailto:hello@floragifts.com',
    whatsapp: '+90 532 555 0142',
    whatsappHref: 'https://wa.me/905325550142',
    hours: [
      { days: 'Monday – Friday', time: '9:00 – 19:00' },
      { days: 'Saturday', time: '10:00 – 18:00' },
      { days: 'Sunday', time: '11:00 – 16:00' },
    ],
    mapQuery: 'Nişantaşı, Istanbul, Turkey',
    mapEmbed: 'https://www.google.com/maps?q=Ni%C5%9Fanta%C5%9F%C4%B1%2C+Istanbul&output=embed',
  };

  const KEY = 'flora.';
  const CART_GUEST = 'cartGuest';
  const FAV_GUEST = 'favoritesGuest';
  /** @type {{ GUEST: 'guest', USER: 'user' }} */
  const SessionType = Object.freeze({ GUEST: 'guest', USER: 'user' });

  function getSessionType() {
    return currentUser && currentUser.id && token ? SessionType.USER : SessionType.GUEST;
  }

  function getSessionUserId() {
    return getSessionType() === SessionType.USER ? currentUser.id : null;
  }

  function isLoggedIn() {
    return getSessionType() === SessionType.USER;
  }

  function authReturnPath() {
    const path = location.pathname.split('/').pop() || 'index.html';
    const qs = location.search || '';
    const dest = path + qs;
    if (dest.endsWith('.html') && !dest.includes('..')) return dest;
    return 'index.html';
  }

  function authPageUrl(mode, intent) {
    const ret = intent === 'checkout' ? 'checkout.html' : authReturnPath();
    const m = mode === 'register' ? 'register' : 'login';
    return `auth.html?mode=${m}&return=${encodeURIComponent(ret)}&intent=${encodeURIComponent(intent || 'save')}`;
  }

  const AUTH_GATE_COPY = {
    cart: {
      title: 'Sign in to add to cart',
      pageTitle: 'Sign in to view your cart',
      body: 'Create a free account or sign in to save items to your cart and complete checkout securely.',
      icon: 'shopping_bag',
    },
    favorites: {
      title: 'Sign in to save favourites',
      pageTitle: 'Sign in to see your favourites',
      body: 'Create a free account or sign in to keep your favourite blooms synced across devices.',
      icon: 'favorite',
    },
    checkout: {
      title: 'Sign in to checkout',
      pageTitle: 'Sign in to complete checkout',
      body: 'Create a free account or sign in to review your cart and place your order securely.',
      icon: 'lock',
    },
  };

  function loginRequiredHTML(feature) {
    const copy = AUTH_GATE_COPY[feature] || AUTH_GATE_COPY.cart;
    const pageTitle = copy.pageTitle || copy.title;
    return `
      <div class="text-center py-16 md:py-20 reveal max-w-md mx-auto">
        <span class="material-symbols-outlined text-6xl text-primary/35 mb-5 block">${copy.icon}</span>
        <h2 class="font-display text-headline-md text-on-surface mb-3">${pageTitle}</h2>
        <p class="text-on-surface-variant mb-8 leading-relaxed">${copy.body}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a class="bg-primary text-on-primary px-8 py-3.5 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block text-center" href="${authPageUrl('login', feature)}">Log in</a>
          <a class="border-2 border-primary text-primary px-8 py-3.5 rounded-full font-label text-label-sm uppercase tracking-widest hover:bg-primary/5 transition inline-block text-center" href="${authPageUrl('register', feature)}">Create account</a>
        </div>
        <p class="text-sm text-on-surface-variant mt-6"><a href="shop.html" class="text-primary hover:underline font-label text-label-sm">Continue browsing</a></p>
      </div>`;
  }

  function closeAuthGate() {
    const gate = document.getElementById('authGate');
    if (gate) gate.hidden = true;
    document.body.style.overflow = '';
  }

  function bindAuthGateEvents() {
    const gate = document.getElementById('authGate');
    if (!gate) return;
    gate.querySelectorAll('[data-auth-gate-close]').forEach((btn) => {
      btn.addEventListener('click', closeAuthGate);
    });
    gate.querySelector('.auth-gate__backdrop')?.addEventListener('click', closeAuthGate);
    if (!window._authGateEscapeBound) {
      window._authGateEscapeBound = true;
      document.addEventListener('keydown', (e) => {
        const g = document.getElementById('authGate');
        if (e.key === 'Escape' && g && !g.hidden) closeAuthGate();
      });
    }
  }

  function openAuthGate(intent) {
    const copy = AUTH_GATE_COPY[intent] || AUTH_GATE_COPY.cart;
    let gate = document.getElementById('authGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'authGate';
      gate.className = 'auth-gate';
      gate.hidden = true;
      document.body.appendChild(gate);
    }
    gate.innerHTML = `
      <div class="auth-gate__backdrop" aria-hidden="true"></div>
      <div class="auth-gate__panel" role="dialog" aria-modal="true" aria-labelledby="authGateTitle">
        <button type="button" class="auth-gate__close" data-auth-gate-close aria-label="Close">
          <span class="material-symbols-outlined text-[22px]">close</span>
        </button>
        <div class="text-center">
          <span class="material-symbols-outlined text-5xl text-primary/40 mb-4 block">${copy.icon}</span>
          <h2 id="authGateTitle" class="font-display text-2xl text-primary mb-2">${copy.title}</h2>
          <p class="text-on-surface-variant text-sm leading-relaxed mb-6">${copy.body}</p>
          <p class="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-4">Account required</p>
          <div class="flex flex-col gap-3">
            <a href="${authPageUrl('login', intent)}" class="block w-full bg-primary text-on-primary py-3.5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition text-center">Log in</a>
            <a href="${authPageUrl('register', intent)}" class="block w-full border-2 border-primary text-primary py-3.5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:bg-primary/5 transition text-center">Create account</a>
          </div>
          <button type="button" class="w-full mt-5 text-on-surface-variant text-sm hover:text-primary transition font-label text-label-sm" data-auth-gate-close>Not now</button>
        </div>
      </div>`;
    bindAuthGateEvents();
    gate.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function requireLogin(intent) {
    if (isLoggedIn()) return true;
    openAuthGate(intent);
    return false;
  }

  function cartStorageKey() {
    return getSessionType() === SessionType.USER ? userCartKey(currentUser.id) : CART_GUEST;
  }

  function favoritesStorageKey() {
    return getSessionType() === SessionType.USER ? userFavoritesKey(currentUser.id) : FAV_GUEST;
  }

  const Store = {
    get(k, fb) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {} },
    clear(k) { try { localStorage.removeItem(KEY + k); } catch {} },
  };

  function userCartKey(userId) {
    return `cart.${userId}`;
  }

  function cartItemKey(item) {
    return `${item.id}|${JSON.stringify(item.opts || {})}`;
  }

  function clampQty(q) {
    const n = Math.floor(Number(q) || 0);
    return Math.max(1, Math.min(99, n));
  }

  /** Dedupe lines only — never drops items based on catalog (safe before products load). */
  function dedupeCartLines(items) {
    if (!Array.isArray(items)) return [];
    const map = new Map();
    for (const raw of items) {
      const id = Number(raw.id);
      if (!id || id < 1) continue;
      const opts = raw.opts && typeof raw.opts === 'object' ? raw.opts : {};
      const key = cartItemKey({ id, opts });
      const qty = clampQty(raw.qty);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id,
          qty,
          opts,
          price: Number(raw.price) || 0,
          name: String(raw.name || '').slice(0, 200),
          image: raw.image || null,
        });
      } else {
        existing.qty = Math.max(existing.qty, qty);
      }
    }
    return Array.from(map.values());
  }

  function enrichCartLines(items) {
    return dedupeCartLines(items).map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (p) {
        if (!item.name) item.name = p.name;
        if (!item.image) item.image = p.image;
        if (!item.price) item.price = p.price;
        const stock = Number(p.stock);
        if (stock > 0) item.qty = Math.min(item.qty, stock);
      }
      return item;
    }).filter((item) => item.qty > 0 && item.id);
  }

  function sanitizeCart(items) {
    return enrichCartLines(items);
  }

  /** Merge sources for sync — max qty per line, never sum duplicates across copies. */
  function reconcileCartSources(...lists) {
    const map = new Map();
    for (const list of lists) {
      for (const item of dedupeCartLines(list)) {
        const key = cartItemKey(item);
        const existing = map.get(key);
        if (!existing) map.set(key, { ...item });
        else existing.qty = Math.max(existing.qty, item.qty);
      }
    }
    return enrichCartLines(Array.from(map.values()));
  }

  function cartTotalQty(items) {
    return (items || []).reduce((s, i) => s + clampQty(i.qty), 0);
  }

  function repairCorruptedCartStorage() {
    const keys = getSessionType() === SessionType.USER && currentUser
      ? [userCartKey(currentUser.id), 'cart', CART_GUEST]
      : [CART_GUEST, 'cart'];
    for (const k of keys) {
      const raw = Store.get(k, []);
      if (!raw.length) continue;
      const deduped = dedupeCartLines(raw);
      if (cartTotalQty(deduped) > 25 || deduped.length > 12) {
        const repaired = deduped.slice(0, 10).map((i) => ({ ...i, qty: Math.min(3, i.qty) }));
        Store.set(k, repaired);
      }
    }
  }

  function migrateLegacyCartToSession() {
    const legacy = Store.get('cart', []);
    if (!legacy.length) return;
    const key = cartStorageKey();
    Store.set(key, reconcileCartSources(Store.get(key, []), legacy));
    Store.clear('cart');
  }

  function migrateLegacyFavoritesToSession() {
    const legacy = Store.get('favorites', []);
    if (!legacy.length) return;
    const key = favoritesStorageKey();
    const merged = mergeFavoriteIds(Store.get(key, []), legacy);
    Store.set(key, merged);
  }

  function readLocalCart() {
    migrateLegacyCartToSession();
    return Store.get(cartStorageKey(), []);
  }

  function loadGuestCart() {
    return readLocalCart();
  }

  function persistCart() {
    if (!isLoggedIn()) return;
    cart = dedupeCartLines(cart);
    if (productsLoaded) cart = enrichCartLines(cart);
    Store.set(cartStorageKey(), cart);
    if (getSessionType() === SessionType.USER) Store.clear('cart');
    else Store.set('cart', cart);
    if (getSessionType() === SessionType.USER && token) {
      Api.saveCart({ items: cart }).catch(() => {});
    }
  }

  async function loadCartForSession(user) {
    await ensureProducts().catch(() => {});
    const guest = dedupeCartLines(Store.get(CART_GUEST, []));
    const local = dedupeCartLines(Store.get(userCartKey(user.id), []));
    let serverItems = [];
    let serverOk = false;
    if (user && token) {
      try {
        const r = await Api.getCart();
        serverItems = dedupeCartLines(r.items || []);
        serverOk = true;
      } catch {}
    }
    if (serverOk) {
      cart = serverItems.length
        ? reconcileCartSources(serverItems)
        : reconcileCartSources(guest, local);
    } else {
      cart = reconcileCartSources(local, guest);
    }
    Store.clear(CART_GUEST);
    Store.clear('cart');
    cart = sanitizeCart(cart);
    persistCart();
    notifyCartChanged();
  }

  let cartReadyPromise = null;

  async function ensureCartReady() {
    if (cartReadyPromise) return cartReadyPromise;
    cartReadyPromise = (async () => {
      repairCorruptedCartStorage();
      migrateLegacyCartToSession();
      await ensureProducts().catch(() => {});
      if (getSessionType() === SessionType.USER && currentUser) {
        await loadCartForSession(currentUser);
      } else {
        cart = enrichCartLines(dedupeCartLines(Store.get(CART_GUEST, []) || Store.get('cart', [])));
        persistCart();
        updateCartBadge();
      }
    })();
    try {
      await cartReadyPromise;
    } finally {
      cartReadyPromise = null;
    }
  }

  function readLocalFavorites() {
    migrateLegacyFavoritesToSession();
    return Store.get(favoritesStorageKey(), []);
  }

  function hydrateFavoritesFromLocal() {
    favorites = mergeFavoriteIds(readLocalFavorites());
    Store.set(favoritesStorageKey(), favorites);
    Store.set('favorites', favorites);
  }

  function notifyCartChanged() {
    updateCartBadge();
    const page = document.body.dataset.page;
    if (page === 'cart') renderCart();
    if (page === 'checkout') initCheckout();
  }

  function notifyFavoritesChanged() {
    updateFavoritesBadge();
    syncFavoriteIcons();
    renderFavoritesIfOnPage();
  }

  function userFavoritesKey(userId) {
    return `favorites.${userId}`;
  }

  function mergeFavoriteIds(...lists) {
    const set = new Set();
    for (const list of lists) {
      for (const id of list || []) {
        const n = Number(id);
        if (!Number.isNaN(n) && n > 0) set.add(n);
      }
    }
    return Array.from(set);
  }

  function loadGuestFavorites() {
    return readLocalFavorites();
  }

  let favoritesSyncTimer = null;
  let favReadyPromise = null;
  let favoritesServerSynced = false;

  function saveFavoritesLocal() {
    if (!isLoggedIn()) return;
    favorites = mergeFavoriteIds(favorites);
    Store.set(favoritesStorageKey(), favorites);
    Store.set('favorites', favorites);
    if (getSessionType() === SessionType.USER) Store.clear(FAV_GUEST);
  }

  function scheduleFavoritesSync() {
    if (getSessionType() !== SessionType.USER || !token) return;
    clearTimeout(favoritesSyncTimer);
    favoritesSyncTimer = setTimeout(() => {
      Api.saveFavorites({ productIds: favorites }).catch(() => {});
    }, 350);
  }

  function persistFavorites() {
    saveFavoritesLocal();
    scheduleFavoritesSync();
  }

  function favoritesSignature(ids) {
    return mergeFavoriteIds(ids).slice().sort((a, b) => a - b).join(',');
  }

  async function syncFavoritesFromServer(user) {
    const guest = mergeFavoriteIds(Store.get(FAV_GUEST, []));
    const local = mergeFavoriteIds(Store.get(userFavoritesKey(user.id), []));
    let serverIds = [];
    let serverOk = false;
    if (user && token) {
      try {
        const r = await Api.getFavorites();
        serverIds = mergeFavoriteIds(r.productIds || []);
        serverOk = true;
      } catch {}
    }
    const merged = serverOk
      ? mergeFavoriteIds(serverIds, guest)
      : mergeFavoriteIds(local, guest);
    const changed = favoritesSignature(favorites) !== favoritesSignature(merged);
    favorites = merged;
    Store.set(FAV_GUEST, []);
    saveFavoritesLocal();
    if (serverOk ? changed : getSessionType() === SessionType.USER) scheduleFavoritesSync();
    favoritesServerSynced = true;
    updateFavoritesBadge();
    syncFavoriteIcons();
  }

  function resetFavoritesSession() {
    favoritesServerSynced = false;
    favReadyPromise = null;
  }

  async function loadFavoritesForSession(user) {
    resetFavoritesSession();
    await ensureFavoritesReady({ forceServer: true });
  }

  async function ensureFavoritesReady(opts = {}) {
    if (favReadyPromise && !opts.forceServer) return favReadyPromise;
    favReadyPromise = (async () => {
      hydrateFavoritesFromLocal();
      updateFavoritesBadge();
      syncFavoriteIcons();
      const needsServer = opts.forceServer || !favoritesServerSynced;
      if (needsServer && getSessionType() === SessionType.USER && currentUser) {
        await syncFavoritesFromServer(currentUser);
      }
    })();
    return favReadyPromise;
  }

  function renderFavoritesIfOnPage() {
    if (document.body.dataset.page !== 'favorites') return;
    const el = document.getElementById('favoritesContent');
    if (!el) return;
    renderFavoritesInto(el);
  }

  function renderFavoritesInto(el) {
    const list = products.filter((p) => isFavorite(p.id));
    if (!list.length) {
      el.innerHTML = `<div class="text-center py-16 reveal"><span class="material-symbols-outlined text-6xl text-primary/30 mb-4">favorite</span><p class="text-on-surface-variant mb-6">No favourites yet — tap the heart on any product.</p><a href="shop.html" class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest">Browse shop</a></div>`;
    } else {
      el.innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter">${list.map(productCardHTML).join('')}</div>`;
      bindCardAddButtons(el);
      bindFavoriteButtons(el);
    }
    applyReveal();
  }

  function authRedirectUrl(user) {
    if (user.role === 'admin') return 'admin.html';
    const params = new URLSearchParams(location.search);
    const dest = params.get('return');
    if (dest && dest.endsWith('.html') && !dest.includes('..')) return dest;
    return 'index.html';
  }

  let cart = [];
  let favorites = [];
  let token = Store.get('token', null);
  let currentUser = Store.get('user', null);
  let products = [];
  let productsLoaded = false;
  let productsInflight = null;
  const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;
  const PAGES_NEED_PRODUCTS = new Set(['home', 'shop', 'product', 'cart', 'favorites', 'checkout', 'admin']);

  if (!token && currentUser) {
    currentUser = null;
    Store.clear('user');
  }

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = 'Bearer ' + token;

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
    products: (full) => api('/api/products' + (full ? '?full=1' : '')),
    productById: (id) => api('/api/products/' + id),
    addProduct: (body) => api('/api/products', { method: 'POST', body }),
    deleteProduct: (id) => api('/api/products/' + id, { method: 'DELETE' }),
    myOrders: () => api('/api/orders'),
    placeOrder: (body) => api('/api/orders', { method: 'POST', body }),
    bookedDates: () => api('/api/reservations/dates'),
    submitReservation: (body) => api('/api/reservations', { method: 'POST', body }),
    adminStats: () => api('/api/admin/stats'),
    adminUsers: () => api('/api/admin/users'),
    adminUpdateUserRole: (id, role) => api('/api/admin/users/' + id, { method: 'PATCH', body: { role } }),
    adminDeleteUser: (id) => api('/api/admin/users/' + id, { method: 'DELETE' }),
    adminOrders: () => api('/api/admin/orders'),
    adminUpdateOrder: (id, status) => api('/api/admin/orders/' + id, { method: 'PATCH', body: { status } }),
    adminDeleteOrder: (id) => api('/api/admin/orders/' + id, { method: 'DELETE' }),
    adminReservations: () => api('/api/admin/reservations'),
    adminUpdateReservation: (id, status) => api('/api/admin/reservations/' + id, { method: 'PATCH', body: { status } }),
    adminDeleteReservation: (id) => api('/api/admin/reservations/' + id, { method: 'DELETE' }),
    forgotPassword: (body) => api('/api/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (body) => api('/api/auth/reset-password', { method: 'POST', body }),
    submitContact: (body) => api('/api/contact', { method: 'POST', body }),
    getCart: () => api('/api/cart'),
    saveCart: (body) => api('/api/cart', { method: 'PUT', body }),
    getFavorites: () => api('/api/favorites'),
    saveFavorites: (body) => api('/api/favorites', { method: 'PUT', body }),
  };

  function userInitials(name) {
    return String(name || 'U').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }

  function profileMenuLink(href, icon, label, opts = {}) {
    const cls = opts.danger
      ? 'flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition w-full text-left'
      : 'flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition';
  if (opts.button) {
      return `<button type="button" class="${cls}" ${opts.attrs || ''} role="menuitem">${icon}<span>${label}</span></button>`;
    }
    return `<a href="${href}" class="${cls}" role="menuitem">${icon}<span>${label}</span></a>`;
  }

  function profileNavDesktop(activePage) {
    if (!currentUser) return '';
    const isAdmin = currentUser.role === 'admin';
    const initials = userInitials(currentUser.name);
    const profileActive = isAdmin ? activePage === 'admin' : (activePage === 'profile' || activePage === 'orders');
    const icon = (name) => `<span class="material-symbols-outlined text-[20px] text-on-surface-variant">${name}</span>`;
    const menuItems = isAdmin
      ? `${profileMenuLink('admin.html', icon('dashboard'), 'Admin dashboard')}
              <div class="border-t border-outline-variant/20 mt-1 pt-1">
                ${profileMenuLink('#', icon('logout'), 'Logout', { button: true, danger: true, attrs: 'data-logout id="navLogoutBtn"' })}
              </div>`
      : `${profileMenuLink('profile.html', icon('person'), 'My profile')}
              ${profileMenuLink('orders.html', icon('inventory_2'), 'My orders')}
              ${profileMenuLink('profile.html#password', icon('lock_reset'), 'Change password')}
              <div class="border-t border-outline-variant/20 mt-1 pt-1">
                ${profileMenuLink('#', icon('logout'), 'Sign out', { button: true, danger: true, attrs: 'data-logout id="navLogoutBtn"' })}
              </div>`;
    return `
          <div class="relative profile-menu">
            <button type="button" id="profileMenuBtn" aria-expanded="false" aria-haspopup="menu"
              class="nav-link font-label text-label-sm flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${profileActive ? 'is-active text-primary' : 'text-on-surface-variant hover:text-primary'}">
              <span class="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center ring-1 ring-primary/20">${initials}</span>
              <span class="hidden lg:inline max-w-[120px] truncate">${currentUser.name.split(' ')[0]}</span>
              <span class="material-symbols-outlined text-[18px] profile-chevron transition-transform duration-200">expand_more</span>
            </button>
            <div id="profileDropdown" role="menu" class="hidden absolute right-0 top-[calc(100%+10px)] w-72 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xl py-2 z-[70]">
              <div class="px-4 py-3 border-b border-outline-variant/20 mb-1">
                <p class="font-display text-base text-primary truncate">${currentUser.name}</p>
                <p class="text-xs text-on-surface-variant truncate mt-0.5">${currentUser.email}</p>
              </div>
              ${menuItems}
            </div>
          </div>`;
  }

  function profileNavDrawer(activePage) {
    if (!currentUser) return '';
    const isAdmin = currentUser.role === 'admin';
    const initials = userInitials(currentUser.name);
    const icon = (name) => `<span class="material-symbols-outlined text-[22px]">${name}</span>`;
    const drawerLinks = isAdmin
      ? `<a class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-body text-base text-on-surface hover:bg-surface-container-low transition ${activePage==='admin'?'is-active':''}" href="admin.html">${icon('dashboard')} Admin dashboard</a>
          <button type="button" class="drawer-link flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg font-body text-base text-error hover:bg-error/5 transition mt-1" data-logout id="logoutDrawerBtn">${icon('logout')} Logout</button>`
      : `<a class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-body text-base text-on-surface hover:bg-surface-container-low transition ${activePage==='profile'?'is-active':''}" href="profile.html">${icon('person')} My profile</a>
          <a class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-body text-base text-on-surface hover:bg-surface-container-low transition ${activePage==='orders'?'is-active':''}" href="orders.html">${icon('inventory_2')} My orders</a>
          <a class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-body text-base text-on-surface hover:bg-surface-container-low transition" href="profile.html#password">${icon('lock_reset')} Change password</a>
          <button type="button" class="drawer-link flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg font-body text-base text-error hover:bg-error/5 transition mt-1" data-logout id="logoutDrawerBtn">${icon('logout')} Sign out</button>`;
    return `
        <div class="mt-4 pt-4 border-t border-outline-variant/30">
          <div class="flex items-center gap-3 px-4 py-3 mb-2">
            <span class="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center ring-1 ring-primary/20">${initials}</span>
            <div class="min-w-0">
              <p class="font-display text-lg text-primary truncate">${currentUser.name}</p>
              <p class="text-xs text-on-surface-variant truncate">${currentUser.email}</p>
            </div>
          </div>
          ${drawerLinks}
        </div>`;
  }

  function navHTML(activePage) {
    const adminItem = '';
    const adminDrawerItem = '';
    const authLabel = 'Login';
    const authHref  = 'auth.html';
    const authActive = !currentUser && activePage === 'auth';
    const profileNav = profileNavDesktop(activePage);
    const loginNav = currentUser ? '' : `<a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${authActive?'is-active':''}" href="${authHref}">${authLabel}</a>`;

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
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${activePage==='contact'?'is-active':''}" href="contact.html">Contact</a>
          ${loginNav}
          ${profileNav}
          <a class="relative" href="favorites.html" aria-label="Favourites">
            <span class="material-symbols-outlined text-primary text-[28px]">favorite</span>
            <span class="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full font-bold ${favorites.length ? '' : 'hidden'}" data-fav-badge>${favorites.length}</span>
          </a>
          <a class="relative" href="cart.html" aria-label="Cart">
            <span class="material-symbols-outlined text-primary text-[28px]">shopping_bag</span>
            <span class="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full font-bold hidden" data-cart-badge>0</span>
          </a>
        </div>
        <div class="md:hidden flex items-center gap-3">
          <a class="relative" href="favorites.html" aria-label="Favourites">
            <span class="material-symbols-outlined text-primary text-[26px]">favorite</span>
            <span class="absolute -top-1.5 -right-1.5 bg-secondary text-on-secondary text-[10px] min-w-[1rem] h-4 px-0.5 flex items-center justify-center rounded-full font-bold ${favorites.length ? '' : 'hidden'}" data-fav-badge>${favorites.length}</span>
          </a>
          <a class="relative" href="cart.html" aria-label="Cart">
            <span class="material-symbols-outlined text-primary text-[26px]">shopping_bag</span>
            <span class="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] min-w-[1rem] h-4 px-0.5 flex items-center justify-center rounded-full font-bold hidden" data-cart-badge>0</span>
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
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='contact'?'is-active':''}" href="contact.html">Contact</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='favorites'?'is-active':''}" href="favorites.html">Favourites</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='cart'?'is-active':''}" href="cart.html">Cart</a>
        ${currentUser ? '' : `<a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${authActive?'is-active':''}" href="${authHref}">${authLabel}</a>`}
        ${profileNavDrawer(activePage)}
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
              <a class="text-on-surface-variant hover:text-primary transition" href="contact.html">Contact</a>
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
          <p class="font-label text-label-sm text-on-surface-variant uppercase tracking-widest">© 2025 Flora &amp; Gifts. Crafted with botanical poetry. <span class="opacity-60 normal-case tracking-normal" data-flora-build>· v8</span></p>
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
    if (open && !open._floraBound) { open._floraBound = true; open.addEventListener('click', openD); }
    if (close && !close._floraBound) { close._floraBound = true; close.addEventListener('click', closeD); }
    if (!overlay._floraBound) { overlay._floraBound = true; overlay.addEventListener('click', closeD); }
  }

  function setupProfileMenu() {
    const btn = document.getElementById('profileMenuBtn');
    const menu = document.getElementById('profileDropdown');
    if (!btn || !menu) return;
    const chevron = btn.querySelector('.profile-chevron');
    const close = () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (chevron) chevron.classList.remove('rotate-180');
    };
    const open = () => {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      if (chevron) chevron.classList.add('rotate-180');
    };
    if (!btn._floraBound) {
      btn._floraBound = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.contains('hidden') ? open() : close();
      });
    }
    if (!menu._floraBound) {
      menu._floraBound = true;
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    }
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

    ['navLogoutBtn', 'logoutDrawerBtn', 'logoutBtn', 'adminLogoutBtn', 'profileLogoutBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._floraBound) {
        el._floraBound = true;
        el.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
      }
    });
  }

  function doLogout() {
    if (getSessionType() === SessionType.USER) {
      persistCart();
      saveFavoritesLocal();
      clearTimeout(favoritesSyncTimer);
      if (token) Api.saveFavorites({ productIds: favorites }).catch(() => {});
    }
    resetFavoritesSession();
    token = null;
    currentUser = null;
    cart = sanitizeCart(Store.get(CART_GUEST, []));
    favorites = mergeFavoriteIds(Store.get(FAV_GUEST, []));
    updateCartBadge();
    updateFavoritesBadge();
    syncFavoriteIcons();
    Store.clear('token');
    Store.clear('user');
    toast('Logged out — see you again soon');
    setTimeout(() => { location.href = 'index.html'; }, 500);
  }

  function updateCartBadge() {
    const count = isLoggedIn() ? cart.reduce((s, i) => s + i.qty, 0) : 0;
    document.querySelectorAll('[data-cart-badge]').forEach((el) => {
      el.textContent = String(count);
      el.classList.toggle('hidden', count === 0);
    });
  }

  function updateFavoritesBadge() {
    const count = favorites.length;
    document.querySelectorAll('[data-fav-badge]').forEach(el => {
      el.textContent = String(count);
      el.classList.toggle('hidden', count === 0);
    });
  }

  function isFavorite(id) {
    const n = Number(id);
    return favorites.some((f) => Number(f) === n);
  }

  function setFavoriteButtonState(btn, on) {
    const icon = btn.querySelector('.fav-icon');
    if (icon) {
      icon.textContent = on ? 'favorite' : 'favorite_border';
      icon.classList.toggle('is-active', on);
    }
    btn.classList.toggle('text-error', on);
    btn.classList.toggle('text-on-surface-variant', !on);
    btn.classList.toggle('hover:text-error', !on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
  }

  function syncFavoriteIcons(root) {
    (root || document).querySelectorAll('[data-fav]').forEach((btn) => {
      setFavoriteButtonState(btn, isFavorite(btn.dataset.fav));
    });
  }

  function toggleFavorite(id) {
    if (!requireLogin('favorites')) return false;
    const n = Number(id);
    const i = favorites.findIndex((f) => Number(f) === n);
    if (i >= 0) favorites.splice(i, 1);
    else favorites.push(n);
    saveFavoritesLocal();
    scheduleFavoritesSync();
    updateFavoritesBadge();
    document.querySelectorAll('[data-fav="' + n + '"]').forEach((btn) => setFavoriteButtonState(btn, isFavorite(n)));
    renderFavoritesIfOnPage();
    toast(i >= 0 ? 'Removed from favourites' : 'Saved to favourites');
    return true;
  }

  function formatCartOpts(opts) {
    if (!opts) return '';
    const parts = [];
    if (opts.flowerColor) parts.push(opts.flowerColor);
    if (opts.coverColor) parts.push(opts.coverColor + ' wrap');
    if (opts.wrap) parts.push(opts.wrap);
    if (opts.card) parts.push('Gift card');
    if (opts.msg) {
      const m = String(opts.msg);
      parts.push('“' + m.slice(0, 40) + (m.length > 40 ? '…”' : '”'));
    }
    return parts.join(' · ');
  }

  function bindFavoriteButtons(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-fav]').forEach(btn => {
      if (btn._favBound) return;
      btn._favBound = true;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(parseInt(btn.dataset.fav, 10));
      });
    });
    syncFavoriteIcons(scope);
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

  function readProductsCache() {
    try {
      const raw = sessionStorage.getItem(KEY + 'productsCache');
      if (!raw) return null;
      const { at, data } = JSON.parse(raw);
      if (Date.now() - at > PRODUCTS_CACHE_TTL_MS || !Array.isArray(data)) return null;
      return data;
    } catch { return null; }
  }

  function writeProductsCache(data) {
    try {
      sessionStorage.setItem(KEY + 'productsCache', JSON.stringify({ at: Date.now(), data }));
    } catch {}
  }

  async function fetchProductsFromApi(full) {
    return Api.products(!!full);
  }

  function refreshProductsInBackground(full) {
    fetchProductsFromApi(full).then((data) => {
      products = data;
      productsLoaded = true;
      writeProductsCache(data);
    }).catch(() => {});
  }

  async function ensureProducts(opts = {}) {
    const full = !!opts.full;
    if (productsLoaded && !opts.force) return products;
    if (!opts.force) {
      const cached = readProductsCache();
      if (cached && cached.length) {
        products = cached;
        productsLoaded = true;
        refreshProductsInBackground(full);
        return products;
      }
    }
    if (productsInflight) return productsInflight;
    productsInflight = fetchProductsFromApi(full).then((data) => {
      products = data;
      productsLoaded = true;
      writeProductsCache(data);
      return products;
    }).finally(() => { productsInflight = null; });
    return productsInflight;
  }

  async function ensureProductDetail(id) {
    const existing = products.find((x) => x.id === id);
    if (existing && existing.gallery) return existing;
    const full = await Api.productById(id);
    const idx = products.findIndex((x) => x.id === id);
    if (idx >= 0) products[idx] = full;
    else products.push(full);
    return full;
  }

  function preloadImages(urls) {
    for (const url of urls) {
      if (!url) continue;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  }

  function preloadProductThumbs(list, limit) {
    preloadImages((list || []).slice(0, limit).map((p) => productThumbUrl(p.image)));
  }

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
    if (!requireLogin('cart')) return false;
    const p = products.find(x => x.id === id);
    if (!p) return false;
    const price = calcPrice(p, opts || {});
    const lineOpts = opts || {};
    const key = cartItemKey({ id, opts: lineOpts });
    const existing = cart.find((i) => cartItemKey(i) === key);
    const addQty = clampQty(qty);
    const stock = Math.max(1, Number(p.stock) || 99);
    if (existing) existing.qty = Math.min(stock, existing.qty + addQty);
    else cart.push({ id, qty: Math.min(stock, addQty), opts: lineOpts, price, name: p.name, image: p.image });
    persistCart();
    updateCartBadge();
    toast('Added to your collection');
    return true;
  }

  function productCardHTML(p, eager) {
    const thumb = productThumbUrl(p.image || '');
    const loadAttr = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return `
    <a href="product.html?id=${p.id}" class="product-card group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full border border-outline-variant/10 cursor-pointer reveal block">
      <div class="aspect-[4/5] overflow-hidden bg-surface-container-low relative">
        <img alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${thumb}" width="400" height="500" ${loadAttr} decoding="async"/>
        <button type="button" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow ${isFavorite(p.id) ? 'text-error' : 'text-on-surface-variant hover:text-error'}" data-fav="${p.id}" aria-pressed="${isFavorite(p.id) ? 'true' : 'false'}" aria-label="${isFavorite(p.id) ? 'Remove from favourites' : 'Add to favourites'}">
          <span class="material-symbols-outlined fav-icon text-[22px] ${isFavorite(p.id) ? 'is-active' : ''}">${isFavorite(p.id) ? 'favorite' : 'favorite_border'}</span>
        </button>
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
    bindFavoriteButtons(root);
    (root || document).querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(parseInt(btn.dataset.add, 10), 1, {});
      });
    });
  }

  async function initHome() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) { applyReveal(); return; }
    grid.innerHTML = loadingHTML('Loading featured collection...');
    try {
      await ensureProducts();
      const featured = products.slice(0, 4);
      preloadProductThumbs(featured, 4);
      grid.innerHTML = featured.map((p, i) => productCardHTML(p, i < 2)).join('');
      bindCardAddButtons(grid);
    } catch (e) {
      grid.innerHTML = errorHTML('Could not load products. ' + e.message);
    }
    applyReveal();
  }

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
      bindFavoriteButtons(grid);
    }
    applyReveal();
  }

  async function initShop() {
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = loadingHTML('Loading collection...');
    try {
      await ensureProducts();
      preloadProductThumbs(products, 12);
    } catch (e) {
      if (grid) grid.innerHTML = errorHTML('Could not load products. ' + e.message);
      return;
    }
    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', (e) => { shopState.q = e.target.value.toLowerCase(); renderShop(); });
    renderShop();
  }

  let detailState = { qty: 1, opts: {}, gallery: 0, galleryLocked: false, _initialized: false };

  function renderDetail(p) {
    const root = document.getElementById('detailContent');
    if (!root) return;
    document.title = `${p.name} | Flora & Gifts`;
    const total = calcPrice(p, detailState.opts) * detailState.qty;
    const gallery = productGallery(p);
    const isBouquet = p.category === 'flowers' || p.category === 'wedding';
    if (isBouquet && !detailState.opts.flowerColor) detailState.opts.flowerColor = FLOWER_COLORS[0];
    if (isBouquet && !detailState.opts.coverColor) detailState.opts.coverColor = COVER_COLORS[0];
    if (isBouquet && !detailState._initialized) {
      syncDetailGalleryToOptions(gallery, p.image);
      detailState._initialized = true;
    } else if (detailState.gallery < 0 && !detailState._heroSrc) {
      detailState.gallery = 0;
    }
    const heroImg = detailState._heroSrc || gallery[Math.max(0, detailState.gallery)] || p.image;

    let preload = document.getElementById('detailImgPreload');
    if (!preload) {
      preload = document.createElement('link');
      preload.id = 'detailImgPreload';
      preload.rel = 'preload';
      preload.as = 'image';
      document.head.appendChild(preload);
    }
    preload.href = heroImg;
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
            <img alt="${p.name}" id="detailHeroImg" class="w-full h-full object-cover transition-opacity duration-300" src="${heroImg}" width="900" height="900" fetchpriority="high" decoding="async"/>
          </div>
          <div class="flex gap-3 md:gap-4 overflow-x-auto pb-1 snap-x snap-mandatory">
            ${gallery.map((src, i) => {
              const colorLabel = flowerColorForImage(src) || `Photo ${i + 1}`;
              return `
              <button type="button" class="snap-start shrink-0 w-[22%] min-w-[4.5rem] max-w-[7rem] flex flex-col gap-1 cursor-pointer" data-gallery="${i}" aria-label="View ${colorLabel}">
                <span class="aspect-square bg-surface-container rounded-md overflow-hidden transition-all ${detailState.gallery === i ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40'}">
                  <img alt="${p.name} — ${colorLabel}" class="w-full h-full object-cover" src="${productThumbUrl(src)}" width="120" height="120" loading="lazy" decoding="async"/>
                </span>
                ${flowerColorForImage(src) ? `<span class="font-label text-[9px] uppercase tracking-wide text-center text-on-surface-variant truncate">${colorLabel}</span>` : ''}
              </button>`;
            }).join('')}
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
          ${isBouquet ? `
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Flower Colour</label>
            <div class="flex flex-wrap gap-2">
              ${FLOWER_COLORS.map(c => `
                <button type="button" class="px-3 py-2 rounded-lg text-sm border transition ${detailState.opts.flowerColor === c ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}" data-flower-color="${c}">${c}</button>`).join('')}
            </div>
          </div>
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Cover / Wrapping Colour</label>
            <div class="flex flex-wrap gap-2">
              ${COVER_COLORS.map(c => `
                <button type="button" class="px-3 py-2 rounded-lg text-sm border transition ${detailState.opts.coverColor === c ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}" data-cover-color="${c}">${c}</button>`).join('')}
            </div>
          </div>` : ''}
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
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Message on Card</label>
            <button class="w-full text-left px-4 py-3 rounded-lg border transition ${detailState.opts.card ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:border-primary'}" id="cardToggle">
              ${detailState.opts.card ? '✓ Card included' : 'Add a personal message card'} <span class="opacity-70 text-xs ml-2">+${fmt(CARD_COST)}</span>
            </button>
            ${detailState.opts.card ? `<textarea class="w-full mt-3 bg-surface-container-low border border-outline-variant/40 rounded-lg p-3 focus:outline-none focus:border-primary min-h-[88px] resize-y" placeholder="Write your message for the recipient..." id="cardMsg" maxlength="280">${detailState.opts.msg || ''}</textarea>
            <p class="text-xs text-on-surface-variant mt-1">Printed on a premium card with your bouquet or gift.</p>` : ''}
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

    root.querySelectorAll('[data-gallery]').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.gallery, 10);
      if (idx === detailState.gallery) return;
      detailState.galleryLocked = true;
      detailState.gallery = idx;
      detailState._heroSrc = gallery[idx];
      const thumbColor = flowerColorForImage(gallery[idx]);
      if (thumbColor) detailState.opts.flowerColor = thumbColor;
      setDetailHeroImage(gallery[idx], root);
      updateDetailColorButtons(root);
    }));
    root.querySelectorAll('[data-flower-color]').forEach(b => b.addEventListener('click', () => {
      detailState.opts.flowerColor = b.dataset.flowerColor;
      detailState.galleryLocked = false;
      applyDetailColorPhoto(gallery, p.image, root);
    }));
    root.querySelectorAll('[data-cover-color]').forEach(b => b.addEventListener('click', () => {
      detailState.opts.coverColor = b.dataset.coverColor;
      detailState.galleryLocked = false;
      applyDetailColorPhoto(gallery, p.image, root);
    }));
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
      if (!addToCart(p.id, detailState.qty, { ...detailState.opts })) return;
      setTimeout(() => location.href = 'cart.html', 600);
    });
    bindCardAddButtons(document.getElementById('completeGrid'));
    applyReveal();
  }

  async function initProduct() {
    const root = document.getElementById('detailContent');
    if (!root) return;
    root.innerHTML = loadingHTML('Loading product...');
    detailState = { qty: 1, opts: { flowerColor: FLOWER_COLORS[0], coverColor: COVER_COLORS[0] }, gallery: 0, galleryLocked: false, _initialized: false };
    const id = parseInt(new URLSearchParams(location.search).get('id'), 10);
    if (!id) { root.innerHTML = errorHTML('No product selected.'); return; }
    try {
      const p = await ensureProductDetail(id);
      if (!p) {
        root.innerHTML = `<div class="text-center py-16"><p class="text-on-surface-variant mb-4">Product not found.</p><a class="bg-primary text-on-primary px-6 py-3 rounded-full font-label text-label-sm uppercase tracking-widest" href="shop.html">Browse Collection</a></div>`;
        return;
      }
      const defaultFlower = PRODUCT_DEFAULT_FLOWER_COLOR[p.name] || FLOWER_COLORS[0];
      detailState.opts.flowerColor = defaultFlower;
      renderDetail(p);
    } catch (e) {
      root.innerHTML = errorHTML(e.message);
    }
  }

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
              <img src="${productThumbUrl(item.image)}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async" width="80" height="80"/>
              <div class="flex-1 min-w-0">
                <h3 class="font-display text-base md:text-lg text-on-surface truncate">${item.name}</h3>
                <p class="text-xs md:text-sm text-on-surface-variant">${formatCartOpts(item.opts) || 'Standard'}</p>
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
      persistCart(); updateCartBadge(); renderCart();
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      cart.splice(parseInt(b.dataset.remove, 10), 1);
      persistCart(); updateCartBadge(); renderCart();
    }));
    applyReveal();
  }

  async function initCart() {
    const el = document.getElementById('cartContent');
    if (!el) return;
    if (!isLoggedIn()) {
      el.innerHTML = loginRequiredHTML('cart');
      applyReveal();
      return;
    }
    el.innerHTML = loadingHTML('Loading your cart...');
    await ensureCartReady();
    renderCart();
  }

  let checkoutState = { pm: 'cash' };

  async function initCheckout() {
    const el = document.getElementById('checkoutContent');
    if (!el) return;
    if (!isLoggedIn()) {
      el.innerHTML = loginRequiredHTML('checkout');
      applyReveal();
      return;
    }
    await ensureCartReady();
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
                <img src="${productThumbUrl(i.image)}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async" width="48" height="48"/>
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
        persistCart();
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

  let authMode = 'login'; // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  let pendingRegistration = null; // { name, email, password, sentAt }
  let pendingReset = null; // { email }
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
      location.replace(currentUser.role === 'admin' ? 'admin.html' : 'profile.html');
      return;
    }

    if (authMode === 'forgot') {
      el.innerHTML = `
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <button class="font-label text-label-sm text-on-surface-variant hover:text-primary transition mb-6 inline-flex items-center gap-2" id="backToLoginBtn">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span> Back to login
          </button>
          <span class="material-symbols-outlined text-5xl text-primary mb-4 block text-center">lock_reset</span>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Forgot password?</h2>
          <p class="text-center text-on-surface-variant mb-6">Enter your email and we'll send a 6-digit reset code.</p>
          <input type="email" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4 focus:outline-none focus:border-primary" id="forgotEmail" placeholder="email@example.com" autocomplete="email"/>
          <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="forgotSubmit">Send reset code</button>
        </div>`;
      document.getElementById('backToLoginBtn').addEventListener('click', () => { authMode = 'login'; renderAuth(); });
      document.getElementById('forgotSubmit').addEventListener('click', async () => {
        const email = document.getElementById('forgotEmail').value.trim();
        if (!email) { toast('Enter your email'); return; }
        const btn = document.getElementById('forgotSubmit');
        btn.disabled = true; btn.textContent = 'Sending...';
        try {
          await Api.forgotPassword({ email });
          pendingReset = { email };
          authMode = 'reset';
          renderAuth();
          toast('If an account exists, we sent a reset code');
        } catch (e) {
          btn.disabled = false; btn.textContent = 'Send reset code';
          toast(e.message || 'Could not send reset code');
        }
      });
      applyReveal();
      return;
    }

    if (authMode === 'reset' && pendingReset) {
      el.innerHTML = `
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <span class="material-symbols-outlined text-5xl text-primary mb-4 block text-center">vpn_key</span>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Set new password</h2>
          <p class="text-center text-on-surface-variant mb-6">Code sent to <strong class="text-on-surface">${pendingReset.email}</strong></p>
          <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Reset Code</label>
          <input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4 text-center tracking-[0.4em] font-display text-xl" id="resetPin" placeholder="000000" inputmode="numeric" maxlength="6"/>
          <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">New Password</label>
          <input type="password" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-6 focus:outline-none focus:border-primary" id="resetPass" placeholder="Min. 6 characters" autocomplete="new-password"/>
          <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="resetSubmit">Update password</button>
        </div>`;
      document.getElementById('resetPin').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
      document.getElementById('resetSubmit').addEventListener('click', async () => {
        const pin = document.getElementById('resetPin').value;
        const password = document.getElementById('resetPass').value;
        if (!/^\d{6}$/.test(pin)) { toast('Enter the 6-digit code'); return; }
        if (password.length < 6) { toast('Password must be at least 6 characters'); return; }
        const btn = document.getElementById('resetSubmit');
        btn.disabled = true; btn.textContent = 'Updating...';
        try {
          await Api.resetPassword({ email: pendingReset.email, pin, password });
          pendingReset = null;
          authMode = 'login';
          renderAuth();
          toast('Password updated — please sign in');
        } catch (e) {
          btn.disabled = false; btn.textContent = 'Update password';
          toast(e.message || 'Reset failed');
        }
      });
      applyReveal();
      return;
    }

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
          cartReadyPromise = null;
          resetFavoritesSession();
          await Promise.all([ensureCartReady(), ensureFavoritesReady({ forceServer: true })]);
          toast('Welcome to Flora, ' + currentUser.name);
          setTimeout(() => location.href = authRedirectUrl(currentUser), 600);
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
        ${authMode === 'login' ? `<p class="text-center text-sm mt-4"><button type="button" class="text-primary hover:underline font-label text-label-sm" id="forgotLink">Forgot password?</button></p>` : ''}
      </div>`;
    el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { authMode = b.dataset.mode; renderAuth(); }));
    const forgotLink = document.getElementById('forgotLink');
    if (forgotLink) forgotLink.addEventListener('click', () => { authMode = 'forgot'; renderAuth(); });
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
          cartReadyPromise = null;
          resetFavoritesSession();
          await Promise.all([ensureCartReady(), ensureFavoritesReady({ forceServer: true })]);
          toast('Welcome back, ' + currentUser.name);
          setTimeout(() => location.href = authRedirectUrl(currentUser), 600);
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

  function initAuth() {
    const mode = new URLSearchParams(location.search).get('mode');
    if (mode === 'register') authMode = 'register';
    else if (mode === 'login') authMode = 'login';
    renderAuth();
  }

  let profilePasswordStep = 'idle'; // idle | code-sent | done

  function renderProfilePasswordPanel() {
    const panel = document.getElementById('profilePasswordPanel');
    if (!panel || !currentUser) return;

    if (profilePasswordStep === 'code-sent' && pendingReset) {
      panel.innerHTML = `
        <p class="text-sm text-on-surface-variant mb-4">Enter the 6-digit code sent to <strong class="text-on-surface">${pendingReset.email}</strong></p>
        <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Verification code</label>
        <input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4 text-center tracking-[0.35em] font-display text-xl" id="profileResetPin" placeholder="000000" inputmode="numeric" maxlength="6"/>
        <label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">New password</label>
        <input type="password" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4 focus:outline-none focus:border-primary" id="profileResetPass" placeholder="Min. 6 characters" autocomplete="new-password"/>
        <div class="flex flex-col sm:flex-row gap-3">
          <button type="button" class="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="profileResetSubmit">Update password</button>
          <button type="button" class="flex-1 border border-outline-variant/40 text-on-surface-variant py-3 rounded-lg font-label text-label-sm hover:border-primary hover:text-primary transition" id="profileResetCancel">Cancel</button>
        </div>`;
      const pinInput = document.getElementById('profileResetPin');
      pinInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
      document.getElementById('profileResetCancel').addEventListener('click', () => {
        profilePasswordStep = 'idle';
        pendingReset = null;
        renderProfilePasswordPanel();
      });
      document.getElementById('profileResetSubmit').addEventListener('click', async () => {
        const pin = pinInput.value;
        const password = document.getElementById('profileResetPass').value;
        if (!/^\d{6}$/.test(pin)) { toast('Enter the 6-digit code'); return; }
        if (password.length < 6) { toast('Password must be at least 6 characters'); return; }
        const btn = document.getElementById('profileResetSubmit');
        btn.disabled = true;
        try {
          await Api.resetPassword({ email: pendingReset.email, pin, password });
          profilePasswordStep = 'done';
          pendingReset = null;
          toast('Password updated successfully');
          renderProfilePasswordPanel();
        } catch (e) {
          btn.disabled = false;
          toast(e.message || 'Could not update password');
        }
      });
      return;
    }

    if (profilePasswordStep === 'done') {
      panel.innerHTML = `<p class="text-sm text-success flex items-center gap-2"><span class="material-symbols-outlined">check_circle</span> Your password was updated.</p>`;
      return;
    }

    panel.innerHTML = `
      <p class="text-sm text-on-surface-variant mb-4">We'll email a verification code to <strong class="text-on-surface">${currentUser.email}</strong> to confirm it's you.</p>
      <button type="button" class="bg-primary text-on-primary px-6 py-3 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="profileSendCodeBtn">Send verification code</button>`;
    document.getElementById('profileSendCodeBtn').addEventListener('click', async () => {
      const btn = document.getElementById('profileSendCodeBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      try {
        await Api.forgotPassword({ email: currentUser.email });
        pendingReset = { email: currentUser.email };
        profilePasswordStep = 'code-sent';
        toast('Check your email for the code');
        renderProfilePasswordPanel();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Send verification code';
        toast(e.message || 'Could not send code');
      }
    });
  }

  function initProfile() {
    const el = document.getElementById('profileContent');
    if (!el) return;
    if (!currentUser) {
      el.innerHTML = `
        <div class="text-center py-16 reveal max-w-md mx-auto">
          <span class="material-symbols-outlined text-5xl text-primary/40 mb-4">person</span>
          <h2 class="font-display text-headline-md text-on-surface mb-3">Sign in to view your profile</h2>
          <a class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition inline-block" href="auth.html">Login</a>
        </div>`;
      applyReveal();
      return;
    }

    if (currentUser.role === 'admin') {
      location.replace('admin.html');
      return;
    }

    const initials = userInitials(currentUser.name);
    profilePasswordStep = location.hash === '#password' ? 'idle' : profilePasswordStep;

    el.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal flex items-center gap-5">
          <span class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 text-primary text-xl md:text-2xl font-bold flex items-center justify-center ring-2 ring-primary/15 shrink-0">${initials}</span>
          <div class="min-w-0">
            <h2 class="font-display text-headline-md text-primary truncate">${currentUser.name}</h2>
            <p class="text-on-surface-variant truncate">${currentUser.email}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal">
          <a href="orders.html" class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 hover:border-primary/40 hover:shadow-md transition group">
            <span class="material-symbols-outlined text-primary text-3xl mb-3 block">inventory_2</span>
            <h3 class="font-display text-lg text-on-surface group-hover:text-primary transition">My orders</h3>
            <p class="text-sm text-on-surface-variant mt-1">Track purchases &amp; delivery status</p>
          </a>
          <a href="favorites.html" class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 hover:border-primary/40 hover:shadow-md transition group">
            <span class="material-symbols-outlined text-primary text-3xl mb-3 block">favorite</span>
            <h3 class="font-display text-lg text-on-surface group-hover:text-primary transition">Favourites</h3>
            <p class="text-sm text-on-surface-variant mt-1">Saved bouquets &amp; gifts</p>
          </a>
        </div>
        <div id="password" class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal scroll-mt-28">
          <div class="flex items-center gap-3 mb-4">
            <span class="material-symbols-outlined text-primary text-3xl">lock_reset</span>
            <h3 class="font-display text-xl text-primary">Change password</h3>
          </div>
          <div id="profilePasswordPanel"></div>
        </div>
        <div class="reveal pt-2">
          <button type="button" class="w-full sm:w-auto flex items-center justify-center gap-2 border border-outline-variant/40 text-on-surface-variant px-8 py-3 rounded-lg font-label text-label-sm uppercase tracking-widest hover:border-error hover:text-error transition" data-logout id="profileLogoutBtn">
            <span class="material-symbols-outlined text-[20px]">logout</span>
            Sign out
          </button>
        </div>
      </div>`;

    bindLogoutButtons();
    renderProfilePasswordPanel();
    if (location.hash === '#password') {
      const block = document.getElementById('password');
      if (block) setTimeout(() => block.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
    applyReveal();
  }

  function initContact() {
    const el = document.getElementById('contactContent');
    if (!el) return;
    const s = STORE_INFO;
    el.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div class="space-y-4 md:space-y-5">
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal flex gap-5">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary">location_on</span>
            </div>
            <div>
              <h3 class="font-display text-xl text-primary mb-2">Visit Our Atelier</h3>
              <p class="text-on-surface font-medium">${s.address}</p>
              <p class="text-on-surface-variant">${s.city}</p>
              <p class="text-on-surface-variant text-sm mt-1">${s.country}</p>
              <a class="inline-flex items-center gap-1 mt-3 font-label text-label-sm text-primary hover:text-secondary transition" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapQuery)}" target="_blank" rel="noopener noreferrer">
                Get directions <span class="material-symbols-outlined text-[16px]">arrow_outward</span>
              </a>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal flex gap-5">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary">call</span>
            </div>
            <div>
              <h3 class="font-display text-xl text-primary mb-2">Phone &amp; WhatsApp</h3>
              <a class="block text-on-surface hover:text-primary transition font-medium" href="${s.phoneHref}">${s.phone}</a>
              <a class="block text-on-surface-variant hover:text-primary transition mt-2 text-sm" href="${s.whatsappHref}" target="_blank" rel="noopener noreferrer">WhatsApp: ${s.whatsapp}</a>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal flex gap-5">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary">mail</span>
            </div>
            <div>
              <h3 class="font-display text-xl text-primary mb-2">Email</h3>
              <a class="text-on-surface hover:text-primary transition font-medium" href="${s.emailHref}">${s.email}</a>
              <p class="text-on-surface-variant text-sm mt-2">Orders, custom bouquets &amp; events — we reply within 1–2 business days.</p>
            </div>
          </div>
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal flex gap-5">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary">schedule</span>
            </div>
            <div class="w-full">
              <h3 class="font-display text-xl text-primary mb-3">Opening Hours</h3>
              <ul class="space-y-2">
                ${s.hours.map(h => `
                  <li class="flex justify-between gap-4 text-sm border-b border-outline-variant/20 pb-2 last:border-0 last:pb-0">
                    <span class="text-on-surface-variant">${h.days}</span>
                    <span class="text-on-surface font-medium">${h.time}</span>
                  </li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        <div class="reveal">
          <div class="rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm aspect-[4/3] lg:aspect-auto lg:min-h-[520px] bg-surface-container-low">
            <iframe class="w-full h-full min-h-[320px] lg:min-h-[520px] border-0" title="Flora &amp; Gifts location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${s.mapEmbed}"></iframe>
          </div>
          <p class="text-center text-xs text-on-surface-variant mt-4 font-label uppercase tracking-widest">${s.name}</p>
        </div>
      </div>`;
    applyReveal();
  }

  async function initFavorites() {
    const el = document.getElementById('favoritesContent');
    if (!el) return;
    if (!isLoggedIn()) {
      el.innerHTML = loginRequiredHTML('favorites');
      applyReveal();
      return;
    }
    const needsLoad = !favoritesServerSynced && getSessionType() === SessionType.USER;
    if (needsLoad) el.innerHTML = loadingHTML('Loading favourites...');
    try {
      await ensureProducts().catch(() => {});
      if (needsLoad) await ensureFavoritesReady();
      renderFavoritesInto(el);
    } catch (e) {
      el.innerHTML = errorHTML(e.message);
    }
  }

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
        <div class="flex items-center gap-2 mb-4 flex-wrap">${o.items.map(i => `<img src="${productThumbUrl(i.image)}" class="w-10 h-10 rounded-lg object-cover" loading="lazy" decoding="async" width="40" height="40"/>`).join('')}</div>
        <p class="font-display text-xl text-secondary">${fmt(o.total)} ${CURRENCY.code}</p>
      </div>`).join('')}</div>`;
    applyReveal();
  }

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
        productsLoaded = false;
        await ensureProducts({ full: true, force: true });
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
          <div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['','Name','Category','Price','Stock','Action'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${products.map(p => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3"><img src="${productThumbUrl(p.image)}" class="w-10 h-10 rounded-lg object-cover" loading="lazy" decoding="async" width="40" height="40"/></td><td class="px-4 py-3">${p.name}</td><td class="px-4 py-3 capitalize">${p.category}</td><td class="px-4 py-3 text-secondary">${fmt(p.price)}</td><td class="px-4 py-3">${p.stock}</td><td class="px-4 py-3"><button class="text-error text-xs hover:underline" data-del="${p.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>`;
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
            try { sessionStorage.removeItem(KEY + 'productsCache'); } catch {}
            toast('Product added');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not add product'); }
        });
        el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('Remove this product?')) return;
          try {
            await Api.deleteProduct(b.dataset.del);
            productsLoaded = false;
            try { sessionStorage.removeItem(KEY + 'productsCache'); } catch {}
            toast('Product removed');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not remove'); }
        }));
      } else if (adminSection === 'aorders') {
        const orders = await Api.adminOrders();
        adminCache.orders = orders;
        el.innerHTML = `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','User','Total','Date','Address','Payment','Status','Actions'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${orders.length ? orders.map(o => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${o.id}</td><td class="px-4 py-3">${o.user || '—'}</td><td class="px-4 py-3 text-secondary">${fmt(o.total)}</td><td class="px-4 py-3">${o.date}</td><td class="px-4 py-3 max-w-[160px] truncate">${o.address || ''}</td><td class="px-4 py-3">${o.payment || 'cash'}</td><td class="px-4 py-3"><select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-order-status="${o.rawId}">${['Processing','Shipped','Delivered','Cancelled'].map(s => `<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td class="px-4 py-3"><button type="button" class="text-error text-xs hover:underline" data-del-order="${o.rawId}">Delete</button></td></tr>`).join('') : '<tr><td colspan="8" class="text-center px-4 py-12 text-on-surface-variant">No orders yet.</td></tr>'}</tbody></table></div>`;
        el.querySelectorAll('[data-order-status]').forEach(s => s.addEventListener('change', async () => {
          try { await Api.adminUpdateOrder(s.dataset.orderStatus, s.value); toast('Order updated'); }
          catch (e) { toast(e.message || 'Update failed'); }
        }));
        el.querySelectorAll('[data-del-order]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('Delete this order permanently?')) return;
          try {
            await Api.adminDeleteOrder(b.dataset.delOrder);
            toast('Order deleted');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not delete order'); }
        }));
      } else if (adminSection === 'aresv') {
        const resv = await Api.adminReservations();
        adminCache.reservations = resv;
        el.innerHTML = `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','Client','Service','Date','Guests','Notes','Status','Actions'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${resv.length ? resv.map(r => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${r.id}</td><td class="px-4 py-3">${r.name}<br/><span class="text-[10px] text-on-surface-variant">${r.email || ''}</span></td><td class="px-4 py-3">${r.service}</td><td class="px-4 py-3">${r.date}</td><td class="px-4 py-3">${r.guests || '—'}</td><td class="px-4 py-3 text-xs text-on-surface-variant max-w-[160px]">${r.notes || ''}</td><td class="px-4 py-3"><select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-resv="${r.rawId}">${['pending','confirmed','cancelled'].map(s => `<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td class="px-4 py-3"><button type="button" class="text-error text-xs hover:underline" data-del-resv="${r.rawId}">Delete</button></td></tr>`).join('') : '<tr><td colspan="8" class="text-center px-4 py-12 text-on-surface-variant">No reservations yet.</td></tr>'}</tbody></table></div>`;
        el.querySelectorAll('[data-resv]').forEach(s => s.addEventListener('change', async () => {
          try { await Api.adminUpdateReservation(s.dataset.resv, s.value); toast('Reservation updated'); }
          catch (e) { toast(e.message || 'Update failed'); }
        }));
        el.querySelectorAll('[data-del-resv]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('Delete this reservation permanently?')) return;
          try {
            await Api.adminDeleteReservation(b.dataset.delResv);
            toast('Reservation deleted');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not delete reservation'); }
        }));
      } else if (adminSection === 'ausers') {
        const users = await Api.adminUsers();
        adminCache.users = users;
        const myId = currentUser.id;
        el.innerHTML = `<p class="text-sm text-on-surface-variant mb-4">Manage accounts, roles, and access. You cannot delete your own account or the primary admin.</p>
          <div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${['ID','Name','Email','Verified','Role','Orders','Joined','Actions'].map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${users.length ? users.map(u => {
            const isSelf = u.id === myId;
            const isPrimary = u.email === 'admin@flora.com';
            const canDelete = !isSelf && !isPrimary;
            const canChangeRole = !isPrimary && !isSelf;
            const roleCell = canChangeRole
              ? `<select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-user-role="${u.id}"><option value="user" ${u.role==='user'?'selected':''}>user</option><option value="admin" ${u.role==='admin'?'selected':''}>admin</option></select>`
              : `<span class="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest ${u.role==='admin'?'bg-secondary-fixed text-on-secondary-container':'bg-primary-fixed text-primary'}">${u.role}</span>`;
            const verified = u.email_verified
              ? '<span class="text-success text-xs">Yes</span>'
              : '<span class="text-on-surface-variant text-xs">No</span>';
            const actions = canDelete
              ? `<button type="button" class="text-error text-xs hover:underline" data-del-user="${u.id}">Remove</button>`
              : '<span class="text-on-surface-variant text-xs">—</span>';
            return `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${u.id}</td><td class="px-4 py-3">${u.name}</td><td class="px-4 py-3">${u.email}</td><td class="px-4 py-3">${verified}</td><td class="px-4 py-3">${roleCell}</td><td class="px-4 py-3">${u.order_count}</td><td class="px-4 py-3 text-xs text-on-surface-variant">${u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''}</td><td class="px-4 py-3">${actions}</td></tr>`;
          }).join('') : '<tr><td colspan="8" class="text-center px-4 py-12 text-on-surface-variant">No users yet.</td></tr>'}</tbody></table></div>`;
        el.querySelectorAll('[data-user-role]').forEach(sel => sel.addEventListener('change', async () => {
          try {
            await Api.adminUpdateUserRole(sel.dataset.userRole, sel.value);
            toast('Role updated');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not update role'); }
        }));
        el.querySelectorAll('[data-del-user]').forEach(b => b.addEventListener('click', async () => {
          if (!confirm('Remove this user permanently? Their orders will stay but no longer be linked to an account.')) return;
          try {
            await Api.adminDeleteUser(b.dataset.delUser);
            toast('User removed');
            renderAdmin();
          } catch (e) { toast(e.message || 'Could not remove user'); }
        }));
      }
    } catch (e) {

      if (e.status === 401 || e.status === 403) {
        el.innerHTML = `
          <div class="text-center py-16 text-on-surface-variant">
            <span class="material-symbols-outlined text-5xl text-primary/40 mb-3 block">lock</span>
            <p class="mb-2">${e.status === 401 ? 'Your session has expired.' : 'Admin access required.'}</p>
            <p class="text-sm mb-6">Please log in again to continue.</p>
            <a class="bg-primary text-on-primary px-6 py-3 rounded-full text-sm uppercase tracking-widest" href="auth.html">Sign in</a>
          </div>`;

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

      if (currentUser) { currentUser = null; Store.clear('user'); }
      return;
    }
    try {
      const { user } = await Api.me();
      currentUser = user;
      Store.set('user', currentUser);
    } catch (e) {

    }
  }

  async function syncGuestCartAndFavorites() {
    cart = [];
    favorites = [];
    updateCartBadge();
    updateFavoritesBadge();
    syncFavoriteIcons();
  }

  function mountShell() {
    injectLayout();
    setupDrawer();
    setupProfileMenu();
    document.documentElement.classList.remove('flora-booting');
    document.documentElement.classList.add('flora-ready');
  }

  function refreshNavBadges() {
    updateCartBadge();
    updateFavoritesBadge();
    syncFavoriteIcons();
  }

  function runSessionSyncInBackground() {
    if (getSessionType() === SessionType.USER) {
      return Promise.all([ensureCartReady(), ensureFavoritesReady()]).then(refreshNavBadges).catch(() => {});
    }
    return syncGuestCartAndFavorites();
  }

  async function boot() {
    bindLogoutButtons();
    applyReveal();

    const page = document.body.dataset.page;
    const userBefore = currentUser ? currentUser.email : null;
    const needsProducts = PAGES_NEED_PRODUCTS.has(page);

    await refreshSession().catch(() => {});

    if (userBefore !== (currentUser ? currentUser.email : null)) {
      mountShell();
      bindLogoutButtons();
    }

    const sessionBg = runSessionSyncInBackground();
    const productsWork = needsProducts ? ensureProducts().catch(() => []) : Promise.resolve();

    if (page === 'home' || page === 'shop') {
      await productsWork;
      refreshNavBadges();
    } else {
      await Promise.all([sessionBg, productsWork]);
      refreshNavBadges();
    }

    if (userBefore !== (currentUser ? currentUser.email : null)) {
      mountShell();
      setupDrawer();
      setupProfileMenu();
      bindLogoutButtons();
      refreshNavBadges();
    }

    const init = { home:initHome, shop:initShop, product:initProduct, cart:initCart, checkout:initCheckout, events:initEvents, auth:initAuth, orders:initOrders, admin:initAdmin, contact:initContact, favorites:initFavorites, profile:initProfile }[page];
    if (init) {
      try { await init(); }
      catch (e) { console.error(e); toast(e.message || 'Page error'); }
    }
    bindLogoutButtons();
    applyReveal();
  }

  mountShell();
  boot();

  window.Flora = { addToCart, fmt, toast, api };
})();
