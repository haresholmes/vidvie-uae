const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// The product list is Begad's: every published product of the Vidvie brand
// on begad.ae, with Begad's names, photos, prices and stock. catalog.js is a
// snapshot of that list (refreshed by tools/sync-catalog.mjs) for the first
// paint; loadCatalog() replaces it with the current list on every visit.
const CATALOG_API = 'https://begad.ae/api/agent/prices?brand=vidvie&details=1';

// Begad's categories, folded into the groups this site shows. A Begad
// category that is not listed here lands in "More".
const CATEGORY_GROUPS = {
  'Power Banks': ['Power Banks'],
  'Wall Chargers': ['Chargers', 'extensions & Plugs'],
  'Car Chargers': ['Car Chargers'],
  'Cables': ['Cables'],
  'Wireless Chargers': ['Wireless Chargers'],
  'Audio': ['Headphones', 'Earbuds', 'Gaming Headsets', 'Microphones'],
  'Speakers': ['Bluetooth Speakers'],
  'Smart Watches': ['Smart Watches'],
  'Holders & Mounts': ['Car Mounts', 'Mounts & Holders'],
  'Storage': ['USB Flash Drives', 'External Storage'],
  'Computer Accessories': ['Keyboards', 'Mouse', 'USB Hubs & Docking', 'Stylus Pens', 'Laptop Bags', 'Bags & Luggage'],
  'Lifestyle & Home': ['Fans', 'Grooming Kits', 'Hair Tools', 'Projectors', 'Electric Toothbrush', 'Lighting', 'Wellness',
    'Tools & Equipment', 'Streaming Devices', 'Mobile Accessories', 'Car Accessories', 'Car Care & Cleaning']
};
const GROUP_ORDER = [...Object.keys(CATEGORY_GROUPS), 'More'];
const GROUP_OF = {};
Object.entries(CATEGORY_GROUPS).forEach(([group, names]) => names.forEach(n => { GROUP_OF[n.toLowerCase()] = group; }));

// Begad product ids shown first under "Featured First"
const FEATURED_IDS = [10001862, 10001858, 10001919, 10002252, 10001859, 10002258];

const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// VIDVIE model code inside a product name ("... PLB170 ..."), '' if none.
// Charging specs such as PD30W or QC18W look similar and are skipped.
function modelOf(name) {
  const found = name.match(/\b(?:XL-)?[A-Z]{2,4}\d{2,5}(?:[A-Z0-9]|[&-](?=[A-Za-z0-9]))*/g) || [];
  const model = found.find(m => !/^(?:PD|QC)\d/.test(m) && !/\d(?:W|MAH)$/.test(m));
  return model ? model.replace(/[&-]$/, '') : '';
}

// One item of Begad's feed -> the product object the page works with
function toProduct(item) {
  const price = item.price || {};
  const amount = Number(price.amount) || 0;
  const withTax = Number(price.amount_with_tax) || amount;
  const compareAt = Number(price.compare_at_amount) || 0;
  const name = String(item.name || '').trim();
  return {
    id: String(item.id),
    begad_id: item.id,
    sku: String(item.sku || ''),
    name,
    model: modelOf(name),
    category: GROUP_OF[String(item.category || '').toLowerCase()] || 'More',
    image: item.thumb || item.image || '',
    begad_url: item.url || `https://begad.ae/search?q=${encodeURIComponent(name)}`,
    begad_price: withTax,
    // compare_at is on the same basis as "amount"; bring it to the VAT-inclusive basis too
    compare_at: compareAt > amount && amount > 0 ? compareAt * (withTax / amount) : 0,
    in_stock: item.in_stock !== false
  };
}

let products = [];
let ordered = [];

function setProducts(items) {
  products = items.map(toProduct).filter(p => p.name && p.begad_price > 0);
  const rank = p => {
    const featured = FEATURED_IDS.indexOf(p.begad_id);
    return (p.in_stock ? 0 : 1000) + (featured === -1 ? 500 : featured);
  };
  // Featured first, out-of-stock last; otherwise Begad's order (newest first)
  ordered = products.map((p, index) => ({ p, index }))
    .sort((x, y) => rank(x.p) - rank(y.p) || x.index - y.index)
    .map(x => x.p);
}

setProducts(typeof catalogProducts !== 'undefined' ? catalogProducts : []);

let filter = 'All';
let sortBy = 'featured';
let limit = 12;
let cart = [];

