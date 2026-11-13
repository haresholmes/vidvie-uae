// Browser side of vidvie.ae. Every page is built ahead of time by
// tools/build.mjs; this file redraws the page from Begad's live product
// list (prices, stock, new products), runs the filters and the bag, and
// sends the bag to Begad's checkout.
import {
  CATALOG_API, WHATSAPP, EMAIL, PAGE_SIZE, buildCatalog, deptNavHtml, homeHtml, listingHtml,
  productHtml, money, esc
} from './site.js';

const $ = s => document.querySelector(s);

const page = JSON.parse(($('#pageData') || {}).textContent || '{}');
const snapshot = typeof catalogProducts !== 'undefined' ? catalogProducts : []; // eslint-disable-line no-undef
// Products that have a page of their own on this site (the build's list)
const built = new Set(snapshot.map(i => Number(i.id)));
let products = buildCatalog(snapshot);

// ---------------------------------------------------------------- address bar options

function readOpts() {
  const q = new URLSearchParams(location.search);
  return {
    sort: q.get('sort') || '',
    min: Number(q.get('min')) || 0,
    max: Number(q.get('max')) || 0,
    stock: q.get('stock') === '1',
    sale: q.get('sale') === '1',
    limit: Math.max(PAGE_SIZE, Number(q.get('n')) || PAGE_SIZE)
  };
}

function listingViewNow() {
  const v = Object.assign({}, page.view || {});
  const q = new URLSearchParams(location.search);
  if (v.kind === 'search') v.q = (q.get('q') || '').trim();
  if (v.kind !== 'dept') v.dept = q.get('dept') || '';
  return v;
}

function setParams(changes, keepScroll = true) {
  const q = new URLSearchParams(location.search);
  Object.entries(changes).forEach(([k, val]) => {
    if (val === '' || val === null || val === false || val === 0) q.delete(k);
    else q.set(k, val === true ? '1' : String(val));
  });
  if (!('n' in changes)) q.delete('n');
  const qs = q.toString();
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  const y = window.scrollY;
  render();
  if (keepScroll) window.scrollTo(0, y);
}

// ---------------------------------------------------------------- drawing

function render() {
  const app = $('#app');
  if (page.type === 'home') {
    app.innerHTML = homeHtml(products, built);
  } else if (page.type === 'listing') {
    app.innerHTML = listingHtml(products, listingViewNow(), readOpts(), built);
  } else if (page.type === 'product') {
    const p = products.find(x => x.id === page.productId);
    if (p) {
      const img = $('#pdpMain');
      const current = img ? img.getAttribute('src') : '';
      const qty = $('[data-qty-input]') ? $('[data-qty-input]').value : '1';
      app.innerHTML = productHtml(p, products, page.details || null, built);
      if (current && $('#pdpMain')) {
        $('#pdpMain').src = current;
        document.querySelectorAll('[data-img]').forEach(b => b.classList.toggle('on', b.dataset.img === current));
      }
      if ($('[data-qty-input]')) $('[data-qty-input]').value = qty;
    }
  }
  if (page.type !== 'notfound') $('#deptNav').innerHTML = deptNavHtml(products, page.nav || '');
}

// ---------------------------------------------------------------- bag

let cart = [];
try {
  const parsed = JSON.parse(localStorage.getItem('vidvie-cart') || '[]');
  if (Array.isArray(parsed)) {
    cart = parsed.map(i => (i && i.id ? { id: Number(i.id), qty: Math.max(1, Math.min(50, parseInt(i.qty, 10) || 1)) } : null))
      .filter(i => i && products.some(p => p.id === i.id));
  }
} catch { cart = []; }

const findProduct = id => products.find(p => p.id === Number(id));
const cartCount = () => cart.reduce((n, i) => n + i.qty, 0);
const cartTotal = () => cart.reduce((s, i) => { const p = findProduct(i.id); return s + (p ? p.price * i.qty : 0); }, 0);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

function saveCart() {
  try { localStorage.setItem('vidvie-cart', JSON.stringify(cart)); } catch { /* private mode */ }
  const n = cartCount();
  const badge = $('#cartCount');
  badge.textContent = n;
  badge.hidden = n === 0;
  renderCart();
}

