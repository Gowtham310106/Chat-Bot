// Initial catalogue and store content, written to data/db.json on first run.

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const stock = (n) => Object.fromEntries(SIZES.map((s, i) => [s, Math.max(0, n - i * 2)]));

const product = (id, slug, name, price, color, category, description, extra = {}) => ({
  id,
  slug,
  name,
  price,
  compareAtPrice: null,
  color,
  category,
  description,
  details: ['220 GSM heavyweight cotton', 'Screen-printed graphic', 'Regular fit — size up for oversized', 'Machine wash cold, inside out'],
  images: [`/images/products/${slug}-front.jpg`, `/images/products/${slug}-back.jpg`],
  sizes: SIZES,
  stock: stock(14),
  featured: false,
  active: true,
  createdAt: new Date(Date.UTC(2026, 8, 1 + id.length)).toISOString(),
  ...extra,
});

export const seedProducts = () => [
  product('p1', 'elite-core-tee', 'Elite Core Tee', 35, 'Black', 'Essentials',
    'The signature. A bold ELITE wordmark printed across the chest on a heavyweight black tee.', { featured: true }),
  product('p2', 'no-days-off-tee', 'No Days Off Tee', 38, 'White', 'Typography',
    'Stacked statement type for the ones who show up anyway. Crisp black ink on a clean white body.', { featured: true }),
  product('p3', 'iron-club-oversized', 'Iron Club Oversized', 45, 'Ash', 'Oversized',
    'Members-only badge print on a boxy, dropped-shoulder ash tee. Built for the warm-up and the walk home.', { featured: true, compareAtPrice: 55 }),
  product('p4', 'system-grid-tee', 'System Grid Tee', 38, 'White', 'Graphic',
    'A modular grid graphic inspired by training blocks and progressive overload.'),
  product('p5', 'fuel-lift-repeat-tee', 'Fuel / Lift / Repeat', 38, 'Black', 'Typography',
    'Three words, one routine. Tonal type that fades in as you read it.', { featured: true }),
  product('p6', 'monochrome-stripe-tee', 'Monochrome Stripe Tee', 35, 'White', 'Graphic',
    'Graduated stripes printed edge to edge. Minimal from afar, detailed up close.'),
  product('p7', 'heavy-lifting-tee', 'Heavy Lifting Dept.', 40, 'Black', 'Graphic',
    'A barbell icon and department-style type, printed in bright white on black.'),
  product('p8', 'athletics-arch-tee', 'Athletics Arch Tee', 42, 'Ash', 'Essentials',
    'Collegiate arch lettering with an oversized E monogram. Est. 2024.'),
];

export const seedSettings = () => ({
  storeName: 'ELITE',
  tagline: 'Printed shirts for people who train.',
  announcement: 'Free shipping on orders over $75',
  currency: 'USD',
  currencySymbol: '$',
  shippingFlat: 6,
  freeShippingThreshold: 75,
  contactEmail: 'hello@example.com',
  instagramUrl: 'https://www.instagram.com/elitesportsnutrition.il/',
  hero: {
    image: '/images/hero.jpg',
    eyebrow: 'New drop — Season 01',
    title: 'Printed for\nthe grind.',
    subtitle: 'Heavyweight tees with bold prints. Made to train in, made to be seen in.',
    ctaLabel: 'Shop the drop',
    ctaLink: '/shop',
  },
  videosSection: {
    title: 'In motion',
    subtitle: 'See the prints up close — straight from our feed.',
  },
  videos: [
    { id: 'v1', title: 'The Drop — 01', caption: 'Unboxing the Season 01 collection.', type: 'none', src: '', poster: '/images/video-poster-1.jpg' },
    { id: 'v2', title: 'On the Floor — 02', caption: 'Worn in training. Built to last.', type: 'none', src: '', poster: '/images/video-poster-2.jpg' },
  ],
  about: {
    title: 'Made to train in. Made to last.',
    body: 'We design and print heavyweight tees for training and everyday wear. Every design is screen printed in small batches so the ink sits right and the shirt holds its shape — rep after rep, wash after wash.',
  },
});

export const seedCatalog = () => ({
  products: seedProducts(),
  settings: seedSettings(),
});

// Earlier default copy implied the shop only sells black and white shirts (black and white is just the
// site's theme). Stores still holding those untouched defaults get the corrected text.
const OUTDATED_COPY = [
  ['hero', 'subtitle', 'Heavyweight tees with bold, black-and-white prints. Made to train in, made to be seen in.', 'Heavyweight tees with bold prints. Made to train in, made to be seen in.'],
  ['about', 'title', 'Black. White. Nothing in between.', 'Made to train in. Made to last.'],
  ['about', 'body', 'We print a small range of heavyweight tees in two colours and a lot of conviction. Every design is screen printed in small batches so the ink sits right and the shirt holds its shape — rep after rep, wash after wash.', 'We design and print heavyweight tees for training and everyday wear. Every design is screen printed in small batches so the ink sits right and the shirt holds its shape — rep after rep, wash after wash.'],
];

export function upgradeDefaultCopy(settings) {
  for (const [section, key, from, to] of OUTDATED_COPY) {
    if (settings?.[section]?.[key] === from) settings[section][key] = to;
  }
}
