const products = catalogProducts;
const $ = s => document.querySelector(s);
const featured = ['BE-2629','BE-2659','BE-2698','BE-2809','BE-2660','BE-2792'].map(id => products.find(p => p.id === id)).filter(Boolean);
const ordered = [...featured,...products.filter(p => !featured.includes(p))];
let filter = 'All', limit = 12, cart = [];

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

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('visible'), 3000);
}

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
  $('#cartCount').textContent = getCartCount();
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
  toast(`✓ ${p.model} added to bag (${getCartCount()} items)`);
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
  if (p) toast(`${p.model} removed from bag`);
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
  return `VIDVIE UAE Shopping Bag\n\n${lines.join('\n')}\n\nSubtotal: AED ${subtotal.toFixed(2)}\n\nOrder fulfilled across UAE by Begad General Trading L.L.C.`;
}

function renderFilters() {
  const categories = ['All', ...new Set(products.map(p => p.category))];
  $('#filters').innerHTML = categories.map(c => `<button class="filter ${c === filter ? 'active' : ''}" data-filter="${c}" type="button">${c === 'All' ? 'All products' : c}</button>`).join('');
}

function renderProducts() {
  const q = $('#catalogSearch').value.trim().toLowerCase();
  const matching = ordered.filter(p => (filter === 'All' || p.category === filter) && `${p.name} ${p.model} ${p.id} ${p.category}`.toLowerCase().includes(q));
  $('#resultsCount').textContent = `${matching.length} product${matching.length === 1 ? '' : 's'} found`;
  
  $('#productGrid').innerHTML = matching.length ? matching.slice(0, limit).map(p => {
    const price = p.begad_price || p.retail;
    const begadUrl = p.begad_url || `https://begad.ae/search?q=${encodeURIComponent(p.model)}`;
    return `
      <article class="product-card" data-sku="${p.id}">
        <div class="product-image">
          <span class="product-badge">${p.category.toUpperCase()}</span>
          <img src="${p.image}" alt="VIDVIE ${p.model} ${p.name}" loading="lazy">
        </div>
        <div class="product-info">
          <p class="product-category">VIDVIE ${p.model} · ${p.id}</p>
          <h3>${p.name}</h3>
          <p class="product-price">
            AED <strong>${price.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span class="stock-badge">✓ UAE Stock</span>
          </p>
          <div class="product-actions">
            <button type="button" class="button-add-cart" data-add="${p.id}" aria-label="Add ${p.model} to bag">
              Add to Bag +
            </button>
            <a href="${begadUrl}" target="_blank" rel="noopener noreferrer" class="button-buy-begad" title="View product on Begad.ae">
              Buy on Begad ↗
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('') : '<p class="no-results">No products match that search. Try another term.</p>';

  $('#loadMore').hidden = matching.length <= limit;
}

function renderCart() {
  const count = getCartCount();
  const subtotal = getCartSubtotal();
  const subtotalStr = 'AED ' + subtotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  $('#cartSubtotal').textContent = subtotalStr;
  
  if (!cart.length) {
    $('#selectionItems').innerHTML = '<p class="selection-empty">Your shopping bag is empty. Browse the collection and add VIDVIE accessories to your bag.</p>';
    $('#begadCheckoutBtn').disabled = true;
    $('#begadCheckoutBtn').textContent = 'Checkout on Begad ↗';
    $('#begadReviewBtn').style.pointerEvents = 'none';
    $('#begadReviewBtn').style.opacity = '0.5';
    $('#copySelection').disabled = true;
    $('#emailSelection').removeAttribute('href');
    $('#emailSelection').style.opacity = '0.5';
    return;
  }

  $('#begadCheckoutBtn').disabled = false;
  $('#begadCheckoutBtn').textContent = `Checkout on Begad (${subtotalStr}) ↗`;
  $('#begadReviewBtn').style.pointerEvents = 'auto';
  $('#begadReviewBtn').style.opacity = '1';
  $('#begadReviewBtn').href = buildBegadCheckoutUrl(false);
  $('#copySelection').disabled = false;
  $('#emailSelection').style.opacity = '1';
  $('#emailSelection').href = mailto('VIDVIE UAE Order Enquiry', cartSummaryText());

  $('#selectionItems').innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return '';
    const unitPrice = p.begad_price || p.retail;
    const lineTotal = unitPrice * item.qty;
    const begadUrl = p.begad_url || `https://begad.ae/search?q=${encodeURIComponent(p.model)}`;
    return `
      <div class="cart-item" data-id="${p.id}">
        <img class="cart-item-img" src="${p.image}" alt="${p.name}">
        <div class="cart-item-details">
          <h3>${p.name}</h3>
          <p class="cart-item-meta">VIDVIE ${p.model} · <a href="${begadUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">Begad Link ↗</a></p>
          <div class="cart-item-controls">
            <div class="cart-qty-control">
              <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-num">${item.qty}</span>
              <button type="button" class="cart-qty-btn" data-cart-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item-line-total">AED ${lineTotal.toFixed(2)}</span>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-remove="${p.id}" aria-label="Remove ${p.model}" title="Remove">×</button>
      </div>
    `;
  }).join('');
}

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

