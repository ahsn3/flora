import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'public/assets/js/app.js');
let s = fs.readFileSync(file, 'utf8');

if (!s.includes('COVER_COLORS')) {
  s = s.replace(
    "const categories = ['all','flowers','gifts','wedding'];",
    `const categories = ['all','flowers','gifts','wedding'];
  const COVER_COLORS = ['Burgundy', 'Blush Pink', 'Ivory Cream', 'Sage Green', 'Midnight Navy'];
  const FLOWER_COLORS = ['Classic Red', 'Soft Pink', 'Pure White', 'Lavender', 'Sunshine Yellow', 'Seasonal Mix'];`
  );
}

if (!s.includes("let favorites =")) {
  s = s.replace(
    'let cart = Store.get(\'cart\', []);',
    `let cart = Store.get('cart', []);
  let favorites = Store.get('favorites', []);`
  );
}

if (!s.includes('forgotPassword')) {
  s = s.replace(
    '    adminDeleteReservation: (id) => api(\'/api/admin/reservations/\' + id, { method: \'DELETE\' }),',
    `    adminDeleteReservation: (id) => api('/api/admin/reservations/' + id, { method: 'DELETE' }),
    forgotPassword: (body) => api('/api/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (body) => api('/api/auth/reset-password', { method: 'POST', body }),
    submitContact: (body) => api('/api/contact', { method: 'POST', body }),`
  );
}

if (!s.includes('function updateFavoritesBadge')) {
  s = s.replace(
    `function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach(el => el.textContent = String(count));
  }`,
    `function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach(el => el.textContent = String(count));
  }

  function updateFavoritesBadge() {
    const count = favorites.length;
    document.querySelectorAll('[data-fav-badge]').forEach(el => {
      el.textContent = String(count);
      el.classList.toggle('hidden', count === 0);
    });
  }

  function isFavorite(id) {
    return favorites.includes(Number(id));
  }

  function toggleFavorite(id) {
    const n = Number(id);
    const i = favorites.indexOf(n);
    if (i >= 0) favorites.splice(i, 1);
    else favorites.push(n);
    Store.set('favorites', favorites);
    updateFavoritesBadge();
    document.querySelectorAll(\`[data-fav="\${n}"]\`).forEach(btn => {
      const on = isFavorite(n);
      btn.querySelector('.material-symbols-outlined').textContent = on ? 'favorite' : 'favorite_border';
      btn.classList.toggle('text-error', on);
    });
    toast(i >= 0 ? 'Removed from favourites' : 'Saved to favourites');
  }

  function formatCartOpts(opts) {
    if (!opts) return '';
    const parts = [];
    if (opts.flowerColor) parts.push(opts.flowerColor);
    if (opts.coverColor) parts.push(opts.coverColor + ' wrap');
    if (opts.wrap) parts.push(opts.wrap);
    if (opts.card) parts.push('Gift card');
    if (opts.msg) parts.push('“' + String(opts.msg).slice(0, 40) + (opts.msg.length > 40 ? '…”' : '”'));
    return parts.join(' · ');
  }`
  );
}

if (!s.includes('href="favorites.html"')) {
  s = s.replace(
    `          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition \${activePage==='events'?'is-active':''}" href="events.html">Events</a>
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition \${authActive?'is-active':''}" href="\${authHref}">\${authLabel}</a>`,
    `          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition \${activePage==='events'?'is-active':''}" href="events.html">Events</a>
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition \${activePage==='contact'?'is-active':''}" href="contact.html">Contact</a>
          <a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition \${authActive?'is-active':''}" href="\${authHref}">\${authLabel}</a>`
  );
  s = s.replace(
    `          \${adminItem}
          \${logoutItem}
          <a class="relative" href="cart.html" aria-label="Cart">`,
    `          \${adminItem}
          \${logoutItem}
          <a class="relative" href="favorites.html" aria-label="Favourites">
            <span class="material-symbols-outlined text-primary text-[28px]">favorite</span>
            <span class="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full font-bold \${favorites.length ? '' : 'hidden'}" data-fav-badge>\${favorites.length}</span>
          </a>
          <a class="relative" href="cart.html" aria-label="Cart">`
  );
  s = s.replace(
    `        <div class="md:hidden flex items-center gap-3">
          <a class="relative" href="cart.html" aria-label="Cart">`,
    `        <div class="md:hidden flex items-center gap-3">
          <a class="relative" href="favorites.html" aria-label="Favourites">
            <span class="material-symbols-outlined text-primary text-[26px]">favorite</span>
            <span class="absolute -top-1.5 -right-1.5 bg-secondary text-on-secondary text-[10px] min-w-[1rem] h-4 px-0.5 flex items-center justify-center rounded-full font-bold \${favorites.length ? '' : 'hidden'}" data-fav-badge>\${favorites.length}</span>
          </a>
          <a class="relative" href="cart.html" aria-label="Cart">`
  );
  s = s.replace(
    `        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='events'?'is-active':''}" href="events.html">Events</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='cart'?'is-active':''}" href="cart.html">Cart</a>`,
    `        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='events'?'is-active':''}" href="events.html">Events</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='contact'?'is-active':''}" href="contact.html">Contact</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='favorites'?'is-active':''}" href="favorites.html">Favourites</a>
        <a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition \${activePage==='cart'?'is-active':''}" href="cart.html">Cart</a>`
  );
  s = s.replace(
    '<a class="text-on-surface-variant hover:text-primary transition" href="#">Contact</a>',
    '<a class="text-on-surface-variant hover:text-primary transition" href="contact.html">Contact</a>'
  );
}