function addToCart(id, qty = 1, quiet = false) {
  const p = findProduct(id);
  if (!p) return;
  if (!p.inStock) { toast('This product is out of stock right now'); return; }
  const line = cart.find(i => i.id === p.id);
  if (line) line.qty = Math.min(50, line.qty + qty); else cart.push({ id: p.id, qty: Math.min(50, qty) });
  saveCart();
  if (!quiet) toast(`Added to your bag: ${p.model || p.title.slice(0, 40)}`);
}

// Begad's cart takes product ids: begad.ae/en/cart?add_items=<id>:<qty>,...
function checkoutUrl(lines) {
  const items = lines.map(i => `${i.id}:${i.qty}`).join(',');
  return `https://begad.ae/en/cart?add_items=${encodeURIComponent(items)}&checkout=1`;
}

function renderCart() {
  const box = $('#cartItems');
  const foot = $('#cartFoot');
  if (!cart.length) {
    box.innerHTML = `<div class="empty small"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><h3>Your bag is empty</h3><p>Add a few VIDVIE favourites and they will show up here.</p></div>`;
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  $('#cartSubtotal').textContent = `AED ${money(cartTotal())}`;
  box.innerHTML = cart.map(i => {
    const p = findProduct(i.id);
    if (!p) return '';
    const href = built.has(p.id) ? `/p/${p.slug}/` : p.begadUrl;
    return `<div class="line">
      <a href="${esc(href)}"><img src="${esc(p.thumb)}" alt="" width="72" height="72" /></a>
      <div class="line-body">
        <a class="line-name" href="${esc(href)}">${esc(p.title)}</a>
        <div class="line-row">
          <div class="qty qty-sm"><button type="button" data-line-qty="${p.id}" data-d="-1" aria-label="Less">−</button><span>${i.qty}</span><button type="button" data-line-qty="${p.id}" data-d="1" aria-label="More">+</button></div>
          <b>AED ${money(p.price * i.qty)}</b>
        </div>
      </div>
      <button class="line-remove" type="button" data-remove="${p.id}" aria-label="Remove">×</button>
    </div>`;
  }).join('');
}

function openDrawer() {
  $('#backdrop').hidden = false;
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
  $('#drawerClose').focus();
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#backdrop').hidden = true;
  document.body.classList.remove('locked');
}

// ---------------------------------------------------------------- events

document.addEventListener('click', e => {
  const t = e.target;
  const add = t.closest('[data-add]');
  if (add) { addToCart(add.dataset.add); return; }
  const addQty = t.closest('[data-add-qty]');
  if (addQty) { addToCart(addQty.dataset.addQty, Number($('[data-qty-input]').value) || 1); openDrawer(); return; }
  const buy = t.closest('[data-buy-now]');
  if (buy) {
    const qty = Math.max(1, Math.min(50, Number($('[data-qty-input]').value) || 1));
    location.href = checkoutUrl([{ id: Number(buy.dataset.buyNow), qty }]);
    return;
  }
  const qtyBtn = t.closest('[data-qty]');
  if (qtyBtn) {
    const input = $('[data-qty-input]');
    input.value = Math.max(1, Math.min(50, (Number(input.value) || 1) + Number(qtyBtn.dataset.qty)));
    return;
  }
  const copy = t.closest('[data-copy-link]');
  if (copy) {
    if (navigator.clipboard) navigator.clipboard.writeText(copy.dataset.copyLink).then(() => { copy.classList.add('is-done'); toast('Link copied'); setTimeout(() => copy.classList.remove('is-done'), 1600); });
    return;
  }
  const thumb = t.closest('[data-img]');
  if (thumb) {
    $('#pdpMain').src = thumb.dataset.img;
    document.querySelectorAll('[data-img]').forEach(b => b.classList.toggle('on', b === thumb));
    return;
  }
  const lineQty = t.closest('[data-line-qty]');
  if (lineQty) {
    const line = cart.find(i => i.id === Number(lineQty.dataset.lineQty));
    if (line) {
      line.qty = Math.min(50, line.qty + Number(lineQty.dataset.d));
      if (line.qty <= 0) cart = cart.filter(i => i !== line);
      saveCart();
    }
    return;
  }
  const rm = t.closest('[data-remove]');
  if (rm) { cart = cart.filter(i => i.id !== Number(rm.dataset.remove)); saveCart(); return; }
  if (t.closest('[data-more]')) { setParams({ n: readOpts().limit + PAGE_SIZE }); return; }
  if (t.closest('[data-clear]')) {
    history.replaceState(null, '', location.pathname + (page.view && page.view.kind === 'search' ? `?q=${encodeURIComponent(listingViewNow().q || '')}` : ''));
    render();
    return;
  }
  const setDept = t.closest('[data-set-dept]');
  if (setDept) { const cur = new URLSearchParams(location.search).get('dept'); setParams({ dept: cur === setDept.dataset.setDept ? '' : setDept.dataset.setDept }); return; }
  if (t.closest('[data-open-filters]')) { $('#filters').classList.add('open'); document.body.classList.add('locked'); return; }
  if (t.closest('[data-close-filters]')) { $('#filters').classList.remove('open'); document.body.classList.remove('locked'); }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-sort]')) setParams({ sort: t.value });
  else if (t.matches('[data-opt]')) setParams({ [t.dataset.opt]: t.checked });
});