// Event Listeners
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  filter = b.dataset.filter;
  limit = 12;
  renderFilters();
  renderProducts();
});

$('#catalogSearch').addEventListener('input', () => {
  limit = 12;
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
  if (e.key === 'Escape' && $('#selectionDrawer').classList.contains('open')) closeDrawer();
});

$('#begadCheckoutBtn').addEventListener('click', () => {
  if (!cart.length) return;
  const checkoutUrl = buildBegadCheckoutUrl(true);
  window.open(checkoutUrl, '_blank');
});

$('#whatsappOrderBtn').addEventListener('click', () => {
  if (!cart.length) {
    toast('Your bag is empty');
    return;
  }
  const msg = buildWhatsAppCartMessage();
  window.open(`https://wa.me/971562386732?text=${encodeURIComponent(msg)}`, '_blank');
});

function buildWhatsAppCartMessage() {
  const subtotal = getCartSubtotal();
  const lines = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const price = (p && (p.begad_price || p.retail)) || 0;
    return `• ${item.qty}x ${p.name} (VIDVIE ${p.model}, SKU ${p.id}) — AED ${(price * item.qty).toFixed(2)}`;
  });
  return `Hello VIDVIE UAE, I would like to order the following items from the website:\n\n${lines.join('\n')}\n\nEstimated Subtotal: AED ${subtotal.toFixed(2)}\n\nPlease advise UAE delivery and payment options.`;
}

$('#copySelection').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(cartSummaryText());
    toast('Product list copied');
  } catch {
    toast('Copy unavailable in this browser');
  }
});

$('#clearCartBtn').addEventListener('click', clearCart);

$('#menuTrigger').addEventListener('click', () => {
  const open = $('#mobileNav').classList.toggle('open');
  $('#menuTrigger').setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('#mobileNav a').forEach(a => a.addEventListener('click', () => {
  $('#mobileNav').classList.remove('open');
  $('#menuTrigger').setAttribute('aria-expanded', 'false');
}));

$('#inquiryForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  const text = `VIDVIE UAE business enquiry\n\nName: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone / WhatsApp: ${d.phone || 'Not provided'}\nInterest: ${d.interest}\nEstimated quantity: ${d.quantity}\n\nProducts / requirements:\n${d.message || 'Please contact me to discuss the VIDVIE range.'}`;
  $('#inquiryOutput').value = text;
  $('#emailInquiry').href = mailto(`VIDVIE UAE ${d.interest.toLowerCase()} enquiry from ${d.company}`, text);
  $('#inquiryForm').hidden = true;
  $('#inquiryResult').hidden = false;
  $('#inquiryResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#copyInquiry').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#inquiryOutput').value);
    toast('Enquiry copied');
  } catch {
    $('#inquiryOutput').select();
    toast('Select and copy the enquiry text');
  }
});

$('#editInquiry').addEventListener('click', () => {
  $('#inquiryResult').hidden = true;
  $('#inquiryForm').hidden = false;
});

// Init
$('#year').textContent = new Date().getFullYear();
renderFilters();
saveCart();
renderProducts();