if (!s.includes('data-fav=')) {
  s = s.replace(
    '<div class="aspect-[4/5] overflow-hidden bg-surface-container-low relative">',
    `<div class="aspect-[4/5] overflow-hidden bg-surface-container-low relative">
        <button type="button" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow \${isFavorite(p.id) ? 'text-error' : 'text-on-surface-variant hover:text-error'}" data-fav="\${p.id}" aria-label="Toggle favourite">
          <span class="material-symbols-outlined text-[22px]">\${isFavorite(p.id) ? 'favorite' : 'favorite_border'}</span>
        </button>`
  );
}

if (!s.includes('Bouquet Colours')) {
  const marker = '${wrappingArr.length ? `';
  const insert = `\${(p.category === 'flowers' || p.category === 'wedding') ? \`
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Flower Colour</label>
            <div class="flex flex-wrap gap-2">
              \${FLOWER_COLORS.map(c => \`
                <button type="button" class="px-3 py-2 rounded-lg text-sm border transition \${detailState.opts.flowerColor === c ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}" data-flower-color="\${c}">\${c}</button>\`).join('')}
            </div>
          </div>
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Cover / Wrapping Colour</label>
            <div class="flex flex-wrap gap-2">
              \${COVER_COLORS.map(c => \`
                <button type="button" class="px-3 py-2 rounded-lg text-sm border transition \${detailState.opts.coverColor === c ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40'}" data-cover-color="\${c}">\${c}</button>\`).join('')}
            </div>
          </div>\` : ''}
          \${(p.card || p.category === 'flowers' || p.category === 'gifts') ? \`
          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Message on Card</label>
            \${p.card ? \`
            <button class="w-full text-left px-4 py-3 rounded-lg border transition mb-3 \${detailState.opts.card ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:border-primary'}" id="cardToggle">
              \${detailState.opts.card ? '✓ Gift card included' : 'Add gift card'} <span class="opacity-70 text-xs ml-2">+\${fmt(CARD_COST)}</span>
            </button>\` : '<p class="text-xs text-on-surface-variant mb-2">Complimentary message card with this item.</p>'}
            <textarea class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg p-3 focus:outline-none focus:border-primary min-h-[88px]" placeholder="Write your message for the recipient..." id="cardMsg">\${detailState.opts.msg || ''}</textarea>
          </div>\` : ''}
          `;
  if (!s.includes(marker)) throw new Error('wrapping marker missing');
  s = s.replace(marker, insert + marker);
}

if (s.includes('${p.card ? `') && s.includes('Personal Card')) {
  s = s.replace(
    /\$\{p\.card \? `\s*<div class="mb-6">\s*<label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Personal Card<\/label>[\s\S]*?\$\{detailState\.opts\.card \? `<input[\s\S]*?id="cardMsg"[\s\S]*?\/>` : ''\}\s*<\/div>` : ''\}/,
    ''
  );
}