// Initialize Cart from storage
try {
  const raw = localStorage.getItem('vidvie-cart') || localStorage.getItem('vidvie-selection');
  const parsed = JSON.parse(raw || '[]');
  if (Array.isArray(parsed)) {
    cart = parsed.map(item => {
      if (typeof item === 'string') return { id: item, qty: 1 };
      if (item && item.id) return { id: item.id, qty: Math.max(1, Math.min(50, parseInt(item.qty, 10) || 1)) };
      return null;
    }).filter(item => item && products.some(p => p.id === item.id));
  }
} catch {
  cart = [];
}

const mailto = (subject, body) => `mailto:Contact@begad.ae?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// Toast notification helper
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('visible'), 3200);
}

// Cart helpers
function getCartCount() {
  return cart.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 1), 0);
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.id);
    const price = (p && (p.begad_price || p.retail)) || 0;
    return sum + (price * (item.qty || 1));
  }, 0);
}

function saveCart() {
  localStorage.setItem('vidvie-cart', JSON.stringify(cart));
  const countEl = $('#cartCount');
  if (countEl) {
    countEl.textContent = getCartCount();
    countEl.classList.add('bump');
    setTimeout(() => countEl.classList.remove('bump'), 220);
  }
  renderCart();
}

function addToCart(id, qty = 1) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.in_stock === false) {
    toast(`${p.model} is out of stock right now`);
    return;
  }
  const existing = cart.find(x => x.id === id);
  if (existing) {
    existing.qty = Math.min(50, existing.qty + qty);
  } else {
    cart.push({ id, qty: Math.min(50, qty) });
  }
  saveCart();
  toast(`✓ Added ${p.model || 'item'} to your bag`);
}

function updateCartQty(id, delta) {
  const existing = cart.find(x => x.id === id);
  if (!existing) return;
  existing.qty += delta;
  if (existing.qty <= 0) {
    cart = cart.filter(x => x.id !== id);
  } else if (existing.qty > 50) {
    existing.qty = 50;
  }
  saveCart();
}

function removeFromCart(id) {
  const p = products.find(x => x.id === id);
  cart = cart.filter(x => x.id !== id);
  saveCart();
  if (p) toast(`Removed ${p.model || 'item'} from bag`);
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  saveCart();
  toast('Shopping bag cleared');
}

function buildBegadCheckoutUrl(directCheckout = true) {
  if (!cart.length) return 'https://begad.ae/en/cart';
  const param = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const token = (p && (p.begad_id || p.begad_sku)) || item.id;
    return `${token}:${item.qty}`;
  }).join(',');
  return `https://begad.ae/en/cart?add_items=${encodeURIComponent(param)}${directCheckout ? '&checkout=1' : ''}`;
}

function cartSummaryText() {
  const subtotal = getCartSubtotal();
  const lines = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const price = (p && (p.begad_price || p.retail)) || 0;
    return `• ${item.qty}x ${p.name} (Begad SKU ${p.sku}) — AED ${(price * item.qty).toFixed(2)}`;
  });
  return `VIDVIE UAE Shopping Bag\n\n${lines.join('\n')}\n\nEstimated Subtotal: AED ${subtotal.toFixed(2)}\n\nOrder fulfilled across the UAE by Begad General Trading L.L.C.`;
}

function buildWhatsAppCartMessage() {
  const subtotal = getCartSubtotal();
  const lines = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const price = (p && (p.begad_price || p.retail)) || 0;
    return `• ${item.qty}x ${p.name} (Begad SKU ${p.sku}) — AED ${(price * item.qty).toFixed(2)}`;
  });
  return `Hello VIDVIE UAE, I would like to order the following items:\n\n${lines.join('\n')}\n\nSubtotal: AED ${subtotal.toFixed(2)}\n\nPlease confirm availability and payment options.`;
}

// Category Filters
function renderFilters() {
  const categoryCounts = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categories = ['All', ...GROUP_ORDER.filter(c => categoryCounts[c])];
  
  const html = categories.map(c => {
    const count = c === 'All' ? products.length : categoryCounts[c];
    const isActive = c === filter;
    return `
      <button class="filter-chip ${isActive ? 'active' : ''}" data-filter="${c}" type="button">
        <span>${c === 'All' ? 'All Products' : c}</span>
        <span class="filter-chip-count">${count}</span>
      </button>
    `;
  }).join('');

  $('#filters').innerHTML = html;
}

