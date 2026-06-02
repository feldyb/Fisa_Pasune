/**
 * FIȘIER: app.js
 * Versiune ultra-rezistentă. Garantează pornirea interfeței și randarea tab-urilor.
 */

// Inițializare dicționar botanic în siguranță
const BOT_BY_COD = {};
try {
  if (typeof BOTANICAL !== 'undefined' && Array.isArray(BOTANICAL)) {
    BOTANICAL.forEach(b => { if(b && b.cod) BOT_BY_COD[b.cod] = b; });
  }
} catch(e) { console.error("Eroare la inițializare BOTANICAL:", e); }

// Funcții de siguranță pentru categorii
function isToxic(categorie) {
  if (!categorie) return false;
  return categorie.toLowerCase().includes('toxice') || categorie.toLowerCase().includes('toxic');
}

function isBalast(categorie) {
  if (!categorie) return false;
  return categorie.toLowerCase().includes('balast') || categorie.toLowerCase().includes('daunatoare');
}

// Modal specii
function openPlantModal(cod) {
  try {
    const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
    const p = sursaPlante.find(x => x.cod === cod);
    if (!p) return;
    const toxic = isToxic(p.categorie);
    const balast = isBalast(p.categorie);
    const codCls = toxic ? 'toxic' : '';
    const catCls = toxic ? 'toxic' : balast ? 'balast' : '';
    const bot = BOT_BY_COD[cod];

    let botHtml = '';
    if (bot) {
      const matchNote = bot.match_type === 'genus'
        ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:8px 10px;font-family:var(--font-mono);font-size:11px;color:#7a5c00;margin-bottom:12px">ⓘ Date botanice pentru genul înrudit <em>${bot.album_match}</em></div>`
        : '';
      const fields = [
        ['Caractere', bot.caractere],
        ['Talie', bot.talie],
        ['Înflorire', bot.inflorire],
        ['Frecvență', bot.frecventa],
        ['Areal', bot.areal],
        ['Răspândire', bot.raspandire],
        ['Habitat', bot.habitat],
        ['Ecologie', bot.ecologie],
        ['Utilizări', bot.utilizari],
      ].filter(([,v]) => v);

      const rows = fields.map(([l, v]) => `
        <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f0e8d0;">
          <span style="font-family:var(--font-mono);font-size:10px;color:#888;min-width:80px;flex-shrink:0">${l}</span>
          <span style="font-size:13px;color:var(--green-deep)">${v}</span>
        </div>`).join('');

      botHtml = `
        <div style="margin-top:14px;border-top:2px solid var(--green-pale);padding-top:14px">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--green-mid);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">📗 Date botanice (album 2013)</div>
          ${matchNote}
          ${rows}
        </div>`;
    }

    const modalBody = document.getElementById('modal-body');
    if(modalBody) {
      modalBody.innerHTML = `
        <div class="modal-cod ${codCls}">#${p.cod}</div>
        <div class="modal-stiintific">${p.stiintific}</div>
        <div class="modal-popular">${p.popular}</div>
        <div class="modal-cat ${catCls}">${p.categorie}</div>
        ${toxic ? '<div style="background:#fff0f0;border:1.5px solid #c0392b;border-radius:8px;padding:12px;color:#c0392b;font-size:13px;font-family:var(--font-mono)">⚠️ SPECIE TOXICĂ — poate dăuna animalelor</div>' : ''}
        ${botHtml}
        ${!bot ? '<div style="font-family:var(--font-mono);font-size:11px;color:#bbb;margin-top:12px">Fișă botanică indisponibilă pentru această specie în versiunea PDF redusă.</div>' : ''}
      `;
    }
    const modalEl = document.getElementById('plant-modal');
    if(modalEl) modalEl.classList.add('open');
  } catch(e) { console.error("Eroare la openPlantModal:", e); }
}

// ===================== TABS (Navigare reparată) =====================
function showTab(name) {
  try {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetPage = document.getElementById('page-' + name);
    const targetTab = document.getElementById('tab-' + name);
    if (targetPage) targetPage.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
  } catch(e) { console.error("Eroare la showTab:", e); }
}

