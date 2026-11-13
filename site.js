// Everything that turns Begad's product feed into pages. Shared by the
// browser (app.js) and the page builder (tools/build.mjs), so a page that
// was built ahead of time and the same page drawn in the browser are
// identical. No DOM access in this file.

export const SITE = 'https://vidvie.ae';
export const CATALOG_API = 'https://begad.ae/api/agent/prices?brand=vidvie&details=1';
export const WHATSAPP = '97148356358';
export const PHONE_DISPLAY = '+971 4 835 6358';
export const EMAIL = 'contact@begad.ae';
export const PAGE_SIZE = 24;

// Departments and their categories. The third item of each category is the
// list of Begad category names that belong to it (compared without case).
// A Begad category that is not listed lands in "More".
export const DEPARTMENTS = [
  { slug: 'charging', name: 'Charging', icon: 'bolt', subs: [
    ['power-banks', 'Power Banks', ['Power Banks']],
    ['wall-chargers', 'Wall Chargers', ['Wall Chargers', 'Chargers', 'extensions & Plugs', 'Adapters']],
    ['car-chargers', 'Car Chargers', ['Car Chargers', 'Car Electronics']],
    ['wireless-chargers', 'Wireless Chargers', ['Wireless Chargers']],
    ['cables', 'Cables', ['Cables']]
  ] },
  { slug: 'audio', name: 'Audio', icon: 'headphones', subs: [
    ['headphones', 'Headphones', ['Headphones']],
    ['earbuds', 'Earbuds', ['Earbuds', 'neckbands']],
    ['speakers', 'Speakers', ['Bluetooth Speakers', 'Speakers']],
    ['gaming-headsets', 'Gaming Headsets', ['Gaming Headsets']],
    ['microphones', 'Microphones', ['Microphones']]
  ] },
  { slug: 'smart-watches', name: 'Smart Watches', icon: 'watch', subs: [
    ['smart-watches', 'Smart Watches', ['Smart Watches']]
  ] },
  { slug: 'computer', name: 'Computer & Storage', icon: 'laptop', subs: [
    ['keyboards', 'Keyboards', ['Keyboards']],
    ['mice', 'Mice', ['Mouse']],
    ['usb-hubs', 'USB Hubs', ['USB Hubs & Docking']],
    ['flash-drives', 'Flash Drives', ['USB Flash Drives', 'External Storage']],
    ['memory-cards', 'Memory Cards', ['Memory Cards']],
    ['stylus-pens', 'Stylus Pens', ['Stylus Pens']],
    ['laptop-bags', 'Laptop Bags', ['Laptop Bags', 'Bags & Luggage']]
  ] },
  { slug: 'car-phone', name: 'Car & Phone', icon: 'car', subs: [
    ['car-mounts', 'Car Mounts', ['Car Mounts']],
    ['phone-holders', 'Phone Holders', ['Mounts & Holders']],
    ['phone-cases', 'Phone Cases', ['Phone Cases & Covers', 'Mobile Accessories']],
    ['car-care', 'Car Care', ['Car Care & Cleaning', 'Car Accessories']]
  ] },
  { slug: 'home-care', name: 'Home & Personal Care', icon: 'home', subs: [
    ['fans', 'Fans', ['Fans']],
    ['hair-care', 'Hair Care', ['Hair Tools', 'Hair Dryers & Stylers']],
    ['grooming', 'Grooming', ['Grooming Kits']],
    ['oral-care', 'Oral Care', ['Electric Toothbrush', 'Dental Care']],
    ['projectors', 'Projectors & TV', ['Projectors', 'Streaming Devices']],
    ['lighting', 'Lighting', ['Lighting']],
    ['tools', 'Tools & Wellness', ['Tools & Equipment', 'Wellness']]
  ] },
  { slug: 'more', name: 'More', icon: 'grid', subs: [
    ['other', 'Other', []]
  ] }
];

const PLACE = {};
DEPARTMENTS.forEach(d => d.subs.forEach(([slug, name, cats]) => {
  cats.forEach(c => { PLACE[c.toLowerCase()] = { dept: d.slug, sub: slug }; });
}));

export const deptBySlug = slug => DEPARTMENTS.find(d => d.slug === slug) || null;
export const subOf = (dept, slug) => {
  const s = dept && dept.subs.find(x => x[0] === slug);
  return s ? { slug: s[0], name: s[1] } : null;
};