// Category tiles: one photo per group above the product grid
function renderCategoryTiles() {
  const el = $('#categoryTiles');
  if (!el) return;
  const counts = {};
  products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  el.innerHTML = GROUP_ORDER.filter(c => counts[c]).map(c => {
    const sample = ordered.find(p => p.category === c);
    return `
      <button class="category-tile ${c === filter ? 'active' : ''}" data-filter="${c}" type="button">
        <span class="category-tile-img"><img src="${escapeHtml(sample.image)}" alt="" loading="lazy" /></span>
        <span class="category-tile-name">${c}</span>
        <span class="category-tile-count">${counts[c]} product${counts[c] === 1 ? '' : 's'}</span>
      </button>
    `;
  }).join('');
}

// Everything on the page that depends on the product list
function renderCatalog() {
  if (filter !== 'All' && !products.some(p => p.category === filter)) filter = 'All';
  const groups = new Set(products.map(p => p.category)).size;
  $$('[data-product-count]').forEach(el => { el.textContent = products.length; });
  $$('[data-group-count]').forEach(el => { el.textContent = groups; });
  renderFilters();
  renderCategoryTiles();
  renderProducts();
}

function setFilter(value) {
  filter = value;
  limit = 12;
  renderFilters();
  renderCategoryTiles();
  renderProducts();
}

