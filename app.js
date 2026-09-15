const products = catalogProducts;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Featured product IDs
const featuredIds = ['BE-2629','BE-2659','BE-2698','BE-2809','BE-2660','BE-2792'];
const featured = featuredIds.map(id => products.find(p => p.id === id)).filter(Boolean);
const ordered = [...featured, ...products.filter(p => !featured.includes(p))];

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
  const existing = cart.find(x => x.id === id);
  if (existing) {
    existing.qty = Math.min(50, existing.qty + qty);
  } else {
    cart.push({ id, qty: Math.min(50, qty) });
  }
  saveCart();
  toast(`✓ Added ${p.model} to your bag`);
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
  if (p) toast(`Removed ${p.model} from bag`);
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
    return `• ${item.qty}x ${p.name} (VIDVIE ${p.model}, SKU ${p.id}) — AED ${(price * item.qty).toFixed(2)}`;
  });
  return `VIDVIE UAE Shopping Bag\n\n${lines.join('\n')}\n\nEstimated Subtotal: AED ${subtotal.toFixed(2)}\n\nOrder fulfilled across the UAE by Begad General Trading L.L.C.`;
}

function buildWhatsAppCartMessage() {
  const subtotal = getCartSubtotal();
  const lines = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const price = (p && (p.begad_price || p.retail)) || 0;
    return `• ${item.qty}x ${p.name} (VIDVIE ${p.model}, SKU ${p.id}) — AED ${(price * item.qty).toFixed(2)}`;
  });
  return `Hello VIDVIE UAE, I would like to order the following items:\n\n${lines.join('\n')}\n\nSubtotal: AED ${subtotal.toFixed(2)}\n\nPlease confirm availability and payment options.`;
}

// Category Filters
function renderFilters() {
  const categoryCounts = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categories = ['All', ...Object.keys(categoryCounts).sort()];
  
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

// Render Products Grid with Filtering & Sorting
function renderProducts() {
  const q = $('#catalogSearch').value.trim().toLowerCase();
  
  // Filter
  let list = ordered.filter(p => {
    const matchesCat = filter === 'All' || p.category === filter;
    const matchesSearch = !q || `${p.name} ${p.model} ${p.id} ${p.category}`.toLowerCase().includes(q);
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
    const begadUrl = p.begad_url || `https://begad.ae/search?q=${encodeURIComponent(p.model)}`;
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-image-wrap">
          <span class="card-badge-top">${p.category}</span>
          <span class="card-stock-tag">✓ UAE Stock</span>
          <img src="${p.image}" alt="VIDVIE ${p.model} ${p.name}" loading="lazy" />
        </div>
        <div class="product-body">
          <div class="product-meta-row">
            <span class="product-model-code">VIDVIE ${p.model}</span>
            <span class="product-sku">${p.id}</span>
          </div>
          <h3 class="product-title" title="${p.name}">${p.name}</h3>
          <div class="product-price-row">
            <div class="price-main">
              <span class="currency-symbol">AED</span>
              <span class="price-amount">${price.toFixed(2)}</span>
            </div>
            <span class="vat-tag">5% VAT Incl.</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-card-cart" type="button" data-add="${p.id}" aria-label="Add ${p.model} to shopping bag">
              <svg width="15" height="15" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>Add to Bag</span>
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
      const begadUrl = p.begad_url || `https://begad.ae/search?q=${encodeURIComponent(p.model)}`;
      return `
        <div class="cart-item" data-id="${p.id}">
          <img class="cart-item-img" src="${p.image}" alt="${p.name}" />
          <div class="cart-item-details">
            <h3>${p.name}</h3>
            <p class="cart-item-meta">VIDVIE ${p.model} · <a href="${begadUrl}" target="_blank" rel="noopener noreferrer">Begad Product ↗</a></p>
            <div class="cart-item-controls">
              <div class="cart-qty-control">
                <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
              </div>
              <span class="cart-item-line-total">AED ${lineTotal.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-remove="${p.id}" aria-label="Remove ${p.model}" title="Remove item">×</button>
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

// Hero Spotlight Rotator
const heroSpotlights = [
  {
    title: 'VIDVIE TS004-UK Smart Projector',
    specs: '1080P Full HD · Android 12 · Built-in Netflix',
    image: 'assets/catalog/product-090.webp',
    pills: ['⚡ 120-Inch Display', '🛡️ Auto-Keystone', '🚚 Begad Fulfilled']
  },
  {
    title: 'VIDVIE KB05 Wireless Keyboard',
    specs: 'Transparent RGB · Multi-Device Bluetooth · Type-C',
    image: 'assets/catalog/product-084.webp',
    pills: ['⚡ 3 Devices', '🛡️ 30-Day Battery', '🚚 In Stock Dubai']
  },
  {
    title: 'VIDVIE 67W GaN Fast Wall Charger',
    specs: 'Ultra-Compact GaN · Dual Type-C & USB-A Ports',
    image: 'assets/catalog/product-000.webp',
    pills: ['⚡ 67W Super Fast', '🛡️ Multi-Protect', '🚚 Same-Day']
  }
];
let heroIndex = 0;
function cycleHeroSpotlight() {
  heroIndex = (heroIndex + 1) % heroSpotlights.length;
  const spot = heroSpotlights[heroIndex];
  const img = $('#heroSpotlightImg');
  const title = $('#heroSpotlightTitle');
  const specs = $('#heroSpotlightSpecs');
  if (img && title && specs) {
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = spot.image;
      img.alt = spot.title;
      title.textContent = spot.title;
      specs.textContent = spot.specs;
      img.style.opacity = '1';
    }, 200);
  }
}
setInterval(cycleHeroSpotlight, 6000);

// Setup Event Handlers
$('#filters').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  limit = 12;
  renderFilters();
  renderProducts();
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
renderFilters();
saveCart();
renderProducts();