document.addEventListener('submit', e => {
  const f = e.target;
  if (f.matches('[data-price-form]')) {
    e.preventDefault();
    const d = new FormData(f);
    setParams({ min: Number(d.get('min')) || 0, max: Number(d.get('max')) || 0 });
    $('#filters').classList.remove('open');
    document.body.classList.remove('locked');
  } else if (f.id === 'inquiryForm') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const text = `VIDVIE UAE wholesale enquiry\n\nName: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone / WhatsApp: ${d.phone || '-'}\nInterested in: ${d.interest}\nQuantity: ${d.quantity}\n\nProducts:\n${d.message || 'Please send the full catalogue with wholesale prices.'}`;
    $('#inquiryOutput').value = text;
    $('#emailInquiry').href = `mailto:${EMAIL}?subject=${encodeURIComponent(`VIDVIE UAE wholesale enquiry - ${d.company}`)}&body=${encodeURIComponent(text)}`;
    $('#waInquiry').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    f.hidden = true;
    $('#inquiryResult').hidden = false;
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#drawer').classList.contains('open')) closeDrawer();
  const filters = $('#filters');
  if (filters && filters.classList.contains('open')) { filters.classList.remove('open'); document.body.classList.remove('locked'); }
});

// A photo that fails to load leaves an empty frame, not a broken-image icon
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG' && e.target.closest('#app, #cartItems')) e.target.style.visibility = 'hidden';
}, true);

$('#cartTrigger').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
$('#backdrop').addEventListener('click', closeDrawer);
$('#checkoutBtn').addEventListener('click', () => { if (cart.length) location.href = checkoutUrl(cart); });
$('#clearCartBtn').addEventListener('click', () => { cart = []; saveCart(); });
$('#waOrderBtn').addEventListener('click', () => {
  if (!cart.length) return;
  const lines = cart.map(i => { const p = findProduct(i.id); return `• ${i.qty} × ${p.name} (SKU ${p.sku}) - AED ${money(p.price * i.qty)}`; });
  const msg = `Hello VIDVIE UAE, I would like to order:\n\n${lines.join('\n')}\n\nSubtotal: AED ${money(cartTotal())}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});
$('#editInquiry') && $('#editInquiry').addEventListener('click', () => { $('#inquiryResult').hidden = true; $('#inquiryForm').hidden = false; });
$('#year').textContent = new Date().getFullYear();
if (page.view && page.view.kind === 'search') $('.search input').value = listingViewNow().q || '';

// ---------------------------------------------------------------- live data

// Ask Begad for the current list (prices, stock, deals). If the call fails
// the page keeps what was built.
async function loadLive() {
  try {
    const res = await fetch(CATALOG_API, { credentials: 'omit' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.items) || data.items.length < 20) return;
    products = buildCatalog(data.items);
    const before = cart.length;
    cart = cart.filter(i => products.some(p => p.id === i.id));
    render();
    if (before !== cart.length) saveCart(); else renderCart();
  } catch { /* offline or Begad unreachable */ }
}

// Listings with options in the address bar are drawn now; everything else is
// already right from the build.
if (page.type === 'listing' && location.search) render();
saveCart();
loadLive();