// Render Products Grid with Filtering & Sorting
function renderProducts() {
  const q = $('#catalogSearch').value.trim().toLowerCase();
  
  // Filter
  let list = ordered.filter(p => {
    const matchesCat = filter === 'All' || p.category === filter;
    const matchesSearch = !q || `${p.name} ${p.model} ${p.sku} ${p.id} ${p.category}`.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Sort
  if (sortBy === 'price-asc') {
    list.sort((a, b) => (a.begad_price || a.retail) - (b.begad_price || b.retail));
  } else if (sortBy === 'price-desc') {
    list.sort((a, b) => (b.begad_price || b.retail) - (a.begad_price || a.retail));
  } else if (sortBy === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  $('#resultsCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'} found`;

  if (!list.length) {
    $('#productGrid').innerHTML = '<p class="no-results" style="grid-column:1/-1;text-align:center;padding:50px;color:var(--muted)">No accessories found matching your criteria. Try searching another term or resetting filters.</p>';
    $('#loadMore').hidden = true;
    return;
  }

  const visible = list.slice(0, limit);
  $('#productGrid').innerHTML = visible.map(p => {
    const price = p.begad_price || p.retail;
    const begadUrl = escapeHtml(p.begad_url);
    const name = escapeHtml(p.name);
    const label = p.model || 'this product';
    const out = p.in_stock === false;
    const off = p.compare_at > price ? Math.round((1 - price / p.compare_at) * 100) : 0;
    return `
      <article class="product-card ${out ? 'is-out' : ''}" data-id="${p.id}">
        <div class="product-image-wrap">
          <span class="card-badge-top">${p.category}</span>
          <span class="card-stock-tag ${out ? 'out' : ''}">${out ? 'Out of stock' : '✓ UAE Stock'}</span>
          <img src="${escapeHtml(p.image)}" alt="${name}" loading="lazy" />
        </div>
        <div class="product-body">
          <div class="product-meta-row">
            <span class="product-model-code">VIDVIE ${escapeHtml(p.model)}</span>
            <span class="product-sku">${escapeHtml(p.sku)}</span>
          </div>
          <h3 class="product-title" title="${name}">${name}</h3>
          <div class="product-price-row">
            <div class="price-main">
              <span class="currency-symbol">AED</span>
              <span class="price-amount">${price.toFixed(2)}</span>
              ${off > 0 ? `<span class="price-was">${p.compare_at.toFixed(2)}</span><span class="price-off">-${off}%</span>` : ''}
            </div>
            <span class="vat-tag">5% VAT Incl.</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-card-cart" type="button" data-add="${p.id}" aria-label="Add ${escapeHtml(label)} to shopping bag" ${out ? 'disabled' : ''}>
              <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>${out ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>
            <a class="btn-card-begad" href="${begadUrl}" target="_blank" rel="noopener noreferrer" title="View product on Begad.ae">
              Begad ↗
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  $('#loadMore').hidden = list.length <= limit;
}

// Render Shopping Bag Drawer
function renderCart() {
  const count = getCartCount();
  const subtotal = getCartSubtotal();
  const subtotalStr = 'AED ' + subtotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const subtotalEl = $('#cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = subtotalStr;

  // Delivery meter
  const meterText = $('#deliveryMeterText');
  if (meterText) {
    if (subtotal >= 100) {
      meterText.textContent = '🎉 You qualify for FREE Express UAE Delivery!';
    } else if (subtotal > 0) {
      const remaining = (100 - subtotal).toFixed(2);
      meterText.textContent = `Add AED ${remaining} more for FREE UAE Delivery`;
    } else {
      meterText.textContent = '🚚 Fast UAE Delivery fulfilled by Begad.ae';
    }
  }

  const itemsContainer = $('#selectionItems');
  const checkoutBtn = $('#begadCheckoutBtn');
  const reviewBtn = $('#begadReviewBtn');
  const copyBtn = $('#copySelection');
  const emailBtn = $('#emailSelection');

  if (!cart.length) {
    if (itemsContainer) {
      itemsContainer.innerHTML = `
        <div class="selection-empty">
          <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <h3>Your shopping bag is empty</h3>
          <p>Explore the collection and add VIDVIE accessories to your bag.</p>
        </div>
      `;
    }
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Checkout on Begad ↗';
    }
    if (reviewBtn) {
      reviewBtn.style.pointerEvents = 'none';
      reviewBtn.style.opacity = '0.4';
    }
    if (copyBtn) copyBtn.disabled = true;
    if (emailBtn) {
      emailBtn.removeAttribute('href');
      emailBtn.style.opacity = '0.4';
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = `Checkout on Begad (${subtotalStr}) →`;
  }
  if (reviewBtn) {
    reviewBtn.style.pointerEvents = 'auto';
    reviewBtn.style.opacity = '1';
    reviewBtn.href = buildBegadCheckoutUrl(false);
  }
  if (copyBtn) copyBtn.disabled = false;
  if (emailBtn) {
    emailBtn.style.opacity = '1';
    emailBtn.href = mailto('VIDVIE UAE Order Enquiry', cartSummaryText());
  }

  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return '';
      const unitPrice = p.begad_price || p.retail;
      const lineTotal = unitPrice * item.qty;
      const begadUrl = escapeHtml(p.begad_url);
      return `
        <div class="cart-item" data-id="${p.id}">
          <img class="cart-item-img" src="${escapeHtml(p.image)}" alt="" />
          <div class="cart-item-details">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="cart-item-meta">VIDVIE ${escapeHtml(p.model)} · <a href="${begadUrl}" target="_blank" rel="noopener noreferrer">Begad Product ↗</a></p>
            <div class="cart-item-controls">
              <div class="cart-qty-control">
                <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
              </div>
              <span class="cart-item-line-total">AED ${lineTotal.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-remove="${p.id}" aria-label="Remove ${escapeHtml(p.model || 'item')}" title="Remove item">×</button>
        </div>
      `;
    }).join('');
  }
}

// Drawer visibility controls
function openDrawer() {
  $('#drawerBackdrop').hidden = false;
  $('#selectionDrawer').classList.add('open');
  $('#selectionDrawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('#drawerClose').focus();
}

function closeDrawer() {
  $('#selectionDrawer').classList.remove('open');
  $('#selectionDrawer').setAttribute('aria-hidden', 'true');
  $('#drawerBackdrop').hidden = true;
  document.body.style.overflow = '';
  $('#cartTrigger').focus();
}

// Ask Begad for the current product list. If the call fails the page keeps
// showing the catalog.js snapshot.
async function loadCatalog() {
  try {
    const res = await fetch(CATALOG_API, { credentials: 'omit' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.items) || !data.items.length) return;
    setProducts(data.items);
    // Drop bag lines for products Begad no longer lists
    const before = cart.length;
    cart = cart.filter(item => products.some(p => p.id === item.id));
    renderCatalog();
    if (cart.length !== before) saveCart(); else renderCart();
  } catch {
    // Offline or Begad unreachable: keep the snapshot
  }
}

// A product photo that fails to load leaves an empty frame, not a broken-image icon
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG' && e.target.closest('#productGrid, #categoryTiles, #selectionItems')) {
    e.target.style.visibility = 'hidden';
  }
}, true);