// Begad product ids shown first in "Recommended" order
const FEATURED_IDS = [10001862, 10001858, 10001919, 10002252, 10001859, 10002258];

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const money = n => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// VIDVIE model code inside a product name ("... PLB170 ..."), '' if none.
// Charging specs such as PD30W or QC18W look similar and are skipped.
export function modelOf(name) {
  const found = name.match(/\b(?:XL-)?[A-Z]{2,4}\d{2,5}(?:[A-Z0-9]|[&-](?=[A-Za-z0-9]))*/g) || [];
  const model = found.find(m => !/^(?:PD|QC)\d/.test(m) && !/\d(?:W|MAH)$/.test(m));
  return model ? model.replace(/[&-]$/, '') : '';
}

// Begad's product slug from its URL (begad.ae/product/<slug>)
export function slugOf(item) {
  const m = String(item.url || '').match(/\/product\/([^/?#]+)/);
  if (m) return m[1];
  return String(item.name || item.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || String(item.id);
}

// Names on Begad are long and often repeat the brand; the cards show them
// without a leading "VIDVIE".
export const shortName = name => name.replace(/^\s*vidvie\s+/i, '').trim();

// One item of Begad's feed -> the product the pages work with
export function toProduct(item) {
  const price = item.price || {};
  const amount = Number(price.amount) || 0;
  const withTax = Number(price.amount_with_tax) || amount;
  const compareAt = Number(price.compare_at_amount) || 0;
  const name = String(item.name || '').trim();
  const place = PLACE[String(item.category || '').toLowerCase()] || { dept: 'more', sub: 'other' };
  return {
    id: Number(item.id),
    sku: String(item.sku || ''),
    name,
    title: shortName(name),
    model: modelOf(name),
    slug: slugOf(item),
    begadCategory: String(item.category || ''),
    dept: place.dept,
    sub: place.sub,
    thumb: item.thumb || item.image || '',
    image: item.image || item.thumb || '',
    begadUrl: item.url || `https://begad.ae/search?q=${encodeURIComponent(name)}`,
    price: withTax,
    // compare_at is on the same basis as "amount"; bring it to the VAT-inclusive basis too
    was: compareAt > amount && amount > 0 ? Math.round(compareAt * (withTax / amount) * 100) / 100 : 0,
    inStock: item.in_stock !== false
  };
}

export const discountOf = p => (p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0);

// Featured first, out of stock last, otherwise Begad's order (newest first)
export function buildCatalog(items) {
  const list = items.map(toProduct).filter(p => p.name && p.price > 0);
  const rank = p => {
    const f = FEATURED_IDS.indexOf(p.id);
    return (p.inStock ? 0 : 1000) + (f === -1 ? 500 : f);
  };
  return list.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i).map(x => x.p);
}

export function deptCounts(products) {
  const out = {};
  products.forEach(p => {
    out[p.dept] = out[p.dept] || { total: 0, subs: {} };
    out[p.dept].total++;
    out[p.dept].subs[p.sub] = (out[p.dept].subs[p.sub] || 0) + 1;
  });
  return out;
}

// ---------------------------------------------------------------- icons

const ICONS = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  watch: '<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-4h4l1 4M9 18l1 4h4l1-4M12 9v3l2 1"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M5 12h14"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  return: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
};
export const icon = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// ---------------------------------------------------------------- links

export const productHref = p => `/p/${p.slug}/`;
export const deptHref = d => `/c/${d}/`;
export const subHref = (d, s) => `/c/${d}/${s}/`;

// A product that has no page of its own yet (new on Begad since the last
// build) links to Begad instead of a page that does not exist.
export const cardHref = (p, built) => (!built || built.has(p.id) ? productHref(p) : p.begadUrl);

// ---------------------------------------------------------------- pieces

export function priceHtml(p, big = false) {
  const off = big ? discountOf(p) : 0; // cards show the discount as a badge on the photo
  return `<div class="price${big ? ' price-big' : ''}">
    <span class="price-now"><small>AED</small> ${money(p.price)}</span>
    ${p.was > p.price ? `<span class="price-was">AED ${money(p.was)}</span>` : ''}${off ? `<span class="price-off">${off}% off</span>` : ''}
  </div>`;
}

export function cardHtml(p, built) {
  const off = discountOf(p);
  const href = esc(cardHref(p, built));
  const external = built && !built.has(p.id);
  return `<article class="card${p.inStock ? '' : ' is-out'}">
  <a class="card-link" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>
    <span class="card-img">
      ${off ? `<span class="badge-off">-${off}%</span>` : ''}
      <img src="${esc(p.thumb)}" alt="${esc(p.title)}" loading="lazy" width="400" height="400" />
    </span>
    <span class="card-name">${esc(p.title)}</span>
  </a>
  ${priceHtml(p)}
  <div class="card-foot">
    <span class="card-stock">${p.inStock ? '' : 'Out of stock'}</span>
    <button class="add-btn" type="button" data-add="${p.id}" ${p.inStock ? '' : 'disabled'} aria-label="Add ${esc(p.title)} to bag">${icon('bag', 'ico ico-sm')}<span>Add</span></button>
  </div>
</article>`;
}

export function railHtml(title, href, list, built, linkText = 'View all') {
  if (!list.length) return '';
  return `<section class="rail">
  <div class="rail-head"><h2>${esc(title)}</h2>${href ? `<a href="${esc(href)}">${esc(linkText)} ${icon('chevron', 'ico ico-sm')}</a>` : ''}</div>
  <div class="rail-track">${list.map(p => cardHtml(p, built)).join('')}</div>
</section>`;
}

function breadcrumb(parts) {
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts.map(([label, href], i) =>
    i < parts.length - 1 && href ? `<a href="${esc(href)}">${esc(label)}</a>${icon('chevron', 'ico ico-xs')}` : `<span>${esc(label)}</span>`
  ).join('')}</nav>`;
}

// ---------------------------------------------------------------- header

export function deptNavHtml(products, active = '') {
  const counts = deptCounts(products);
  const items = DEPARTMENTS.filter(d => counts[d.slug]).map(d =>
    `<a class="${d.slug === active ? 'on' : ''}" href="${deptHref(d.slug)}">${esc(d.name)}</a>`);
  const deals = products.some(p => p.inStock && discountOf(p) > 0)
    ? `<a class="deals${active === 'deals' ? ' on' : ''}" href="/deals/">${icon('tag', 'ico ico-sm')}Deals</a>` : '';
  return `<a class="${active === 'all' ? 'on' : ''}" href="/products/">All products</a>${deals}${items.join('')}<a class="${active === 'wholesale' ? 'on' : ''}" href="/wholesale/">Wholesale</a>`;
}

// ---------------------------------------------------------------- home

export function homeHtml(products, built) {
  const counts = deptCounts(products);
  const inStock = products.filter(p => p.inStock);
  const deals = inStock.filter(p => discountOf(p) > 0).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 16);
  const tiles = [];
  DEPARTMENTS.forEach(d => d.subs.forEach(([slug, name]) => {
    const n = counts[d.slug] && counts[d.slug].subs[slug];
    if (!n || d.slug === 'more') return;
    const sample = products.find(p => p.dept === d.slug && p.sub === slug && p.inStock) || products.find(p => p.dept === d.slug && p.sub === slug);
    tiles.push({ d, slug, name, n, sample });
  }));
  tiles.sort((a, b) => b.n - a.n);
  tiles.splice(18); // two rows; the rest are a click away under "All products"

  const rails = DEPARTMENTS.filter(d => d.slug !== 'more' && counts[d.slug]).map(d =>
    railHtml(d.name, deptHref(d.slug), inStock.filter(p => p.dept === d.slug).slice(0, 12), built)).join('');

  return `<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Official VIDVIE store · UAE</p>
    <h1>Chargers, audio and smart gadgets from VIDVIE</h1>
    <p>Every VIDVIE product sold in the UAE, at UAE prices, shipped from our Dubai warehouse with a 12-month local warranty.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="/products/">Shop all ${products.length} products</a>
      ${deals.length ? '<a class="btn btn-ghost" href="/deals/">See today\'s deals</a>' : ''}
    </div>
  </div>
  <div class="hero-art" aria-hidden="true">
    <img class="art art-1" src="/assets/hero/090.webp" alt="" width="560" height="460" fetchpriority="high" />
    <img class="art art-2" src="/assets/hero/078.webp" alt="" width="383" height="560" />
    <img class="art art-3" src="/assets/hero/050.webp" alt="" width="506" height="560" />
    <img class="art art-4" src="/assets/hero/044.webp" alt="" width="334" height="560" />
  </div>
</section>

${promiseHtml()}

<section class="block">
  <div class="rail-head"><h2>Shop by category</h2><a href="/products/">All products ${icon('chevron', 'ico ico-sm')}</a></div>
  <div class="tiles">${tiles.map(t => `<a class="tile" href="${t.d.subs.length > 1 ? subHref(t.d.slug, t.slug) : deptHref(t.d.slug)}">
    <span class="tile-img"><img src="${esc(t.sample.thumb)}" alt="" loading="lazy" width="400" height="400" /></span>
    <span class="tile-name">${esc(t.name)}</span><span class="tile-count">${t.n} item${t.n === 1 ? '' : 's'}</span></a>`).join('')}</div>
</section>

${railHtml('Deals', '/deals/', deals, built, 'All deals')}
${rails}
${railHtml('New arrivals', '/products/?sort=new', inStock.slice().sort((a, b) => b.id - a.id).slice(0, 12), built)}

<section class="b2b-band">
  <div><h2>Buying for a shop or a company?</h2><p>Wholesale prices for retailers, telecom stores and corporate gifts, with stock in Dubai.</p></div>
  <a class="btn btn-dark" href="/wholesale/">Wholesale enquiry</a>
</section>`;
}

export function promiseHtml() {
  return `<ul class="promise">
  <li>${icon('shield')}<div><b>Genuine VIDVIE</b><span>Official UAE distributor</span></div></li>
  <li>${icon('truck')}<div><b>Ships from Dubai</b><span>Delivery across the UAE</span></div></li>
  <li>${icon('check')}<div><b>12-month warranty</b><span>Replaced here in the UAE</span></div></li>
  <li>${icon('card')}<div><b>Card, Apple Pay, Tabby, cash</b><span>Pay the way you prefer</span></div></li>
</ul>`;
}

// ---------------------------------------------------------------- listings

// view: { kind: 'all'|'dept'|'deals'|'search', dept, sub, q }
// opts: { sort, min, max, stock, sale, limit }  (from the address bar)
export function listingView(products, view, opts) {
  let base = products;
  const dept = view.dept ? deptBySlug(view.dept) : null;
  if (dept) base = base.filter(p => p.dept === dept.slug);
  if (view.kind === 'deals') base = base.filter(p => discountOf(p) > 0);
  if (view.kind === 'search') {
    const words = String(view.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    base = words.length ? base.filter(p => {
      const hay = `${p.name} ${p.model} ${p.sku} ${p.id} ${p.begadCategory}`.toLowerCase();
      return words.every(w => hay.includes(w));
    }) : [];
  }
  const facetBase = base;
  let list = base;
  if (view.sub) list = list.filter(p => p.sub === view.sub);
  if (opts.stock) list = list.filter(p => p.inStock);
  if (opts.sale) list = list.filter(p => discountOf(p) > 0);
  if (opts.min > 0) list = list.filter(p => p.price >= opts.min);
  if (opts.max > 0) list = list.filter(p => p.price <= opts.max);
  list = list.slice();
  const stockFirst = (a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1);
  if (opts.sort === 'price-asc') list.sort((a, b) => stockFirst(a, b) || a.price - b.price);
  else if (opts.sort === 'price-desc') list.sort((a, b) => stockFirst(a, b) || b.price - a.price);
  else if (opts.sort === 'new') list.sort((a, b) => stockFirst(a, b) || b.id - a.id);
  else if (opts.sort === 'discount') list.sort((a, b) => stockFirst(a, b) || discountOf(b) - discountOf(a));
  else if (view.kind === 'deals') list.sort((a, b) => stockFirst(a, b) || discountOf(b) - discountOf(a));
  return { list, facetBase, dept };
}

export function listingTitle(view) {
  const dept = view.dept ? deptBySlug(view.dept) : null;
  const sub = dept && view.sub ? subOf(dept, view.sub) : null;
  if (view.kind === 'search') return view.q ? `Results for “${view.q}”` : 'Search';
  if (view.kind === 'deals') return 'Deals';
  if (sub && dept.subs.length > 1) return `VIDVIE ${sub.name}`;
  if (dept) return `VIDVIE ${dept.name}`;
  return 'All VIDVIE products';
}

export function listingHtml(products, view, opts, built) {
  const { list, facetBase, dept } = listingView(products, view, opts);
  const sub = dept && view.sub ? subOf(dept, view.sub) : null;
  const title = listingTitle(view);
  const crumbs = [['Home', '/']];
  if (view.kind === 'deals') crumbs.push(['Deals', '/deals/']);
  else if (view.kind === 'search') crumbs.push(['Search', null]);
  else if (dept) {
    crumbs.push([dept.name, deptHref(dept.slug)]);
    if (sub && dept.subs.length > 1) crumbs.push([sub.name, subHref(dept.slug, sub.slug)]);
  } else crumbs.push(['All products', '/products/']);

  // Category filter: inside a department its categories, elsewhere the departments
  const counts = deptCounts(facetBase);
  let catLinks = '';
  if (view.kind === 'dept' && dept) {
    const subs = dept.subs.filter(s => counts[dept.slug] && counts[dept.slug].subs[s[0]]);
    if (subs.length > 1) {
      catLinks = `<a class="${!view.sub ? 'on' : ''}" href="${deptHref(dept.slug)}">All ${esc(dept.name)}<i>${counts[dept.slug].total}</i></a>` +
        subs.map(s => `<a class="${view.sub === s[0] ? 'on' : ''}" href="${subHref(dept.slug, s[0])}">${esc(s[1])}<i>${counts[dept.slug].subs[s[0]]}</i></a>`).join('');
    }
    catLinks += `<a class="back" href="/products/">${icon('chevron', 'ico ico-xs flip')} All departments</a>`;
  } else {
    catLinks = DEPARTMENTS.filter(d => counts[d.slug]).map(d => {
      if (view.kind === 'all') return `<a href="${deptHref(d.slug)}">${esc(d.name)}<i>${counts[d.slug].total}</i></a>`;
      return `<button type="button" class="${view.dept === d.slug ? 'on' : ''}" data-set-dept="${d.slug}">${esc(d.name)}<i>${counts[d.slug].total}</i></button>`;
    }).join('');
  }

  const shown = list.slice(0, opts.limit || PAGE_SIZE);
  const sel = v => (opts.sort === v ? ' selected' : '');
  const anyFilter = opts.stock || opts.sale || opts.min > 0 || opts.max > 0 || (view.kind !== 'dept' && view.dept);

  return `${breadcrumb(crumbs)}
<div class="listing">
  <aside class="filters" id="filters" aria-label="Filters">
    <div class="filters-head"><b>Filters</b><button type="button" class="filters-close" data-close-filters aria-label="Close filters">×</button></div>
    ${catLinks ? `<div class="fgroup"><h3>Category</h3><div class="cat-links">${catLinks}</div></div>` : ''}
    <div class="fgroup"><h3>Price (AED)</h3>
      <form class="price-form" data-price-form>
        <input type="number" inputmode="decimal" min="0" name="min" placeholder="Min" value="${opts.min > 0 ? opts.min : ''}" aria-label="Minimum price" />
        <span>–</span>
        <input type="number" inputmode="decimal" min="0" name="max" placeholder="Max" value="${opts.max > 0 ? opts.max : ''}" aria-label="Maximum price" />
        <button type="submit" class="btn btn-small">Go</button>
      </form>
    </div>
    <div class="fgroup"><h3>Show</h3>
      <label class="check"><input type="checkbox" data-opt="stock" ${opts.stock ? 'checked' : ''}/> In stock only</label>
      ${view.kind === 'deals' ? '' : `<label class="check"><input type="checkbox" data-opt="sale" ${opts.sale ? 'checked' : ''}/> On sale</label>`}
    </div>
    ${anyFilter ? '<button type="button" class="clear-filters" data-clear>Clear filters</button>' : ''}
  </aside>
  <div class="results">
    <div class="results-head">
      <div><h1>${esc(title)}</h1><p class="muted">${list.length} product${list.length === 1 ? '' : 's'}</p></div>
      <div class="results-tools">
        <button type="button" class="btn btn-outline filters-open" data-open-filters>${icon('filter', 'ico ico-sm')} Filters</button>
        <label class="sort"><span>Sort</span>
          <select data-sort aria-label="Sort products">
            <option value="">Recommended</option>
            <option value="price-asc"${sel('price-asc')}>Price: low to high</option>
            <option value="price-desc"${sel('price-desc')}>Price: high to low</option>
            <option value="discount"${sel('discount')}>Biggest discount</option>
            <option value="new"${sel('new')}>Newest</option>
          </select>
        </label>
      </div>
    </div>
    ${shown.length ? `<div class="grid">${shown.map(p => cardHtml(p, built)).join('')}</div>` :
      `<div class="empty">${icon('search')}<h2>No products found</h2><p>${view.kind === 'search' && !view.q ? 'Type what you are looking for in the search box.' : 'Try another word or remove a filter.'}</p><a class="btn btn-primary" href="/products/">See all products</a></div>`}
    ${list.length > shown.length ? `<div class="more"><button type="button" class="btn btn-outline" data-more>Show more (${list.length - shown.length} left)</button></div>` : ''}
  </div>
</div>`;
}

// ---------------------------------------------------------------- product

// details: { description, short_description, images[], warranty, returns } or null
export function productHtml(p, products, details, built) {
  const dept = deptBySlug(p.dept);
  const sub = subOf(dept, p.sub);
  const crumbs = [['Home', '/'], [dept.name, deptHref(dept.slug)]];
  if (sub && dept.subs.length > 1) crumbs.push([sub.name, subHref(dept.slug, sub.slug)]);
  crumbs.push([p.title.length > 48 ? `${p.title.slice(0, 46).replace(/\s+\S*$/, '')}…` : p.title, null]);
  const images = details && details.images && details.images.length ? details.images : [p.image];
  const related = products.filter(x => x.id !== p.id && x.sub === p.sub && x.dept === p.dept && x.inStock).slice(0, 12);
  const more = related.length < 6 ? products.filter(x => x.id !== p.id && x.dept === p.dept && x.sub !== p.sub && x.inStock).slice(0, 12 - related.length) : [];
  const desc = details && (details.description || details.short_description);
  const warranty = (details && details.warranty) || '12 months local warranty';
  const returns = details && details.returns;

  return `${breadcrumb(crumbs)}
<div class="pdp" data-product="${p.id}">
  <div class="pdp-gallery">
    <div class="pdp-main"><img id="pdpMain" src="${esc(images[0])}" alt="${esc(p.title)}" width="800" height="800" /></div>
    ${images.length > 1 ? `<div class="pdp-thumbs">${images.slice(0, 8).map((src, i) =>
      `<button type="button" class="${i === 0 ? 'on' : ''}" data-img="${esc(src)}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy" /></button>`).join('')}</div>` : ''}
  </div>
  <div class="pdp-info">
    <a class="pdp-brand" href="/products/">VIDVIE</a>
    <h1>${esc(p.title)}</h1>
    <p class="pdp-meta">${p.model ? `Model <b>${esc(p.model)}</b> · ` : ''}SKU ${esc(p.sku)}</p>
    ${priceHtml(p, true)}
    <p class="muted small">Price includes 5% VAT</p>
    <p class="pdp-stock ${p.inStock ? 'in' : 'out'}">${p.inStock ? `${icon('check', 'ico ico-sm')} In stock, ships from Dubai` : 'Out of stock right now'}</p>
    ${details && details.short_description && details.description ? `<p class="pdp-short">${esc(details.short_description)}</p>` : ''}
    <div class="pdp-buy">
      <div class="qty" data-qty-box>
        <button type="button" data-qty="-1" aria-label="Less">−</button><input type="number" min="1" max="50" value="1" aria-label="Quantity" data-qty-input /><button type="button" data-qty="1" aria-label="More">+</button>
      </div>
      <button class="btn btn-primary" type="button" data-add-qty="${p.id}" ${p.inStock ? '' : 'disabled'}>${icon('bag', 'ico ico-sm')} Add to bag</button>
      <button class="btn btn-dark" type="button" data-buy-now="${p.id}" ${p.inStock ? '' : 'disabled'}>Buy now</button>
    </div>
    <ul class="pdp-points">
      <li>${icon('shield', 'ico ico-sm')}<span><b>Genuine VIDVIE</b> from the official UAE distributor</span></li>
      <li>${icon('truck', 'ico ico-sm')}<span><b>Delivery across the UAE</b> from our Dubai warehouse; the fee is shown at checkout</span></li>
      <li>${icon('check', 'ico ico-sm')}<span><b>${esc(warranty)}</b></span></li>
      ${returns ? `<li>${icon('return', 'ico ico-sm')}<span>${esc(returns)}</span></li>` : ''}
      <li>${icon('card', 'ico ico-sm')}<span>Card, Apple Pay, Tabby (4 payments) or cash on delivery</span></li>
    </ul>
    <a class="pdp-ask" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello, I have a question about VIDVIE ${p.model || p.title} (SKU ${p.sku}).`)}" target="_blank" rel="noopener">${icon('chat', 'ico ico-sm')} Ask about this product on WhatsApp</a>
  </div>
</div>
${desc ? `<section class="pdp-desc"><h2>About this product</h2>${String(desc).split(/\n{2,}|\r?\n/).filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('')}</section>` : ''}
${railHtml(related.length ? `More ${sub ? sub.name : dept.name}` : `More ${dept.name}`, sub && dept.subs.length > 1 ? subHref(dept.slug, sub.slug) : deptHref(dept.slug), related.concat(more), built)}`;
}

// ---------------------------------------------------------------- wholesale

export function wholesaleHtml() {
  return `${breadcrumb([['Home', '/'], ['Wholesale', null]])}
<div class="wholesale">
  <div class="wholesale-text">
    <h1>VIDVIE wholesale in the UAE</h1>
    <p>Retailers, telecom stores, corporate gifting and resellers can buy VIDVIE directly from the official UAE distributor.</p>
    <ul class="pdp-points">
      <li>${icon('box', 'ico ico-sm')}<span><b>Stock in Dubai</b>, dispatched to all seven emirates without customs delays</span></li>
      <li>${icon('tag', 'ico ico-sm')}<span><b>Tiered prices</b> for sample orders, mid-size and bulk quantities</span></li>
      <li>${icon('shield', 'ico ico-sm')}<span><b>Local warranty and marketing support</b>: replacements in the UAE, displays and packaging</span></li>
    </ul>
    <p class="contact-line"><a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">${icon('chat', 'ico ico-sm')} WhatsApp ${PHONE_DISPLAY}</a><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
  <div class="panel">
    <h2>Request wholesale prices</h2>
    <form class="form" id="inquiryForm">
      <div class="row2">
        <label>Your name<input name="name" required autocomplete="name" /></label>
        <label>Company<input name="company" required autocomplete="organization" /></label>
      </div>
      <div class="row2">
        <label>Email<input name="email" type="email" required autocomplete="email" /></label>
        <label>Phone / WhatsApp<input name="phone" type="tel" autocomplete="tel" placeholder="+971 50 …" /></label>
      </div>
      <div class="row2">
        <label>Interested in<select name="interest"><option>Wholesale supply</option><option>Corporate gifts</option><option>Retail store stockist</option><option>Distribution agreement</option></select></label>
        <label>Quantity<select name="quantity"><option>Sample order (10–50 units)</option><option>Under 100 units</option><option>100–500 units</option><option>500+ units</option></select></label>
      </div>
      <label>Products or models you need<textarea name="message" rows="3" placeholder="For example PLB170, KB05, TS004, or a category"></textarea></label>
      <button class="btn btn-primary" type="submit">Prepare my enquiry</button>
    </form>
    <div class="inquiry-result" id="inquiryResult" hidden>
      <h3>Your enquiry is ready</h3>
      <p class="muted">Send it by email or WhatsApp:</p>
      <textarea id="inquiryOutput" readonly rows="8" aria-label="Prepared enquiry"></textarea>
      <div class="row-actions">
        <a class="btn btn-primary" id="emailInquiry" href="mailto:${EMAIL}">Send by email</a>
        <a class="btn btn-outline" id="waInquiry" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">Send on WhatsApp</a>
        <button class="link-btn" id="editInquiry" type="button">Edit</button>
      </div>
    </div>
  </div>
</div>`;
}

export function notFoundHtml() {
  return `<div class="empty big">${icon('search')}<h1>This page doesn't exist</h1><p>The product may have been removed. Try searching for it or browse the categories.</p><a class="btn btn-primary" href="/products/">See all products</a></div>`;
}

// ---------------------------------------------------------------- SEO

export function productJsonLd(p, details) {
  const images = details && details.images && details.images.length ? details.images : [p.image];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    mpn: p.model || undefined,
    image: images,
    description: (details && (details.short_description || details.description)) || p.name,
    brand: { '@type': 'Brand', name: 'VIDVIE' },
    category: p.begadCategory || undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE}${productHref(p)}`,
      priceCurrency: 'AED',
      price: p.price.toFixed(2),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'VIDVIE UAE' }
    }
  };
}

// ---------------------------------------------------------------- guides

// Buying guides written daily by Begad's office job (begad.ae
// app/seo_articles.php) and read by tools/build.mjs from
// begad.ae/api/seo-articles/v1/public?site=vidvie. Not linked from the
// menus (owner, 2026-11-13: "just for search engines"); found through
// sitemap.xml, /guides/ and the links between guides.
export const guideHref = a => `/guides/${a.slug}/`;

export function guideTextHtml(text) {
  return String(text || '').trim().split(/\n{2,}/).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return '';
    if (lines.every(l => /^[-•*]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${esc(l.replace(/^[-•*]\s+/, ''))}</li>`).join('')}</ul>`;
    return `<p>${lines.map(esc).join('<br>')}</p>`;
  }).join('');
}

const guideDate = a => {
  const d = new Date(String(a.published_at || '').replace(' ', 'T') + '+04:00');
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' });
};

export function guidesIndexHtml(articles) {
  return `${breadcrumb([['Home', '/'], ['Guides', null]])}
