const products = catalogProducts;
const $ = s => document.querySelector(s);
const priceExpiry = new Date('2026-10-01T23:59:59+04:00');
const featured = ['BE-2629','BE-2659','BE-2698','BE-2809','BE-2660','BE-2792'].map(id => products.find(p => p.id === id)).filter(Boolean);
const ordered = [...featured,...products.filter(p => !featured.includes(p))];
let filter = 'All', limit = 12, selected = [];
try { selected = JSON.parse(localStorage.getItem('vidvie-selection') || '[]').filter(id => products.some(p => p.id === id)); } catch { selected = []; }
const mailto = (subject,body) => `mailto:Contact@begad.ae?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const selectionText = () => `VIDVIE UAE product selection\n\n${selected.map(id => { const p=products.find(x=>x.id===id); return `• ${p.name} (VIDVIE ${p.model}, SKU ${p.id})`; }).join('\n')}\n\nPlease advise current UAE availability and pricing.`;
function toast(message){ const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),3000); }
function renderFilters(){const categories=['All',...new Set(products.map(p=>p.category))];$('#filters').innerHTML=categories.map(c=>`<button class="filter ${c===filter?'active':''}" data-filter="${c}" type="button">${c==='All'?'All products':c}</button>`).join('');}
function renderProducts(){
  const q=$('#catalogSearch').value.trim().toLowerCase();
  const matching=ordered.filter(p=>(filter==='All'||p.category===filter)&&`${p.name} ${p.model} ${p.id} ${p.category}`.toLowerCase().includes(q));
  const pricesValid=new Date()<=priceExpiry;
  $('#resultsCount').textContent=`${matching.length} product${matching.length===1?'':'s'} found`;
  $('#productGrid').innerHTML=matching.length?matching.slice(0,limit).map(p=>`<article class="product-card"><div class="product-image"><span class="product-badge">${p.category.toUpperCase()}</span><img src="${p.image}" alt="VIDVIE ${p.model} ${p.name}" loading="lazy"></div><div class="product-info"><p class="product-category">VIDVIE ${p.model} · ${p.id}</p><h3>${p.name}</h3><p class="product-price">${pricesValid?`Suggested retail <strong>AED ${p.retail.toLocaleString('en-AE')}</strong>`:'Price on enquiry'}</p><div class="product-actions"><a href="https://wa.me/971562386732?text=${encodeURIComponent(`Hello VIDVIE UAE, I would like to enquire about ${p.name} (VIDVIE ${p.model}, SKU ${p.id}). Please confirm availability and price.`)}" target="_blank" rel="noopener noreferrer" aria-label="Enquire on WhatsApp about ${p.model}">Enquire / order ↗</a><button type="button" class="add-button" data-add="${p.id}" aria-label="Add ${p.model} to selection" title="Add to selection">+</button></div></div></article>`).join(''):'<p class="no-results">No products match that search. Try another term.</p>';
  $('#loadMore').hidden=matching.length<=limit;
}
function renderSelection(){const chosen=selected.map(id=>products.find(p=>p.id===id));$('#selectionItems').innerHTML=chosen.length?chosen.map(p=>`<div class="selection-item"><img src="${p.image}" alt=""><div><h3>${p.name}</h3><p>VIDVIE ${p.model} · ${p.id}</p></div><button type="button" data-remove="${p.id}" aria-label="Remove ${p.model}">Remove</button></div>`).join(''):'<p class="selection-empty">Your selection is empty. Explore the collection and add products you would like to discuss.</p>';$('#copySelection').disabled=!chosen.length;$('#emailSelection').hidden=!chosen.length;$('#emailSelection').href=mailto('VIDVIE UAE product selection',selectionText());}
function saveSelection(){localStorage.setItem('vidvie-selection',JSON.stringify(selected));$('#cartCount').textContent=selected.length;renderSelection();}
function openDrawer(){$('#drawerBackdrop').hidden=false;$('#selectionDrawer').classList.add('open');$('#selectionDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#drawerClose').focus();}
function closeDrawer(){$('#selectionDrawer').classList.remove('open');$('#selectionDrawer').setAttribute('aria-hidden','true');$('#drawerBackdrop').hidden=true;document.body.style.overflow='';$('#cartTrigger').focus();}
$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;limit=12;renderFilters();renderProducts();});
$('#catalogSearch').addEventListener('input',()=>{limit=12;renderProducts();});
$('.search-trigger').addEventListener('click',()=>{$('#collection').scrollIntoView({behavior:'smooth'});$('#catalogSearch').focus();});
$('#loadMore').addEventListener('click',()=>{limit+=12;renderProducts();});
$('#productGrid').addEventListener('click',e=>{const id=e.target.closest('[data-add]')?.dataset.add;if(!id)return;if(selected.includes(id)){toast('Already in your selection');return;}selected.push(id);saveSelection();toast(`${id} added to your selection`);});
$('#selectionItems').addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(!id)return;selected=selected.filter(x=>x!==id);saveSelection();});
$('#cartTrigger').addEventListener('click',openDrawer);$('#drawerClose').addEventListener('click',closeDrawer);$('#drawerBackdrop').addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#selectionDrawer').classList.contains('open'))closeDrawer();});
$('#copySelection').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(selectionText());toast('Product list copied');}catch{toast('Copy unavailable in this browser');}});
$('#menuTrigger').addEventListener('click',()=>{const open=$('#mobileNav').classList.toggle('open');$('#menuTrigger').setAttribute('aria-expanded',String(open));});
document.querySelectorAll('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').classList.remove('open');$('#menuTrigger').setAttribute('aria-expanded','false');}));
$('#inquiryForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));const text=`VIDVIE UAE business enquiry\n\nName: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone / WhatsApp: ${d.phone||'Not provided'}\nInterest: ${d.interest}\nEstimated quantity: ${d.quantity}\n\nProducts / requirements:\n${d.message||'Please contact me to discuss the VIDVIE range.'}`;$('#inquiryOutput').value=text;$('#emailInquiry').href=mailto(`VIDVIE UAE ${d.interest.toLowerCase()} enquiry from ${d.company}`,text);$('#inquiryForm').hidden=true;$('#inquiryResult').hidden=false;$('#inquiryResult').scrollIntoView({behavior:'smooth',block:'center'});});
$('#copyInquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#inquiryOutput').value);toast('Enquiry copied');}catch{$('#inquiryOutput').select();toast('Select and copy the enquiry text');}});
$('#editInquiry').addEventListener('click',()=>{$('#inquiryResult').hidden=true;$('#inquiryForm').hidden=false;});
$('#year').textContent=new Date().getFullYear();renderFilters();saveSelection();renderProducts();