// ===================== SPECII (Randare protejată) =====================
function renderSpecii(list) {
  try {
    const container = document.getElementById('specii-list');
    if (!container) return;
    
    let html = '';
    let lastCat = null;
    const listaSigura = Array.isArray(list) ? list : [];

    listaSigura.forEach(p => {
      if(!p) return;
      if (p.categorie !== lastCat) {
        lastCat = p.categorie;
        const cls = isToxic(p.categorie) ? 'toxic' : isBalast(p.categorie) ? 'balast' : '';
        html += `<div class="cat-label ${cls}">${p.categorie}</div>`;
      }
      const toxic = isToxic(p.categorie);
      const balast = isBalast(p.categorie);
      const codCls = toxic ? 'toxic' : balast ? 'balast' : '';
      html += `<div class="plant-item" onclick="openPlantModal(${p.cod})">
        <div class="plant-cod ${codCls}">${p.cod}</div>
        <div class="plant-names">
          <div class="plant-stiintific">${p.stiintific}</div>
          <div class="plant-popular">${p.popular}</div>
        </div>
        <div class="plant-chevron">›</div>
      </div>`;
    });

    if (!listaSigura.length) {
      html = `<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Nicio specie găsită în baza de date</div></div>`;
    }
    container.innerHTML = html;
  } catch(e) { console.error("Eroare la renderSpecii:", e); }
}

function filterSpecii() {
  try {
    const searchInput = document.getElementById('search-specii');
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
    if (!q) { renderSpecii(sursaPlante); return; }
    const filtered = sursaPlante.filter(p =>
      p && (String(p.cod) === q ||
      (p.stiintific && p.stiintific.toLowerCase().includes(q)) ||
      (p.popular && p.popular.toLowerCase().includes(q)))
    );
    renderSpecii(filtered);
  } catch(e) { console.error("Eroare la filterSpecii:", e); }
}

function closePlantModal(e) {
  const modal = document.getElementById('plant-modal');
  if (modal && (!e || e.target === modal)) {
    modal.classList.remove('open');
  }
}

// ===================== UVM =====================
let selectedTip = null;

function renderTipGrid() {
  try {
    const grid = document.getElementById('tip-grid');
    if (!grid || typeof UVM_TIPURI === 'undefined' || !Array.isArray(UVM_TIPURI)) return;
    grid.innerHTML = UVM_TIPURI.map(t => `
      <div class="tip-badge ${selectedTip === t.val ? 'selected' : ''}" onclick="selectTip('${t.val}')">
        <div class="tb-label">${t.label}</div>
        <div class="tb-range">${t.zona}</div>
        <div class="tb-uvm">${t.uvm_min}–${t.uvm_max} UVM/ha</div>
      </div>
    `).join('');
  } catch(e) { console.error("Eroare la renderTipGrid:", e); }
}

function selectTip(val) {
  selectedTip = val;
  renderTipGrid();
  calcUVM();
}