if (!s.includes('data-flower-color')) {
  s = s.replace(
    "root.querySelectorAll('[data-wrap]').forEach(b => b.addEventListener('click', () => { detailState.opts.wrap = b.dataset.wrap; renderDetail(p); }));",
    `if (!detailState.opts.flowerColor && (p.category === 'flowers' || p.category === 'wedding')) detailState.opts.flowerColor = FLOWER_COLORS[0];
    if (!detailState.opts.coverColor && (p.category === 'flowers' || p.category === 'wedding')) detailState.opts.coverColor = COVER_COLORS[0];
    root.querySelectorAll('[data-flower-color]').forEach(b => b.addEventListener('click', () => { detailState.opts.flowerColor = b.dataset.flowerColor; renderDetail(p); }));
    root.querySelectorAll('[data-cover-color]').forEach(b => b.addEventListener('click', () => { detailState.opts.coverColor = b.dataset.coverColor; renderDetail(p); }));
    root.querySelectorAll('[data-wrap]').forEach(b => b.addEventListener('click', () => { detailState.opts.wrap = b.dataset.wrap; renderDetail(p); }));`
  );
  s = s.replace(
    '    if (addBtn) addBtn.addEventListener(\'click\', () => {\n      const el = document.getElementById(\'cardMsg\');\n      if (el) detailState.opts.msg = el.value;',
    `    if (addBtn) addBtn.addEventListener('click', () => {
      const el = document.getElementById('cardMsg');
      if (el) { detailState.opts.msg = el.value.trim(); detailState.opts.card = detailState.opts.card || !!detailState.opts.msg || p.card; }`
  );
  s = s.replace(
    "detailState = { qty: 1, opts: {}, gallery: 0 };",
    "detailState = { qty: 1, opts: { flowerColor: FLOWER_COLORS[0], coverColor: COVER_COLORS[0] }, gallery: 0 };"
  );
}

if (!s.includes('formatCartOpts')) {
  s = s.replace(
    '<p class="text-xs md:text-sm text-on-surface-variant">${item.opts.wrap || \'\'}</p>',
    '<p class="text-xs md:text-sm text-on-surface-variant">${formatCartOpts(item.opts)}</p>'
  );
}

if (!s.includes('bindFavoriteButtons')) {
  s = s.replace(
    `  function bindCardAddButtons(root) {
    (root || document).querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(parseInt(btn.dataset.add, 10), 1, {});
      });
    });
  }`,
    `  function bindFavoriteButtons(root) {
    (root || document).querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(parseInt(btn.dataset.fav, 10));
      });
    });
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
  }`
  );
}