<div class="guide">
  <h1>VIDVIE buying guides</h1>
  <p class="guide-meta">Advice for choosing chargers, power banks, audio and accessories in the UAE.</p>
  ${articles.length ? `<ul class="guide-list">${articles.map(a => `<li><a href="${guideHref(a)}"><b>${esc(a.title)}</b><span>${esc(a.meta_description)}</span></a></li>`).join('')}</ul>` : '<p class="muted">No guides yet.</p>'}
</div>`;
}

export function guideHtml(a, products, built, others = []) {
  const body = a.body || {};
  const byId = new Map(products.map(p => [p.id, p]));
  const sections = body.sections || [];
  return `${breadcrumb([['Home', '/'], ['Guides', '/guides/'], [a.title.length > 48 ? `${a.title.slice(0, 46).replace(/\s+\S*$/, '')}…` : a.title, null]])}
<article class="guide">
  <h1>${esc(a.title)}</h1>
  <p class="guide-meta">VIDVIE UAE buying guide${guideDate(a) ? ` · Updated ${guideDate(a)}` : ''}</p>
  <div class="guide-body">${guideTextHtml(body.intro)}</div>
  ${sections.length >= 4 ? `<nav class="guide-toc"><b>In this guide</b><ol>${sections.map((s, i) => `<li><a href="#s${i + 1}">${esc(s.heading)}</a></li>`).join('')}</ol></nav>` : ''}
  ${sections.map((s, i) => {
    const cards = (s.products || []).map(id => byId.get(Number(id))).filter(Boolean);
    return `<section class="guide-section" id="s${i + 1}"><h2>${esc(s.heading)}</h2><div class="guide-body">${guideTextHtml(s.text)}</div>
    ${cards.length ? `<div class="grid guide-cards">${cards.map(p => cardHtml(p, built)).join('')}</div>` : ''}</section>`;
  }).join('')}
  ${(body.faq || []).length ? `<section class="guide-section"><h2>Frequently asked questions</h2>${body.faq.map(f => `<details class="guide-faq"><summary>${esc(f.q)}</summary><div class="guide-body">${guideTextHtml(f.a)}</div></details>`).join('')}</section>` : ''}
  ${body.conclusion ? `<section class="guide-section"><h2>The bottom line</h2><div class="guide-body">${guideTextHtml(body.conclusion)}</div></section>` : ''}
  <p class="guide-shop"><a class="btn btn-primary" href="/products/">Shop all VIDVIE products</a></p>
  ${others.length ? `<section class="guide-section"><h2>More guides</h2><ul class="guide-list">${others.slice(0, 6).map(o => `<li><a href="${guideHref(o)}"><b>${esc(o.title)}</b></a></li>`).join('')}</ul></section>` : ''}
</article>`;
}

export function guideJsonLd(a, products) {
  const url = `${SITE}${guideHref(a)}`;
  const byId = new Map(products.map(p => [p.id, p]));
  const images = (a.product_ids || []).map(id => byId.get(Number(id))).filter(Boolean).slice(0, 3).map(p => p.image);
  const published = new Date(String(a.published_at || '').replace(' ', 'T') + '+04:00');
  const out = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.meta_description,
      datePublished: isNaN(published) ? undefined : published.toISOString(), mainEntityOfPage: url, image: images,
      author: { '@type': 'Organization', name: 'VIDVIE UAE', url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: 'VIDVIE UAE', logo: { '@type': 'ImageObject', url: `${SITE}/assets/vidvie-official-logo.png` } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE}/guides/` },
      { '@type': 'ListItem', position: 3, name: a.title, item: url }] }
  ];
  const faq = (a.body && a.body.faq) || [];
  if (faq.length) out.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  return out;
}