function calcUVM() {
  try {
    if (typeof UVM_TIPURI === 'undefined') return;
    const tip = UVM_TIPURI.find(t => t.val === selectedTip);
    const supEl = document.getElementById('uvm-sup');
    const zileEl = document.getElementById('uvm-zile');
    const valEl = document.getElementById('uvm-val');
    const resultEl = document.getElementById('uvm-result');
    
    const sup = supEl ? parseFloat(supEl.value) || 0 : 0;
    const zile = zileEl ? parseInt(zileEl.value) || 180 : 180;
    const val = valEl ? parseFloat(valEl.value) || 0.75 : 0.75;

    if (!tip || !sup) {
      if(resultEl) resultEl.style.display = 'none';
      return;
    }

    const uvmMid = (tip.uvm_min + tip.uvm_max) / 2;
    const uvmAdj = uvmMid * val;
    const totalMin = tip.uvm_min * val * sup;
    const totalMax = tip.uvm_max * val * sup;
    const totalMid = uvmAdj * sup;
    const unb = (totalMid * zile / 365).toFixed(1);

    if(resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div class="big-number">${totalMid.toFixed(1)}</div>
        <div class="big-label">UVM total (mijloc)</div>
        <div class="uvm-details">
          <div class="uvm-detail-item"><div class="dl">Interval UVM</div><div class="dv">${totalMin.toFixed(1)} – ${totalMax.toFixed(1)}</div></div>
          <div class="uvm-detail-item"><div class="dl">UVM/ha ajustat</div><div class="dv">${uvmAdj.toFixed(2)}</div></div>
          <div class="uvm-detail-item"><div class="dl">Suprafață</div><div class="dv">${sup} ha</div></div>
          <div class="uvm-detail-item"><div class="dl">Zile × UNB</div><div class="dv">${unb} UNB/an</div></div>
        </div>`;
    }
  } catch(e) { console.error("Eroare la calcUVM:", e); }
}

// ===================== FISE =====================
let fise = [];
try { fise = JSON.parse(localStorage.getItem('fise_pastoral') || '[]'); } catch(e) { fise = []; }
let currentFisa = null;
let currentFisaIdx = null;
let fisaSpecii = { gram: [], leg: [], div: [], toxic: [] };
let spPickerTarget = null;

function loadFiseList() {
  try {
    const container = document.getElementById('fise-saved');
    if (!container) return;
    if (!fise || !fise.length) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-text">Nicio fișă salvată încă.<br>Apasă „Fișă nouă" pentru a începe.</div></div>`;
      return;
    }
    container.innerHTML = fise.map((f, i) => `
      <div class="fisa-list-item" onclick="editFisa(${i})">
        <button class="fisa-del" onclick="event.stopPropagation();deleteFisa(${i})">🗑</button>
        <div class="fi-header">
          <div class="fi-id">Tr.${f.trPas || '?'} / u.a.${f.ua || '?'}</div>
          <div class="fi-date">${f.data || ''}</div>
        </div>
        <div class="fi-loc">${f.sup ? f.sup+' ha · ' : ''}${f.catFolos || ''} ${f.unitRel ? '· '+f.unitRel : ''}</div>
        <div class="fi-tip">${f.tipPajiste || 'Tip pajiște necompletat'}</div>
      </div>`).join('');
  } catch(e) { console.error("Eroare la loadFiseList:", e); }
}

function newFisa() {
  currentFisa = {
    trPas:'', ua:'', sup:'', grFunct:'', ts:'', catFolos:'Pășune',
    unitRel:'', confTeren:'', incl:'', exp:'', alt:'', unitSol:'',
    tipPajiste:'', acopIerb:'', valPast:'mijlocie', arbusti:'', grAcop:'', raspArb:'',
    vegFor:'', varsta:'', consist:'', raspFor:'', dateCompl:'', lucrExec:'',
    speciiGram:[], speciiLeg:[], speciiDiv:[], speciiToxic:[], data: new Date().toLocaleDateString('ro-RO')
  };
  currentFisaIdx = null;
  fisaSpecii = { gram:[], leg:[], div:[], toxic:[] };
  openFisaForm();
}

function editFisa(idx) {
  if(!fise[idx]) return;
  currentFisa = JSON.parse(JSON.stringify(fise[idx]));
  currentFisaIdx = idx;
  fisaSpecii = {
    gram: currentFisa.speciiGram || [],
    leg: currentFisa.speciiLeg || [],
    div: currentFisa.speciiDiv || [],
    toxic: currentFisa.speciiToxic || []
  };
  openFisaForm();
}

function deleteFisa(idx) {
  if (!confirm('Ștergi fișa?')) return;
  fise.splice(idx, 1);
  localStorage.setItem('fise_pastoral', JSON.stringify(fise));
  loadFiseList();
}

function openFisaForm() {
  document.getElementById('fise-list-view').style.display = 'none';
  document.getElementById('fisa-form-page').style.display = 'block';
  document.getElementById('fisa-form-title').textContent = currentFisaIdx !== null ? `Tr.${currentFisa.trPas}/u.a.${currentFisa.ua}` : 'Fișă nouă';
  renderFisaForm();
}

function closeFisa() {
  document.getElementById('fise-list-view').style.display = 'block';
  document.getElementById('fisa-form-page').style.display = 'none';
  loadFiseList();
}

