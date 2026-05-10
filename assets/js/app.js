/* Flora & Gifts — shared application script
 * Handles: data, state persistence, shared layout injection, per-page rendering.
 * Each HTML page sets <body data-page="..."> so this script knows what to render. */
(function () {
  'use strict';

  // ─── CURRENCY ─────────────────────────────────────────────────
  const CURRENCY = { symbol: '₺', code: 'TRY' };
  const fmt = (n) => CURRENCY.symbol + Number(n || 0).toLocaleString('tr-TR');

  // ─── PRICING ──────────────────────────────────────────────────
  const WRAP_BASIC = 75, WRAP_LUX = 150, CARD_COST = 100, DELIVERY = 300;
  const eventServices = ['Wedding Full Package','Engagement Party','Birthday Celebration','Corporate Event','Baptism / Baby Shower','Anniversary Dinner'];
  const categories = ['all','flowers','gifts','wedding'];

  // ─── IMAGES ───────────────────────────────────────────────────
  const IMG = {
    rose:       'https://lh3.googleusercontent.com/aida-public/AB6AXuA5ajQl68Vcq-yYUuNb7iW9LIQuKQZRb83QWLwBZnD50lCAZesXiu_KoB-ANuJW_tHujYHq84TIrPqzmbvPKRdtND_0k239hQqnPI5jXdsOEC6_izgYdjhk7WKZ9gahTUE7Q3YJG-lOsUnCm1Yjvk8DPIwTZejr8CMtzS82qBer44lhWhtkkkKG-aavdNdo00b5Pjaj2KsIRPp1JKaOVswDyGUqlf116ol9-QzT-7dnZTw7TKr85Qs8-VCJCOGUYpje3WJZen6_buM',
    wildflower: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPmyrzPGdJPG3eRfR7f8LndEvKzXzlBY8PCcP9Lsk8t2XIsd0KH5sV0CtDYLuENlq_80VJE63VzhncTNcHIYYJmgY1jnedWV-Gs5N1bdsUOAYK3urNwb0SgCcAbu9r_AbgPoLNqX2A0f4t3aEpN-RMSPhtuhXKEFi34jcMvpLntcqUorT1TgX1ys5lB98y69txESC_9FhCi_rXYgAx0mhzhD6pdMFB-gfZKIGpBD1hx89QQS_b38GUystoxIEWv33U-12mKYDRE1U',
    orchid:     'https://lh3.googleusercontent.com/aida-public/AB6AXuAzuO_yA4sMevaZIB3xWU82vi_b_7EMQogmMLggc0wFJCsvuCHUZA9s9I2syu9di2BtHa0rWu4nffj-vjMP5Z7FHaO16jdFaluSXxctWObR7Rki-F2PiGtCitxLie4BZOFaUMR3LAy713ErKyZVOi9Mr1Yozv4QN8fxd8C5cegqO_u2aC3d-A8sdYBpLBAKaut2h51cqBOEEESEMvay8fPEG2zzJWzn5g7jHeYLd-FhNECWA6UiyEQ0b8Xt_ly5uvCdLhQlVpN1_hY',
    orchidA:    'https://lh3.googleusercontent.com/aida-public/AB6AXuAZqxYV_e7PghcpTvWWN7jt7s9C1Oak6PLDqViZkE71AOfI093FyIe0Vi7Swa6Ls08iJiuerp3f6ghnJgaXIIugBJlDhiYjViobZ3bZO-XfchICZ5SjOUrEYVvCOLhwYyc9EOjFFYewX20efXF_z5Mi9gXhvaW2ZRKW2qTljsQkkOeC4LwsMnJ-0EzvoHC9Sh1xghqmCwy94UvPQBBouNS6HFUQeJeJE6shLSaMlQi60gldNOyjppUZKasMTcTv9ayJOCPnyu6U5Ec',
    orchidB:    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjMb3aiwY4up_2h_hnyRYgLgQGpgkFODCFbuqqe8xskcXCiyzm3iHuRsRaNFvhJkaMbumViE7UyEJZCOAVEsbZzzyYpCv5CoTZsR-GmGEoUitiOq1RrGAcMQdnSyzAv5YBHVqK9o3jSV05oWAiHmr53za2pzWrfJZbFCU61bcmu4ycBhU9c-CxPDCy2WVQwTMmgFOuATcd11vk_F3XnNWlhJiCkYs3EzhW7zId9Nn_YKiUeXtLE50OgdBa9EjWQfg13vek1j7LOO0',
    orchidC:    'https://lh3.googleusercontent.com/aida-public/AB6AXuC1hwgidG7FvG-N4XdU4A1UsPLqDGTU_LXFSpMa_Vht5AhkSM9nuzvQARWPTNdiqik2jkjJ7_OWAkJTODF93uN-8SwxHSecEhGALmd1PG5q8MZWADVbaExFx_RidYuiYO_UwUxw-JBJuHbhHY2kgbPqj69KkTJjW8Baji7AeCC2CCQCoqKOhoiJs_VWUpWw_DUio-gHzav2gjGsLEKIhw39e4ypUCoROvj3cJO2aRevIwjcKYXyfLd8-9MZxzcI_acpKlsoCbSBbZc',
    sunflower:  'https://lh3.googleusercontent.com/aida-public/AB6AXuAzLOxtbM1fVipL_SvUeMJXs821NO09J0OZWc2xyZ5lchUE7qCVxTQPWe5N73efKSJXdLTmwMcODI9TArR205sfuxe112jq9CZ2V_VrGmgefHgx9GJaomGMBuPH3wlNfnyXo0noD8oFU56FrIEOiCwU4E1ZgXfluUdJ1O9uRoG-kOGbqpMJz5lDAcRyGObBG0OAbef7VWDpMTU8xL7UZTJwG_OF3j_47_HW7dB-v12mb3teryGZkjj6wXl92vFfT8BLCJo8GqCAXJs',
    hamper:     'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZlwvjiTb9f-Rm3BT1LVbEC2bif2kSgvvE_41sV4Ry6ok7dJqUcOIOljpAYVJfCG6YbQ3-FMGzWJyJAa3o3X780T3_l2cQPgcsYc5O1dtwfFgkKZLKwS8ZsYbNUD2OVrup9_3oN6IfqqNaB1FmeaNihV3QfrWnRmPaLIqd0wGh-5hkY3ukVoyATeqDfcVHUg1VAmQx2zGmMy37OMC0ck3wqaV0rZtEsCwcK61XDCfOPS1KTrSmzEVjOigs_e3jFBAaludkw_NRsQ',
    candle:     'https://lh3.googleusercontent.com/aida-public/AB6AXuBKUIulVIxvB-DNOhcI4de5P1ydcn7CyC0jT8rVuD4sj8owTXntPpbNms7OGRjQ-EatikLvObYtzWsuey6roIN2J8OI4uxLh3BJfEi_pf3w2ZULVs7TWojyPI0SMdX1JeEu98wTmjvKD7rNDMpFCA_RgFreVz8ls7MvMOQQGv44nyLSPglsbR_YauWRfU-Xl8IiHH0gw075DyVTmTC7cEaVmh4X7KyY8A3tavylA4tgCajjtweiuZByzRWVO0hp9SEiSUQsXRALeec',
    vase:       'https://lh3.googleusercontent.com/aida-public/AB6AXuB-sR3Hv1aJIl1ck1YGoPqVAeauIpWHryHkq2CJduz75Hf5rynZ14EFqXDiJoU__Qp9le3TQ52zDUNYv1Rpv_eEndzctOdUzEAOS-ctszlTsN86vFW6cxn16xMhDvEBP9-z7arHZKgDyW5OT_SaQdAWAGkK3-ebL3nXnN66-5A5cSYoDTPdFwyAksBS8YyRsaheq409ICa79G7Cl2_vsr2CzHehZtBeP7kjegx8jhMyiVY1nJ7a2cCoiyeqG4P5YEiWLld3kJbbTM0',
    wedding:    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Ndkx0FeKWwADrpc2mdBqIA_XhzugoZgFNkFhOTdmHO9HpZcejMeGcIKT8968lnptjccEbpsEAlOOMBecRznxiSG7uHFkKIIayRkGkxtHtD8y0Vga3upJNhFWlz91KitBO9-7MMtLSawMHftQMucvt_ME1ikF3A-D_STUI9hBXgNggsmS0wjtK35erDTcSYFaiyzNE4CNrzO2n2_m3aMuFdafw48WDWqqKmWBq_aSPDg1RTUHk8sJjaAB1p-i7QHjrkoXTwTRJrk',
    bridal:     'https://lh3.googleusercontent.com/aida-public/AB6AXuA5dWZLG2wemPVCyYvlD39psdOUOOdpFcxKwWcbLLORL5R8DKyqON4cY4w63Nfek7nsisicVxeoxh9r3QpYcO-zwtEita7ltaLdDV1I5KRbhazlvtPwAv0a4EKWhxd4lOVt9Vj_Fi8A6nTE3ZCeV7nWzlYiBVen6j_HKeZ2cxXNKWnOwrnpRRL9yvC3jY3Uzb1va26nxmur1Lg1fCtOUxLRE96LOURI7g2cBqZBlk9T2NeVTEaLmYp39FahWFF06cMOvdn12GT_xWw',
    homeRose:   'https://lh3.googleusercontent.com/aida-public/AB6AXuDWdgTXEmAM8ks7R7zKMzf2onHL_ktMblFMrFoPPQAmovR-8vusk9SZ8BAS5jFM1pLipAN3OPdKiNikK0DTgoN4KrSzIMkt37Jjx1BXEAUdmEiky_I33kBVVoU3We01DlAbojra2Vdyzv6Vx1wHY35GEgEIhHxnUzHTxOFf-y5gILjaIEiPYlcRTwQ-XZVpQk-Ne1GLTqYZHYPXYxFOmJHrAO2UrK75rkODQLBHdjss_eK4BdyZX7CbdvvJvlZzWL99CTdGj1w9fGU',
    heroLush:   'https://lh3.googleusercontent.com/aida-public/AB6AXuAjKytaVgRyRduHtBR4AX3HFH45R_T6g2GrnkGNuDKz96nldYF3JrmoKZmPSbai06hDeOqVKFcHEVkhSPSB213Dg1KXCHc5ZZXQb1AAKdOQlahxI_TMR3YFgssfVcKb0lL3uKIqDgI3K9usKilKWbKIBrc1f26ccvq_feNWMS2XY_hkQXWjKGWriZUxhD8hvnMrA4HHWTw18TrTqBcYD4JYGQtHoKa33DnMtIqrOh5ihPKjnza36ihJ5k0Y9HoF8yrY10uq9V9_JMI',
    eventHero:  'https://lh3.googleusercontent.com/aida-public/AB6AXuDnDLSdUBM-1zllBEuTLi-__E2Luh0tVd4raM2kmAcHSoVxeAYGJtmyQzUwKxJJ3hYkoostGHEC6DNWhFJDR1gzPtVusj0pTQhzYrofusYLEtWnbCYv-Rj25jsUOqmEr7goOVFZ3LwzpJJI92RL1OenLfWjv8PqyC7RkMQ6ki1wdwKAGY20zleJlH6JM_ZFNyRU2KgIIvEn4YZHhONYxbnuvcezqpqV8tCbvNx2TjZUgoVYKgBIikn9K7F3ECgv6wIriwFoTx0A01Q',
    weddingDetail:'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Ndkx0FeKWwADrpc2mdBqIA_XhzugoZgFNkFhOTdmHO9HpZcejMeGcIKT8968lnptjccEbpsEAlOOMBecRznxiSG7uHFkKIIayRkGkxtHtD8y0Vga3upJNhFWlz91KitBO9-7MMtLSawMHftQMucvt_ME1ikF3A-D_STUI9hBXgNggsmS0wjtK35erDTcSYFaiyzNE4CNrzO2n2_m3aMuFdafw48WDWqqKmWBq_aSPDg1RTUHk8sJjaAB1p-i7QHjrkoXTwTRJrk',
    corporate:  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3097KEuAEt6VeE6bZRGDFxgN7eBUX7Dw8XYGH7CMBcaE-Roh3bU-6haA3gxAsXTHR87wIGiMHUu9mui4lWa1yOR5fjItxpztFW64e8TYPxm1-jo5bactxHX7fLlBGldPLUIqvLWWlqHLtkexc-2-L0tafb6Ht1Kdd8s9j0_IIzbBMVLFX8RYy_jS6OzmJx2cPXDxlFx0TY7fQuC1JDQZEC0Ph7PtvLZyAxZeWUkflY4jjDrXf_9l-jqmKyP-oWdUCcAjR9x1yDEQ',
    boutonniere:'https://lh3.googleusercontent.com/aida-public/AB6AXuA5dWZLG2wemPVCyYvlD39psdOUOOdpFcxKwWcbLLORL5R8DKyqON4cY4w63Nfek7nsisicVxeoxh9r3QpYcO-zwtEita7ltaLdDV1I5KRbhazlvtPwAv0a4EKWhxd4lOVt9Vj_Fi8A6nTE3ZCeV7nWzlYiBVen6j_HKeZ2cxXNKWnOwrnpRRL9yvC3jY3Uzb1va26nxmur1Lg1fCtOUxLRE96LOURI7g2cBqZBlk9T2NeVTEaLmYp39FahWFF06cMOvdn12GT_xWw',
    outdoor:    'https://lh3.googleusercontent.com/aida-public/AB6AXuCNOV-ExAcb4cOfeXnKlufWuHyhw9rRva_iEX2YXb22ELOAh8dDLLDd7p9PvtHtmBM5bZ_DVNrU09Rsr9I-pF7JyxUA0lYERh519kyMMC4_COlcgfFt3MbXoWN_yo0CKk9UQ2ZkjmDezvq_HaSSEN777HjHdsCg-5VvqHTKE1v38amGtpOin5G-haWWVZ5byde2-nkTLxhCnoqYljq2BxYdSMzEJ1-FnDN_Z1nN-TJiULRsMQsRhKykJVfAz2ei4xHS_zxpkoBXDWU',
  };

  // ─── PRODUCT DATA ─────────────────────────────────────────────
  const PRODUCTS_DEFAULT = [
    {id:1, name:'Romantic Rose Bouquet', tagline:'Velvet Petals & Poetry', category:'flowers', price:1500, image:IMG.rose, desc:'A classic arrangement of 24 premium red roses, symbolizing deep love and passion. Each stem is hand-selected for optimal freshness.', wrapping:['Classic Wrap','Luxury Velvet','Kraft Paper'], card:true, stock:15},
    {id:2, name:'Spring Wildflowers', tagline:'Pastel Harmony & Light', category:'flowers', price:1200, image:IMG.wildflower, desc:"A vibrant mix of seasonal wildflowers — tulips, daisies, ranunculus, and baby's breath — capturing the spirit of spring.", wrapping:['Natural Twine','Pastel Ribbon','No Wrapping'], card:true, stock:10},
    {id:3, name:'Orchid Elegance', tagline:'Deep Burgundy Majesty', category:'flowers', price:2200, image:IMG.orchid, gallery:[IMG.orchid, IMG.orchidA, IMG.orchidB, IMG.orchidC], desc:"A rare symphony of deep burgundy and velvet whispers. The Orchid Elegance is a curated selection from our private botanical garden. Each bloom is hand-selected for its depth of color and structural perfection. Known as the 'Goddess of the Windowsill,' this Phalaenopsis variety thrives in quiet corners, demanding little but offering a timeless presence.", wrapping:['Gift Box','Open Vase','Ribbon Only'], card:true, stock:8, attributes:[{icon:'light_mode',label:'Lighting',value:'Indirect Light'},{icon:'opacity',label:'Watering',value:'Once Weekly'}], care:[{icon:'light_mode',title:'Morning Whispers',text:'Place your orchid in a spot where it can witness the sunrise. Indirect, bright light is its favorite companion, much like a soft morning conversation.'},{icon:'water_drop',title:'The Weekly Ritual',text:'Submerge the inner pot in room-temperature water for 15 minutes once a week. Drain completely; the roots love to breathe as much as they love to drink.'}]},
    {id:4, name:'Sunflower Sunshine', tagline:'Radiant Golden Fields', category:'flowers', price:950, image:IMG.sunflower, desc:'Bright, cheerful sunflowers paired with eucalyptus and cream chamomile. Perfect for lifting spirits.', wrapping:['Burlap Wrap','Yellow Ribbon','No Wrapping'], card:true, stock:20},
    {id:5, name:'Luxury Gift Hamper', tagline:'A Curated Indulgence', category:'gifts', price:3200, image:IMG.hamper, desc:'An exquisite hamper featuring Belgian chocolates, premium nuts, artisanal honey, scented candle, and a small bouquet.', wrapping:['Gift Basket','Wooden Crate','Premium Box'], card:true, stock:6},
    {id:6, name:'Chocolate & Roses', tagline:'Sweet Romance', category:'gifts', price:1800, image:IMG.homeRose, desc:'A romantic pairing of a dozen red roses and a box of handcrafted Belgian chocolates, presented in a velvet-lined box.', wrapping:['Red Velvet Box','Gold Ribbon Box','Simple Wrap'], card:true, stock:12},
    {id:7, name:'Scented Candle Set', tagline:'Sandalwood & White Orchid', category:'gifts', price:1300, image:IMG.candle, desc:'A curated set of three luxury soy candles in rose, jasmine, and oud fragrances, elegantly packaged.', wrapping:['Linen Bag','Gift Box','No Wrapping'], card:false, stock:18},
    {id:8, name:'Wedding Centerpiece', tagline:'Symphony of Whites', category:'wedding', price:5000, image:IMG.wedding, desc:'A grand wedding table centerpiece featuring white roses, peonies, greenery, and soft accent flowers. Price per unit.', wrapping:['As-is','With Stand','Floating Design'], card:false, stock:5},
    {id:9, name:'Bridal Bouquet', tagline:'A Cascade of Romance', category:'wedding', price:4000, image:IMG.bridal, desc:'A bespoke bridal bouquet designed to match your theme. Consultations available. Includes ribbon cascade finish.', wrapping:['Satin Ribbon','Lace Wrap','Pearl Pins'], card:false, stock:4},
    {id:10, name:'Terra Ceramic Vase', tagline:'Hand-Thrown Stoneware', category:'gifts', price:750, image:IMG.vase, desc:'Handmade minimalist stoneware vase in earthy neutral tones — the perfect companion for fresh blooms.', wrapping:['Wooden Tray','Gift Box','No Wrapping'], card:false, stock:25},
    {id:11, name:'Lavender Dreams', tagline:'A Quiet Reverie', category:'flowers', price:1100, image:IMG.wildflower, desc:'A calming arrangement of fresh lavender, white roses, and sage — perfect for creating a serene atmosphere.', wrapping:['Kraft Paper','Linen Bundle','No Wrapping'], card:true, stock:14},
    {id:12, name:'Birthday Bloom Box', tagline:'A Joyful Celebration', category:'gifts', price:2400, image:IMG.homeRose, desc:'A curated birthday box with mixed seasonal flowers, a balloon, a sparkler candle, and a personal card.', wrapping:['Signature Box','Pink Box','Gold Box'], card:true, stock:9},
  ];

  // ─── PERSISTENCE ──────────────────────────────────────────────
  const KEY = 'flora.';
  const Store = {
    get(k, fb) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {} },
  };

  // ─── STATE ────────────────────────────────────────────────────
  let products     = Store.get('products', PRODUCTS_DEFAULT);
  let cart         = Store.get('cart', []);
  let users        = Store.get('users', [{id:1,name:'Admin User',email:'admin@flora.com',password:'admin123',role:'admin',orders:[]}]);
  let currentUser  = Store.get('user', null);
  let reservations = Store.get('reservations', [
    {id:'RES001', name:'Ayşe & Mehmet', service:'Wedding Full Package', date:'2025-12-20', guests:200, status:'confirmed', notes:'Rose theme, ivory and gold'},
    {id:'RES002', name:'Zeynep Kaya',   service:'Corporate Event',      date:'2025-11-15', guests:80,  status:'pending',   notes:'Modern minimalist style'},
  ]);
  let orders = Store.get('orders', []);
  // Re-sync currentUser with users list (so role updates propagate)
  if (currentUser) {
    const fresh = users.find(u => u.email === currentUser.email);
    if (fresh) currentUser = fresh;
  }

  function persistAll() {
    Store.set('products', products);
    Store.set('cart', cart);
    Store.set('users', users);
    Store.set('user', currentUser);
    Store.set('reservations', reservations);
    Store.set('orders', orders);
  }

  // ─── LAYOUT TEMPLATES ─────────────────────────────────────────
  function navHTML(activePage) {
    const adminItem = currentUser && currentUser.role === 'admin'
      ? `<a class="nav-link font-label text-label-sm text-on-surface-variant hover:text-primary transition ${activePage==='admin'?'is-active':''}" href="admin.html">Admin</a>` : '';
    const adminDrawerItem = currentUser && currentUser.role === 'admin'
      ? `<a class="drawer-link block px-4 py-4 rounded-lg font-display text-2xl text-on-surface hover:bg-surface-container-low transition ${activePage==='admin'?'is-active':''}" href="admin.html">Admin</a>` : '';
    const authLabel = currentUser ? 'My Orders' : 'Login';
    const authHref  = currentUser ? 'orders.html' : 'auth.html';
    const authActive = (currentUser && activePage==='orders') || (!currentUser && activePage==='auth');

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
      </nav>
      <div class="mt-auto p-6 border-t border-outline-variant/30 text-center">
        <p class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant">Crafted with botanical poetry</p>
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
    if (!t) return;
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
    const open  = document.getElementById('navOpenBtn');
    const close = document.getElementById('navCloseBtn');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    if (!drawer || !overlay) return;
    const openD = () => { drawer.classList.add('open'); overlay.classList.add('open'); document.body.classList.add('menu-open'); };
    const closeD = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.classList.remove('menu-open'); };
    if (open) open.addEventListener('click', openD);
    if (close) close.addEventListener('click', closeD);
    overlay.addEventListener('click', closeD);
  }

  function updateCartBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach(el => el.textContent = String(count));
  }

  // ─── CART ─────────────────────────────────────────────────────
  function calcPrice(p, opts) {
    let price = p.price;
    if (opts && opts.wrap) {
      const i = p.wrapping.indexOf(opts.wrap);
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
    persistAll();
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
  function initHome() {
    const grid = document.getElementById('featuredGrid');
    if (grid) {
      grid.innerHTML = products.slice(0, 4).map(productCardHTML).join('');
      bindCardAddButtons(grid);
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
        const okQ = !shopState.q || p.name.toLowerCase().includes(shopState.q) || p.desc.toLowerCase().includes(shopState.q);
        return okCat && okQ;
      });
      grid.innerHTML = filtered.length
        ? filtered.map(productCardHTML).join('')
        : `<div class="col-span-full text-center py-16 text-on-surface-variant"><span class="material-symbols-outlined text-4xl block mb-3 opacity-50">search_off</span>No products match your search.</div>`;
      bindCardAddButtons(grid);
    }
    applyReveal();
  }

  function initShop() {
    const search = document.getElementById('searchInput');
    if (search) search.addEventListener('input', (e) => { shopState.q = e.target.value.toLowerCase(); renderShop(); });
    renderShop();
  }

  // ─── PAGE: PRODUCT DETAIL ─────────────────────────────────────
  let detailState = { qty: 1, opts: {}, gallery: 0 };

  function renderDetail() {
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get('id'), 10);
    const p = products.find(x => x.id === id);
    const root = document.getElementById('detailContent');
    if (!root) return;
    if (!p) {
      root.innerHTML = `
        <div class="text-center py-16">
          <p class="text-on-surface-variant mb-4">Product not found.</p>
          <a class="bg-primary text-on-primary px-6 py-3 rounded-full font-label text-label-sm uppercase tracking-widest" href="shop.html">Browse Collection</a>
        </div>`;
      return;
    }
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
            <div class="aspect-square bg-primary/5 rounded-md overflow-hidden flex items-center justify-center hover:bg-primary/10 transition">
              <span class="material-symbols-outlined text-primary text-4xl">play_circle</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 lg:sticky lg:top-32 reveal">
          <nav class="flex gap-2 text-on-surface-variant font-label text-label-sm mb-6 uppercase tracking-wider flex-wrap">
            <a class="hover:text-primary transition" href="shop.html">Shop</a>
            <span>/</span>
            <span class="capitalize">${p.category}</span>
            <span>/</span>
            <span class="text-primary font-bold truncate">${p.name}</span>
          </nav>
          <h1 class="font-display text-headline-md md:text-headline-lg text-primary mb-2">${p.name}</h1>
          <p class="font-display text-2xl md:text-headline-md text-secondary mb-6">${fmt(total)} <span class="text-base text-on-surface-variant font-normal">${CURRENCY.code}</span></p>
          <div class="botanical-divider mb-6"></div>
          <p class="font-body text-body-lg text-on-surface italic mb-4">"${p.tagline || ''}"</p>
          <p class="font-body text-body-md text-on-surface-variant leading-relaxed mb-8">${p.desc}</p>

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

          <div class="mb-6">
            <label class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mb-3 block">Wrapping Style</label>
            <div class="flex flex-wrap gap-2">
              ${p.wrapping.map((w, i) => `
                <button class="px-4 py-2 rounded-lg text-sm border transition ${detailState.opts.wrap === w ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:border-primary'}" data-wrap="${w}">
                  ${w}${i === 0 ? ` +${fmt(WRAP_BASIC)}` : i === 1 ? ` +${fmt(WRAP_LUX)}` : ''}
                </button>`).join('')}
            </div>
          </div>

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
            <button class="w-full border border-secondary text-secondary py-4 md:py-5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:bg-secondary/5 transition" id="personalizeBtn">
              Personalize with a Message
            </button>` : ''}
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

    // Bind events
    root.querySelectorAll('[data-gallery]').forEach(b => b.addEventListener('click', () => { detailState.gallery = parseInt(b.dataset.gallery, 10); renderDetail(); }));
    root.querySelectorAll('[data-wrap]').forEach(b => b.addEventListener('click', () => { detailState.opts.wrap = b.dataset.wrap; renderDetail(); }));
    root.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
      const d = parseInt(b.dataset.qty, 10);
      detailState.qty = Math.max(1, Math.min(p.stock, detailState.qty + d));
      renderDetail();
    }));
    const cardToggle = document.getElementById('cardToggle');
    if (cardToggle) cardToggle.addEventListener('click', () => { detailState.opts.card = !detailState.opts.card; renderDetail(); });
    const personalizeBtn = document.getElementById('personalizeBtn');
    if (personalizeBtn) personalizeBtn.addEventListener('click', () => {
      detailState.opts.card = true; renderDetail();
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

  function initProduct() {
    detailState = { qty: 1, opts: {}, gallery: 0 };
    renderDetail();
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
      cart[idx].qty = Math.max(1, Math.min(p.stock, cart[idx].qty + d));
      persistAll(); updateCartBadge(); renderCart();
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      cart.splice(parseInt(b.dataset.remove, 10), 1);
      persistAll(); updateCartBadge(); renderCart();
    }));
    applyReveal();
  }

  function initCart() { renderCart(); }

  // ─── PAGE: CHECKOUT ───────────────────────────────────────────
  let checkoutState = { pm: 'cash' };

  function initCheckout() {
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
            <div class="flex justify-between font-display text-2xl text-primary pt-3 border-t border-outline-variant/30">
              <span>Total</span><span>${fmt(subtotal + DELIVERY)}</span>
            </div>
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
    document.getElementById('placeOrderBtn').addEventListener('click', () => {
      const addr = document.getElementById('chkAddr').value;
      if (!addr) { toast('Please enter your address'); return; }
      const order = {
        id: 'ORD' + String(orders.length + 1).padStart(3, '0'),
        user: currentUser.email,
        items: [...cart],
        total: cart.reduce((s, i) => s + i.price * i.qty, 0) + DELIVERY,
        date: new Date().toLocaleDateString('tr-TR'),
        status: 'Processing',
        address: addr,
        payment: checkoutState.pm,
      };
      orders.unshift(order);
      currentUser.orders = currentUser.orders || [];
      currentUser.orders.unshift(order.id);
      const idx = users.findIndex(u => u.email === currentUser.email);
      if (idx > -1) users[idx] = currentUser;
      cart = [];
      persistAll();
      updateCartBadge();
      toast('Order placed — botanical poetry on its way ✿');
      setTimeout(() => location.href = 'orders.html', 800);
    });
    applyReveal();
  }

  // ─── PAGE: EVENTS / RESERVATION ───────────────────────────────
  let eventsSuccess = false;

  function renderEventForm() {
    const el = document.getElementById('reservationContent');
    if (!el) return;
    const bookedDates = reservations.map(r => r.date);
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
          <div class="flex flex-wrap gap-2">${bookedDates.map(d => `<span class="bg-primary text-on-primary text-xs px-3 py-1 rounded-full">${d}</span>`).join('')}</div>
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
        <button type="submit" class="w-full bg-primary text-on-primary py-5 rounded-lg font-label text-label-sm uppercase tracking-widest hover:bg-primary-container transition">Submit Inquiry for Review</button>
      </form>`;
    document.getElementById('rDate').addEventListener('change', (e) => {
      const dw = document.getElementById('dateWarning');
      if (bookedDates.includes(e.target.value)) {
        dw.innerHTML = `<div class="bg-error-container border border-error/30 rounded-lg p-3 text-sm text-on-error-container">⚠ This date is already booked. Please choose another.</div>`;
        e.target.value = '';
      } else dw.innerHTML = '';
    });
    document.getElementById('resForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rName').value;
      const date = document.getElementById('rDate').value;
      const email = document.getElementById('rEmail').value;
      if (!name || !date || !email) { toast('Please fill all required fields'); return; }
      if (bookedDates.includes(date)) { toast('Date already booked'); return; }
      reservations.push({
        id: 'RES' + String(reservations.length + 1).padStart(3, '0'),
        name, service: document.getElementById('rService').value, date,
        guests: document.getElementById('rGuests').value || '?',
        status: 'pending', notes: document.getElementById('rNotes').value,
      });
      persistAll();
      eventsSuccess = true;
      renderEventForm();
      const inquiry = document.getElementById('inquiry');
      if (inquiry) window.scrollTo({ top: inquiry.offsetTop - 80, behavior: 'smooth' });
    });
  }

  function initEvents() { renderEventForm(); }

  // ─── PAGE: AUTH ───────────────────────────────────────────────
  let authMode = 'login';

  function renderAuth() {
    const el = document.getElementById('authContent');
    if (!el) return;
    if (currentUser) {
      el.innerHTML = `
        <div class="max-w-md mx-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 md:p-10 reveal">
          <span class="material-symbols-outlined text-5xl text-primary mb-4 block text-center">spa</span>
          <h2 class="font-display text-headline-md text-primary text-center mb-2">Welcome, ${currentUser.name}</h2>
          <p class="text-center text-on-surface-variant mb-8">Logged in as ${currentUser.email}</p>
          <a class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition mb-3 block text-center" href="orders.html">My Orders</a>
          <button class="w-full border border-outline-variant/40 text-on-surface-variant py-3 rounded-lg font-label text-label-sm hover:border-primary hover:text-primary transition" id="logoutBtn">Logout</button>
        </div>`;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null; persistAll(); location.reload();
      });
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
        ${authMode === 'register' ? `<div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Full Name</label><input class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aName" placeholder="Your name"/></div>` : ''}
        <div class="mb-4"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Email</label><input type="email" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aEmail" placeholder="email@example.com"/></div>
        <div class="mb-6"><label class="font-label text-label-sm uppercase text-on-surface-variant block mb-2">Password</label><input type="password" class="w-full bg-surface-container-low border border-outline-variant/40 p-3 rounded-lg focus:outline-none focus:border-primary" id="aPass" placeholder="Enter password"/></div>
        <button class="w-full bg-primary text-on-primary py-4 rounded-lg font-label text-label-sm uppercase tracking-widest hover:opacity-90 transition" id="authSubmit">${authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <p class="text-center text-xs text-on-surface-variant mt-5">Demo admin: admin@flora.com / admin123</p>
      </div>`;
    el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { authMode = b.dataset.mode; renderAuth(); }));
    document.getElementById('authSubmit').addEventListener('click', () => {
      const email = document.getElementById('aEmail').value;
      const pass  = document.getElementById('aPass').value;
      if (authMode === 'login') {
        const u = users.find(u => u.email === email && u.password === pass);
        if (u) { currentUser = u; persistAll(); toast('Welcome back, ' + u.name); setTimeout(() => location.href = 'index.html', 600); }
        else toast('Invalid email or password');
      } else {
        const name = document.getElementById('aName').value;
        if (!name || !email || !pass) { toast('Please fill all fields'); return; }
        if (users.find(u => u.email === email)) { toast('Email already registered'); return; }
        const u = { id: users.length + 1, name, email, password: pass, role: 'user', orders: [] };
        users.push(u); currentUser = u; persistAll();
        toast('Welcome to Flora, ' + name);
        setTimeout(() => location.href = 'index.html', 600);
      }
    });
    applyReveal();
  }

  function initAuth() { renderAuth(); }

  // ─── PAGE: ORDERS ─────────────────────────────────────────────
  function initOrders() {
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
    const my = orders.filter(o => o.user === currentUser.email);
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
        <div class="flex items-center gap-2 mb-4">${o.items.map(i => `<img src="${i.image}" class="w-10 h-10 rounded-lg object-cover"/>`).join('')}</div>
        <p class="font-display text-xl text-secondary">${fmt(o.total)} ${CURRENCY.code}</p>
      </div>`).join('')}</div>`;
    applyReveal();
  }

  // ─── PAGE: ADMIN ──────────────────────────────────────────────
  let adminSection = 'dashboard';

  function renderAdmin() {
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
    document.querySelectorAll('.admin-tab').forEach(b => {
      const a = b.dataset.section === adminSection;
      b.classList.toggle('text-white', a); b.classList.toggle('bg-white/10', a);
      b.classList.toggle('border-l-4', a); b.classList.toggle('border-secondary-fixed', a);
    });
    const totalRev = orders.reduce((s, o) => s + o.total, 0);
    const tbl = (head, rows) => `<div class="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/30"><table class="w-full text-sm"><thead class="bg-tertiary text-tertiary-fixed-dim"><tr>${head.map(h => `<th class="text-left px-4 py-3 font-label text-label-sm uppercase tracking-widest">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
    const sections = {
      dashboard: `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          ${[['shopping_cart', orders.length, 'Orders'], ['payments', fmt(totalRev), 'Revenue'], ['event', reservations.length, 'Reservations'], ['group', users.length, 'Users']].map(([ic,v,l]) => `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5">
              <span class="material-symbols-outlined text-secondary text-2xl mb-3 block">${ic}</span>
              <p class="font-display text-2xl text-primary">${v}</p>
              <p class="font-label text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">${l}</p>
            </div>`).join('')}
        </div>
        <h3 class="font-display text-headline-md text-primary mb-4">Recent Orders</h3>
        ${orders.length
          ? tbl(['ID','User','Total','Date','Status'], orders.slice(0,5).map(o => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${o.id}</td><td class="px-4 py-3">${o.user}</td><td class="px-4 py-3 text-secondary font-semibold">${fmt(o.total)}</td><td class="px-4 py-3">${o.date}</td><td class="px-4 py-3"><span class="bg-success-container text-success px-2 py-1 rounded-full text-[10px] uppercase tracking-widest">${o.status}</span></td></tr>`).join(''))
          : '<p class="text-on-surface-variant">No orders yet.</p>'}`,
      aproducts: `
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
        ${tbl(['','Name','Category','Price','Stock','Action'], products.map(p => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3"><img src="${p.image}" class="w-10 h-10 rounded-lg object-cover"/></td><td class="px-4 py-3">${p.name}</td><td class="px-4 py-3 capitalize">${p.category}</td><td class="px-4 py-3 text-secondary">${fmt(p.price)}</td><td class="px-4 py-3">${p.stock}</td><td class="px-4 py-3"><button class="text-error text-xs hover:underline" data-del="${p.id}">Remove</button></td></tr>`).join(''))}`,
      aorders: tbl(['ID','User','Total','Date','Address','Payment','Status'],
        orders.length
          ? orders.map(o => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${o.id}</td><td class="px-4 py-3">${o.user}</td><td class="px-4 py-3 text-secondary">${fmt(o.total)}</td><td class="px-4 py-3">${o.date}</td><td class="px-4 py-3 max-w-[160px] truncate">${o.address}</td><td class="px-4 py-3">${o.payment || 'cash'}</td><td class="px-4 py-3"><select class="bg-surface-container-low border border-outline-variant/40 rounded-md px-2 py-1 text-xs" data-status="${o.id}">${['Processing','Shipped','Delivered'].map(s => `<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')
          : '<tr><td colspan="7" class="text-center px-4 py-12 text-on-surface-variant">No orders yet.</td></tr>'),
      aresv: tbl(['ID','Client','Service','Date','Guests','Notes','Status'],
        reservations.map(r => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${r.id}</td><td class="px-4 py-3">${r.name}</td><td class="px-4 py-3">${r.service}</td><td class="px-4 py-3">${r.date}</td><td class="px-4 py-3">${r.guests}</td><td class="px-4 py-3 text-xs text-on-surface-variant max-w-[160px]">${r.notes}</td><td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest ${r.status==='confirmed'?'bg-success-container text-success':'bg-secondary-fixed text-on-secondary-container'}">${r.status}</span></td></tr>`).join('')),
      ausers: tbl(['ID','Name','Email','Role','Orders'],
        users.map(u => `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 font-mono text-xs">${u.id}</td><td class="px-4 py-3">${u.name}</td><td class="px-4 py-3">${u.email}</td><td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest ${u.role==='admin'?'bg-secondary-fixed text-on-secondary-container':'bg-primary-fixed text-primary'}">${u.role}</span></td><td class="px-4 py-3">${(u.orders||[]).length}</td></tr>`).join('')),
    };
    el.innerHTML = sections[adminSection] || sections.dashboard;

    if (adminSection === 'aproducts') {
      document.getElementById('addProductBtn').addEventListener('click', () => {
        const name = document.getElementById('apName').value;
        const price = parseInt(document.getElementById('apPrice').value, 10);
        if (!name || !price) { toast('Fill name and price'); return; }
        products.push({
          id: Date.now(), name, tagline: 'A new bloom in our gallery',
          category: document.getElementById('apCat').value, price,
          image: document.getElementById('apImage').value || IMG.wildflower,
          desc: document.getElementById('apDesc').value || 'A beautiful product.',
          wrapping: ['Classic Wrap','Luxury Wrap','No Wrapping'],
          card: true,
          stock: parseInt(document.getElementById('apStock').value, 10) || 10,
        });
        persistAll();
        toast('Product added');
        renderAdmin();
      });
      el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
        if (!confirm('Remove this product?')) return;
        products = products.filter(p => p.id !== parseInt(b.dataset.del, 10));
        persistAll(); toast('Product removed'); renderAdmin();
      }));
    }
    if (adminSection === 'aorders') {
      el.querySelectorAll('[data-status]').forEach(s => s.addEventListener('change', () => {
        const o = orders.find(x => x.id === s.dataset.status);
        if (o) { o.status = s.value; persistAll(); }
      }));
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

  function boot() {
    injectLayout();
    setupDrawer();
    updateCartBadge();
    const page = document.body.dataset.page;
    const init = { home:initHome, shop:initShop, product:initProduct, cart:initCart, checkout:initCheckout, events:initEvents, auth:initAuth, orders:initOrders, admin:initAdmin }[page];
    if (init) init();
    applyReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose minimal API for inline onclicks if needed
  window.Flora = { addToCart, fmt, toast };
})();