// Hero scene: a product in the picture jumps to that product in the grid
$('#heroScene').addEventListener('click', e => {
  const item = e.target.closest('[data-find]');
  if (!item) return;
  // data-find is a Begad product id; its SKU finds exactly that product
  const p = products.find(x => x.id === item.dataset.find);
  if (!p) return;
  $('#catalogSearch').value = p.sku;
  setFilter('All');
  $('.collection-toolbar').scrollIntoView({ behavior: 'smooth' });
});

// Setup Event Handlers
$('#filters').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  setFilter(btn.dataset.filter);
});

$('#categoryTiles').addEventListener('click', e => {
  const tile = e.target.closest('[data-filter]');
  if (!tile) return;
  // A second click on the selected tile shows everything again
  setFilter(tile.dataset.filter === filter ? 'All' : tile.dataset.filter);
  $('.collection-toolbar').scrollIntoView({ behavior: 'smooth' });
});

$('#catalogSearch').addEventListener('input', () => {
  limit = 12;
  renderProducts();
});

$('#sortSelect').addEventListener('change', e => {
  sortBy = e.target.value;
  renderProducts();
});

$('.search-trigger').addEventListener('click', () => {
  $('#collection').scrollIntoView({ behavior: 'smooth' });
  $('#catalogSearch').focus();
});

$('#loadMore').addEventListener('click', () => {
  limit += 12;
  renderProducts();
});

$('#productGrid').addEventListener('click', e => {
  const addBtn = e.target.closest('[data-add]');
  if (!addBtn) return;
  const id = addBtn.dataset.add;
  addToCart(id, 1);
});

$('#selectionItems').addEventListener('click', e => {
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    removeFromCart(removeBtn.dataset.remove);
    return;
  }
  const qtyBtn = e.target.closest('[data-cart-qty]');
  if (qtyBtn) {
    const id = qtyBtn.dataset.cartQty;
    const delta = parseInt(qtyBtn.dataset.delta, 10) || 0;
    updateCartQty(id, delta);
  }
});

$('#cartTrigger').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
$('#drawerBackdrop').addEventListener('click', closeDrawer);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#selectionDrawer').classList.contains('open')) {
    closeDrawer();
  }
});

$('#begadCheckoutBtn').addEventListener('click', () => {
  if (!cart.length) return;
  const checkoutUrl = buildBegadCheckoutUrl(true);
  window.open(checkoutUrl, '_blank');
});

$('#whatsappOrderBtn').addEventListener('click', () => {
  if (!cart.length) {
    toast('Your shopping bag is empty');
    return;
  }
  const msg = buildWhatsAppCartMessage();
  window.open(`https://wa.me/971562386732?text=${encodeURIComponent(msg)}`, '_blank');
});

$('#copySelection').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(cartSummaryText());
    toast('Product list copied to clipboard');
  } catch {
    toast('Clipboard copy unavailable');
  }
});

$('#clearCartBtn').addEventListener('click', clearCart);

$('#menuTrigger').addEventListener('click', () => {
  const nav = $('#mobileNav');
  const open = nav.classList.toggle('open');
  $('#menuTrigger').setAttribute('aria-expanded', String(open));
});

$$('#mobileNav a').forEach(a => a.addEventListener('click', () => {
  $('#mobileNav').classList.remove('open');
  $('#menuTrigger').setAttribute('aria-expanded', 'false');
}));

// Wholesale form
$('#inquiryForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  const text = `VIDVIE UAE Wholesale Enquiry\n\nContact: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone / WhatsApp: ${d.phone || 'Not provided'}\nInterest: ${d.interest}\nEstimated Quantity: ${d.quantity}\n\nRequirements / Models:\n${d.message || 'Please send complete catalog and wholesale tier pricing.'}`;
  $('#inquiryOutput').value = text;
  $('#emailInquiry').href = mailto(`VIDVIE UAE ${d.interest} Enquiry - ${d.company}`, text);
  $('#inquiryForm').hidden = true;
  $('#inquiryResult').hidden = false;
  $('#inquiryResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#copyInquiry').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#inquiryOutput').value);
    toast('Wholesale enquiry copied to clipboard');
  } catch {
    $('#inquiryOutput').select();
    toast('Select and copy enquiry text');
  }
});

$('#editInquiry').addEventListener('click', () => {
  $('#inquiryResult').hidden = true;
  $('#inquiryForm').hidden = false;
});

// Initialization
$('#year').textContent = new Date().getFullYear();
saveCart();
renderCatalog();
loadCatalog();