function onCatFolosChange(select) { if(currentFisa) currentFisa.catFolos = select.value; }
function showArbustiRef() { const el = document.getElementById('arbusti-ref'); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

function addArbust(cod) {
  const input = document.getElementById('f-arbusti');
  if (!input) return;
  let vals = input.value.trim() ? input.value.split(',').map(v=>v.trim()) : [];
  if (!vals.includes(cod)) { vals.push(cod); input.value = vals.join(', '); }
}

function renderChips(target) {
  if (!fisaSpecii[target] || !fisaSpecii[target].length) return `<span style="color:#aaa; font-size:12px; font-style:italic;">Nicio specie adăugată.</span>`;
  const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
  return fisaSpecii[target].map(s => {
    const p = sursaPlante.find(x => x.cod === s.cod);
    if (!p) return '';
    return `
      <span class="plant-chip" style="display:inline-flex; align-items:center; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:16px; padding:4px 10px; margin:4px; font-size:13px; color:#1b5e20;">
        <strong>#${p.cod}</strong>&nbsp;${p.stiintific} (${s.pct}%)
        <button onclick="event.stopPropagation(); removeChip('${target}', ${s.cod})" style="background:none; border:none; margin-left:6px; color:#c62828; font-weight:bold; cursor:pointer; font-size:14px;">&times;</button>
      </span>`;
  }).join('');
}

function removeChip(target, cod) {
  fisaSpecii[target] = fisaSpecii[target].filter(s => s.cod !== cod);
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
}

function openSpeciesPicker(target) {
  spPickerTarget = target;
  const promptCod = prompt("Introdu codul numeric al plantei:");
  if (!promptCod) return;
  const codNum = parseInt(promptCod);
  const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
  const p = sursaPlante.find(x => x.cod === codNum);
  if (!p) { alert("Codul nu a fost găsit în baza locală!"); return; }
  const pct = prompt(`Introdu procentul (%) pentru ${p.stiintific}:`, "10");
  if (pct === null) return;
  fisaSpecii[target].push({ cod: codNum, pct: pct || '?' });
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
}

// ── LISTENERS RIGUROȘI PENTRU PORNIREA INTERFEȚEI ──
function initApp() {
  console.log("Se inițializează interfața...");
  const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
  renderSpecii(sursaPlante);
  renderTipGrid();
  loadFiseList();
  
  // Conectăm și bara de căutare din imagine ca să funcționeze în timp ce tastați
  const sInput = document.getElementById('search-specii');
  if(sInput) { sInput.addEventListener('input', filterSpecii); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function renderFisaForm() {
  const f = currentFisa || {};
  const contentEl = document.getElementById('fisa-form-content');
  if(!contentEl) return;
  contentEl.innerHTML = `
    <div class="form-section">
      <div class="form-section-title">📍 Identificare parcelă</div>
      <div class="form-row">
        <div class="form-field"><label>Tr. Păș.</label><input type="text" id="f-trPas" value="${f.trPas || ''}"></div>
        <div class="form-field"><label>u.a.</label><input type="text" id="f-ua" value="${f.ua || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>Suprafață (ha)</label><input type="number" id="f-sup" value="${f.sup || ''}" step="0.1"></div>
        <div class="form-field"><label>Gr. funcțională</label><input type="text" id="f-grFunct" value="${f.grFunct || ''}"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">🌾 Compoziție Floristică</div>
      <div class="form-field"><label>Tip pajiște</label><input type="text" id="f-tipPajiste" value="${f.tipPajiste || ''}"></div>
    </div>
    <div class="specii-adaugate" id="chips-gram">${renderChips('gram')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('gram')">➕ Adaugă gramineă</button>
    <div class="specii-adaugate" id="chips-leg">${renderChips('leg')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('leg')">➕ Adaugă leguminoasă</button>
    <div class="specii-adaugate" id="chips-div">${renderChips('div')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('div')">➕ Adaugă diversă</button>
    <div class="specii-adaugate" id="chips-toxic">${renderChips('toxic')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('toxic')">➕ Adaugă toxică</button>
    <div style="padding: 20px 10px;"><button class="add-specie-btn" style="background:#2e7d32; color:#fff;" onclick="closeFisa()">Înapoi la listă</button></div>
  `;
}