if (!s.includes("authMode === 'forgot'")) {
  s = s.replace(
    "let authMode = 'login'; // 'login' | 'register' | 'verify'",
    "let authMode = 'login'; // 'login' | 'register' | 'verify' | 'forgot' | 'reset'"
  );
  s = s.replace(
    'let pendingRegistration = null; // { name, email, password, sentAt }',
    `let pendingRegistration = null;
  let pendingReset = null;`
  );
  s = s.replace(
    '    // PIN verification step (after register details submitted)\n    if (authMode === \'verify\' && pendingRegistration) {',
    `    if (authMode === 'forgot') {
      el.innerHTML = \`
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <button class="font-label text-label-sm text-on-surface-variant hover:text-primary transition mb-6 inline-flex items-center gap-2" id="backToLoginBtn">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span> Back to login
          </button>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Forgot password?</h2>
          <p class="text-center text-on-surface-variant mb-6">Enter your email and we'll send a 6-digit reset code.</p>
          <input type="email" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4" id="forgotEmail" placeholder="email@example.com"/>
          <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest" id="forgotSubmit">Send reset code</button>
        </div>\`;
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
          toast(e.message || 'Could not send code');
        }
      });
      applyReveal();
      return;
    }

    if (authMode === 'reset' && pendingReset) {
      el.innerHTML = \`
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Reset password</h2>
          <p class="text-center text-on-surface-variant mb-6">Code sent to <strong>\${pendingReset.email}</strong></p>
          <input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-3 text-center tracking-[0.3em]" id="resetPin" placeholder="000000" maxlength="6" inputmode="numeric"/>
          <input type="password" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg mb-4" id="resetPass" placeholder="New password (min. 6)"/>
          <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest" id="resetSubmit">Update password</button>
        </div>\`;
      document.getElementById('resetSubmit').addEventListener('click', async () => {
        const pin = document.getElementById('resetPin').value;
        const password = document.getElementById('resetPass').value;
        if (!/^\\d{6}$/.test(pin)) { toast('Enter the 6-digit code'); return; }
        if (password.length < 6) { toast('Password must be at least 6 characters'); return; }
        const btn = document.getElementById('resetSubmit');
        btn.disabled = true;
        try {
          await Api.resetPassword({ email: pendingReset.email, pin, password });
          pendingReset = null;
          authMode = 'login';
          renderAuth();
          toast('Password updated — please sign in');
        } catch (e) {
          btn.disabled = false;
          toast(e.message || 'Reset failed');
        }
      });
      applyReveal();
      return;
    }

    // PIN verification step (after register details submitted)
    if (authMode === 'verify' && pendingRegistration) {`
  );
  s = s.replace(
    '${authMode === \'register\' ? `<p class="text-center text-xs text-on-surface-variant mt-4">We\'ll email you a 6-digit code to verify your address.</p>` : \'\'}',
    `${authMode === 'register' ? `<p class="text-center text-xs text-on-surface-variant mt-4">We'll email you a 6-digit code to verify your address.</p>` : ''}
        ${authMode === 'login' ? `<p class="text-center text-sm mt-4"><button type="button" class="text-primary hover:underline font-label text-label-sm" id="forgotLink">Forgot password?</button></p>` : ''}`
  );
  s = s.replace(
    "    submit.addEventListener('click', handle);",
    `    const forgotLink = document.getElementById('forgotLink');
    if (forgotLink) forgotLink.addEventListener('click', () => { authMode = 'forgot'; renderAuth(); });
    submit.addEventListener('click', handle);`
  );
}

if (!s.includes('function initContact')) {
  s = s.replace(
    '  function initAuth() { renderAuth(); }',
    `  function initAuth() { renderAuth(); }

  function initContact() {
    const el = document.getElementById('contactContent');
    if (!el) return;
    el.innerHTML = \`
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 reveal">
        <div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Name</label>
        <input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" id="cName" placeholder="Your name"/></div>
        <div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Email</label>
        <input type="email" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" id="cEmail" placeholder="email@example.com"/></div>
        <div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Subject</label>
        <input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg" id="cSubject" placeholder="How can we help?"/></div>
        <div class="mb-6"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Message</label>
        <textarea class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg min-h-[140px]" id="cMessage" placeholder="Tell us about your order or event..."></textarea></div>
        <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="contactSubmit">Send message</button>
      </div>\`;
    document.getElementById('contactSubmit').addEventListener('click', async () => {
      const btn = document.getElementById('contactSubmit');
      btn.disabled = true;
      try {
        const res = await Api.submitContact({
          name: document.getElementById('cName').value.trim(),
          email: document.getElementById('cEmail').value.trim(),
          subject: document.getElementById('cSubject').value.trim(),
          message: document.getElementById('cMessage').value.trim(),
        });
        el.innerHTML = \`<div class="text-center py-12 reveal"><span class="material-symbols-outlined text-5xl text-primary mb-4">mark_email_read</span><p class="text-on-surface-variant">\${res.message}</p></div>\`;
      } catch (e) {
        btn.disabled = false;
        toast(e.message || 'Could not send message');
      }
    });
    applyReveal();
  }

  async function initFavorites() {
    const el = document.getElementById('favoritesContent');
    if (!el) return;
    await ensureProducts();
    const list = products.filter(p => isFavorite(p.id));
    if (!list.length) {
      el.innerHTML = \`<div class="text-center py-16 reveal"><span class="material-symbols-outlined text-6xl text-primary/30 mb-4">favorite</span><p class="text-on-surface-variant mb-6">No favourites yet — tap the heart on any product.</p><a href="shop.html" class="bg-primary text-on-primary px-8 py-4 rounded-full font-label text-label-sm uppercase tracking-widest">Browse shop</a></div>\`;
    } else {
      el.innerHTML = \`<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-gutter">\${list.map(productCardHTML).join('')}</div>\`;
      bindCardAddButtons(el);
    }
    applyReveal();
  }`
  );
}

if (!s.includes('contact:initContact')) {
  s = s.replace(
    'const init = { home:initHome, shop:initShop, product:initProduct, cart:initCart, checkout:initCheckout, events:initEvents, auth:initAuth, orders:initOrders, admin:initAdmin }[page];',
    'const init = { home:initHome, shop:initShop, product:initProduct, cart:initCart, checkout:initCheckout, events:initEvents, auth:initAuth, orders:initOrders, admin:initAdmin, contact:initContact, favorites:initFavorites }[page];'
  );
  s = s.replace(
    '    updateCartBadge();\n    applyReveal();',
    '    updateCartBadge();\n    updateFavoritesBadge();\n    applyReveal();'
  );
  s = s.replace(
    '        updateCartBadge();\n      }\n    }).catch(() => {});',
    '        updateCartBadge();\n        updateFavoritesBadge();\n      }\n    }).catch(() => {});'
  );
}

fs.writeFileSync(file, s);
console.log('app.js patched');
