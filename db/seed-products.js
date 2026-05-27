/**
 * Product catalog — premium Pexels photos matched to each product name.
 * Images refresh on deploy via server.js (UPDATE by product name).
 */
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500&fit=crop`;

module.exports = [
  {
    name: 'Romantic Rose Bouquet',
    tagline: 'Velvet Petals & Poetry',
    category: 'flowers',
    price: 1500,
    image: px(1523528), // premium red rose bouquet
    desc: 'A classic arrangement of 24 premium red roses, symbolizing deep love and passion. Each stem is hand-selected for optimal freshness.',
    wrapping: ['Classic Wrap', 'Luxury Velvet', 'Kraft Paper'],
    card: true,
    stock: 15,
  },
  {
    name: 'Spring Wildflowers',
    tagline: 'Pastel Harmony & Light',
    category: 'flowers',
    price: 1200,
    image: px(931176), // mixed pastel wildflower meadow bouquet
    desc: "A vibrant mix of seasonal wildflowers — tulips, daisies, ranunculus, and baby's breath — capturing the spirit of spring.",
    wrapping: ['Natural Twine', 'Pastel Ribbon', 'No Wrapping'],
    card: true,
    stock: 10,
  },
  {
    name: 'Orchid Elegance',
    tagline: 'Deep Burgundy Majesty',
    category: 'flowers',
    price: 2200,
    image: px(1366631), // phalaenopsis orchid close-up
    gallery: [px(1366631), px(4041392), px(4041391), px(1126993)],
    desc: 'Hand-selected orchids with depth of color and structural perfection.',
    wrapping: ['Gift Box', 'Open Vase', 'Ribbon Only'],
    card: true,
    stock: 8,
    attributes: [
      { icon: 'light_mode', label: 'Lighting', value: 'Indirect Light' },
      { icon: 'opacity', label: 'Watering', value: 'Once Weekly' },
    ],
    care: [
      { icon: 'light_mode', title: 'Morning Whispers', text: 'Bright, indirect light is best.' },
      { icon: 'water_drop', title: 'The Weekly Ritual', text: 'Water once weekly; drain fully after soaking.' },
    ],
  },
  {
    name: 'Sunflower Sunshine',
    tagline: 'Radiant Golden Fields',
    category: 'flowers',
    price: 950,
    image: px(1022923), // bright sunflower bouquet
    desc: 'Bright sunflowers with eucalyptus and cream chamomile.',
    wrapping: ['Burlap Wrap', 'Yellow Ribbon', 'No Wrapping'],
    card: true,
    stock: 20,
  },
  {
    name: 'Luxury Gift Hamper',
    tagline: 'A Curated Indulgence',
    category: 'gifts',
    price: 3200,
    image: px(4195325), // luxury gift basket with treats
    desc: 'Chocolates, nuts, honey, scented candle, and a petite bouquet.',
    wrapping: ['Gift Basket', 'Wooden Crate', 'Premium Box'],
    card: true,
    stock: 6,
  },
  {
    name: 'Chocolate & Roses',
    tagline: 'Sweet Romance',
    category: 'gifts',
    price: 1800,
    image: px(3228980), // roses with romantic gift presentation
    desc: 'Red roses with handcrafted Belgian chocolates in a velvet-lined box.',
    wrapping: ['Red Velvet Box', 'Gold Ribbon Box', 'Simple Wrap'],
    card: true,
    stock: 12,
  },
  {
    name: 'Scented Candle Set',
    tagline: 'Sandalwood & White Orchid',
    category: 'gifts',
    price: 1300,
    image: px(1024960), // luxury scented candles
    desc: 'Three luxury soy candles in rose, jasmine, and oud.',
    wrapping: ['Linen Bag', 'Gift Box', 'No Wrapping'],
    card: false,
    stock: 18,
  },
  {
    name: 'Wedding Centerpiece',
    tagline: 'Symphony of Whites',
    category: 'wedding',
    price: 5000,
    image: px(265940), // white roses wedding table centerpiece
    desc: 'Grand centerpiece with white roses, peonies, and greenery.',
    wrapping: ['As-is', 'With Stand', 'Floating Design'],
    card: false,
    stock: 5,
  },
  {
    name: 'Bridal Bouquet',
    tagline: 'A Cascade of Romance',
    category: 'wedding',
    price: 4000,
    image: px(2253871), // white bridal bouquet
    desc: 'Bespoke bridal bouquet with ribbon cascade finish.',
    wrapping: ['Satin Ribbon', 'Lace Wrap', 'Pearl Pins'],
    card: false,
    stock: 4,
  },
  {
    name: 'Terra Ceramic Vase',
    tagline: 'Hand-Thrown Stoneware',
    category: 'gifts',
    price: 750,
    image: px(114895), // minimalist ceramic vase
    desc: 'Minimalist stoneware vase in earthy neutral tones.',
    wrapping: ['Wooden Tray', 'Gift Box', 'No Wrapping'],
    card: false,
    stock: 25,
  },
  {
    name: 'Lavender Dreams',
    tagline: 'A Quiet Reverie',
    category: 'flowers',
    price: 1100,
    image: px(3297347), // lavender field bouquet
    desc: 'Lavender, white roses, and sage for a serene atmosphere.',
    wrapping: ['Kraft Paper', 'Linen Bundle', 'No Wrapping'],
    card: true,
    stock: 14,
  },
  {
    name: 'Birthday Bloom Box',
    tagline: 'A Joyful Celebration',
    category: 'gifts',
    price: 2400,
    image: px(931174), // vibrant mixed birthday bouquet
    desc: 'Seasonal flowers, balloon, sparkler candle, and personal card.',
    wrapping: ['Signature Box', 'Pink Box', 'Gold Box'],
    card: true,
    stock: 9,
  },
  {
    name: 'Peony Blush Garden',
    tagline: 'Soft Romance in Bloom',
    category: 'flowers',
    price: 1850,
    image: px(3607565), // blush pink peonies
    desc: 'Blush peonies with garden roses and eucalyptus.',
    wrapping: ['Silk Ribbon', 'Velvet Wrap', 'Gift Box'],
    card: true,
    stock: 11,
  },
  {
    name: 'Midnight Tulip Trio',
    tagline: 'Deep Hues & Grace',
    category: 'flowers',
    price: 1350,
    image: px(1126926), // deep purple tulips
    desc: 'Premium tulips hand-tied with seasonal greenery.',
    wrapping: ['Kraft Paper', 'Classic Wrap', 'No Wrapping'],
    card: true,
    stock: 16,
  },
  {
    name: 'Citrus & Bloom',
    tagline: 'Fresh Zest & Petals',
    category: 'flowers',
    price: 1050,
    image: px(1457820), // orange marigold / citrus-toned blooms
    desc: 'Citrus-toned blooms with chamomile accents.',
    wrapping: ['Natural Twine', 'Pastel Ribbon', 'No Wrapping'],
    card: true,
    stock: 18,
  },
  {
    name: 'Artisan Tea & Bloom',
    tagline: 'Sip & Savor',
    category: 'gifts',
    price: 1650,
    image: px(230477), // tea service with botanical styling
    desc: 'Botanical tea set with a petite bouquet and card.',
    wrapping: ['Gift Box', 'Linen Wrap', 'No Wrapping'],
    card: true,
    stock: 14,
  },
  {
    name: 'Velvet Jewelry Box Rose',
    tagline: 'Keepsake Romance',
    category: 'gifts',
    price: 2100,
    image: px(2878405), // preserved rose in gift box
    desc: 'Preserved rose in a velvet jewelry box.',
    wrapping: ['Velvet Box', 'Gold Box', 'Ribbon Only'],
    card: true,
    stock: 10,
  },
  {
    name: 'Garden Party Centerpiece',
    tagline: 'Tabletop Poetry',
    category: 'wedding',
    price: 3800,
    image: px(168831), // pastel garden table florals
    desc: 'Low lush centerpiece in pastels for intimate receptions.',
    wrapping: ['As-is', 'With Stand', 'Floating Design'],
    card: false,
    stock: 7,
  },
  {
    name: 'Mini Succulent Grove',
    tagline: 'Desert Calm',
    category: 'gifts',
    price: 890,
    image: px(941555), // succulent plants in pots
    desc: 'Three succulents in ceramic pots with care guide.',
    wrapping: ['Wooden Tray', 'Gift Box', 'No Wrapping'],
    card: true,
    stock: 22,
  },
  {
    name: 'Hydrangea Cloud',
    tagline: 'Billowing Blues & Whites',
    category: 'flowers',
    price: 1750,
    image: px(4207730), // blue hydrangea blooms
    desc: 'Hydrangea clusters with white roses and dusty miller.',
    wrapping: ['Classic Wrap', 'Silk Ribbon', 'Gift Box'],
    card: true,
    stock: 12,
  },
  {
    name: 'Rose Gold Anniversary',
    tagline: 'Twenty-Five Years of Love',
    category: 'gifts',
    price: 2900,
    image: px(1453243), // soft peach / blush roses
    desc: 'Blush roses, champagne truffles, and a rose-gold vase.',
    wrapping: ['Luxury Velvet', 'Gold Box', 'Ribbon Only'],
    card: true,
    stock: 8,
  },
  {
    name: 'Ceremony Aisle Petals',
    tagline: 'A Path of Petals',
    category: 'wedding',
    price: 2200,
    image: px(265722), // rose petals on wedding aisle
    desc: 'Rose and hydrangea petals for aisle scatter.',
    wrapping: ['As-is', 'Basket Delivery', 'Ribbon Bundle'],
    card: false,
    stock: 10,
  },
  {
    name: 'Sympathy White Lilies',
    tagline: 'Gentle Remembrance',
    category: 'flowers',
    price: 1400,
    image: px(969914), // white lily arrangement
    desc: 'White lilies and eucalyptus in a muted wrap.',
    wrapping: ['Ivory Wrap', 'Simple Ribbon', 'No Wrapping'],
    card: true,
    stock: 15,
  },
];
