/**
 * FIȘIER: app.js
 * Versiune COMPLETĂ și securizată (Mecanism anti-crach + Toate câmpurile din amenajament)
 */

// Inițializare dicționar botanic în siguranță
const BOT_BY_COD = {};
try {
  if (typeof BOTANICAL !== 'undefined' && Array.isArray(BOTANICAL)) {
    BOTANICAL.forEach(b => { if(b && b.cod) BOT_BY_COD[b.cod] = b; });
  }
} catch(e) { console.error("Eroare BOTANICAL:", e); }

function isToxic(categorie) {
  if (!categorie) return false;
  return categorie.toLowerCase().includes('toxice') || categorie.toLowerCase().includes('toxic');
}

function isBalast(categorie) {
  if (!categorie) return false;
  return categorie.toLowerCase().includes('balast') || categorie.toLowerCase().includes('daunatoare');
}

// ===================== NAVIGARE TABS =====================
function showTab(name) {
  try {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetPage = document.getElementById('page-' + name);
    const targetTab = document.getElementById('tab-' + name);
    if (targetPage) targetPage.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
    
    if(name === 'fise') { closeFisa(); }
  } catch(e) { console.error("Eroare showTab:", e); }
}

// ===================== SPECII =====================
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
      html = `<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Nicio specie găsită</div></div>`;
    }
    container.innerHTML = html;
  } catch(e) { console.error("Eroare renderSpecii:", e); }
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
  } catch(e) { console.error("Eroare filterSpecii:", e); }
}

// ===================== CALCULATOR UVM =====================
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
  } catch(e) { console.error("Eroare renderTipGrid:", e); }
}

function selectTip(val) { selectedTip = val; renderTipGrid(); calcUVM(); }

function calcUVM() {
  try {
    if (typeof UVM_TIPURI === 'undefined') return;
    const tip = UVM_TIPURI.find(t => t.val === selectedTip);
    const sup = parseFloat(document.getElementById('uvm-sup')?.value) || 0;
    const zile = parseInt(document.getElementById('uvm-zile')?.value) || 180;
    const val = parseFloat(document.getElementById('uvm-val')?.value) || 0.75;
    const resultEl = document.getElementById('uvm-result');

    if (!tip || !sup) { if(resultEl) resultEl.style.display = 'none'; return; }

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
  } catch(e) { console.error("Eroare calcUVM:", e); }
}

// ===================== GESTIUNE FIȘE PASTORALE =====================
let fise = [];
try { fise = JSON.parse(localStorage.getItem('fise_pastoral') || '[]'); } catch(e) { fise = []; }
let currentFisa = null;
let currentFisaIdx = null;
let fisaSpecii = { gram: [], leg: [], div: [], toxic: [] };

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
  } catch(e) { console.error("Eroare loadFiseList:", e); }
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
  document.getElementById('fisa-form-title').textContent = currentFisaIdx !== null ? `Modifică Tr.${currentFisa.trPas}/u.a.${currentFisa.ua}` : 'Fișă nouă';
  renderFisaForm();
}

function closeFisa() {
  document.getElementById('fise-list-view').style.display = 'block';
  document.getElementById('fisa-form-page').style.display = 'none';
  loadFiseList();
}

// Salvarea datelor din interfață în LocalStorage
function saveFisa() {
  try {
    if (!currentFisa) return;

    // Colectăm valorile din inputuri introduse de utilizator
    currentFisa.trPas = document.getElementById('f-trPas')?.value || '';
    currentFisa.ua = document.getElementById('f-ua')?.value || '';
    currentFisa.sup = document.getElementById('f-sup')?.value || '';
    currentFisa.grFunct = document.getElementById('f-grFunct')?.value || '';
    currentFisa.ts = document.getElementById('f-ts')?.value || '';
    currentFisa.catFolos = document.getElementById('f-catFolos')?.value || 'Pășune';
    currentFisa.unitRel = document.getElementById('f-unitRel')?.value || '';
    currentFisa.confTeren = document.getElementById('f-confTeren')?.value || '';
    
    currentFisa.incl = document.getElementById('f-incl')?.value || '';
    currentFisa.exp = document.getElementById('f-exp')?.value || '';
    currentFisa.alt = document.getElementById('f-alt')?.value || '';
    currentFisa.unitSol = document.getElementById('f-unitSol')?.value || '';
    
    currentFisa.tipPajiste = document.getElementById('f-tipPajiste')?.value || '';
    currentFisa.acopIerb = document.getElementById('f-acopIerb')?.value || '';
    
    currentFisa.valPast = document.getElementById('f-valPast')?.value || 'mijlocie';
    currentFisa.arbusti = document.getElementById('f-arbusti')?.value || '';
    currentFisa.grAcop = document.getElementById('f-grAcop')?.value || '';
    currentFisa.raspArb = document.getElementById('f-raspArb')?.value || '';
    
    currentFisa.vegFor = document.getElementById('f-vegFor')?.value || '';
    currentFisa.varsta = document.getElementById('f-varsta')?.value || '';
    currentFisa.consist = document.getElementById('f-consist')?.value || '';
    currentFisa.raspFor = document.getElementById('f-raspFor')?.value || '';
    
    currentFisa.dateCompl = document.getElementById('f-dateCompl')?.value || '';
    currentFisa.lucrExec = document.getElementById('f-lucrExec')?.value || '';

    // Salvăm listele de specii selectate
    currentFisa.speciiGram = fisaSpecii.gram;
    currentFisa.speciiLeg = fisaSpecii.leg;
    currentFisa.speciiDiv = fisaSpecii.div;
    currentFisa.speciiToxic = fisaSpecii.toxic;

    if (currentFisaIdx !== null) {
      fise[currentFisaIdx] = currentFisa;
    } else {
      fise.push(currentFisa);
    }

    localStorage.setItem('fise_pastoral', JSON.stringify(fise));
    alert('✓ Fișa a fost salvată cu succes!');
    closeFisa();
  } catch(e) {
    console.error("Eroare la salvarea fișei:", e);
    alert('Eroare la salvare: ' + e.message);
  }
}

// Căutare și cipuri specii
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
  const el = document.getElementById('chips-' + target);
  if(el) el.innerHTML = renderChips(target);
}

function openSpeciesPicker(target) {
  const promptCod = prompt("Introdu codul numeric al plantei:");
  if (!promptCod) return;
  const codNum = parseInt(promptCod);
  const sursaPlante = typeof PLANTE !== 'undefined' ? PLANTE : [];
  const p = sursaPlante.find(x => x.cod === codNum);
  if (!p) { alert("Codul nu a fost găsit în baza de date!"); return; }
  const pct = prompt(`Introdu procentul (%) pentru ${p.stiintific}:`, "10");
  if (pct === null) return;
  fisaSpecii[target].push({ cod: codNum, pct: pct || '?' });
  const el = document.getElementById('chips-' + target);
  if(el) el.innerHTML = renderChips(target);
}

function showArbustiRef() { const el = document.getElementById('arbusti-ref'); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }
function addArbust(cod) {
  const input = document.getElementById('f-arbusti');
  if (!input) return;
  let vals = input.value.trim() ? input.value.split(',').map(v=>v.trim()) : [];
  if (!vals.includes(cod)) { vals.push(cod); input.value = vals.join(', '); }
}

// RENDER FORMULAR COMPLET (Identic cu macheta originală de teren)
function renderFisaForm() {
  const f = currentFisa || {};
  const contentEl = document.getElementById('fisa-form-content');
  if(!contentEl) return;
  
  contentEl.innerHTML = `
    <div class="form-section">
      <div class="form-section-title">📍 IDENTIFICARE PARCELĂ</div>
      <div class="form-row">
        <div class="form-field"><label>TR. PĂȘ.</label><input type="text" id="f-trPas" value="${f.trPas || ''}"></div>
        <div class="form-field"><label>U.A.</label><input type="text" id="f-ua" value="${f.ua || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>SUPRAFAȚĂ (HA)</label><input type="number" id="f-sup" value="${f.sup || ''}" step="0.1"></div>
        <div class="form-field"><label>GR. FUNCȚIONALĂ</label><input type="text" id="f-grFunct" value="${f.grFunct || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>TIP STAȚIUNE (T.S.)</label><input type="text" id="f-ts" value="${f.ts || ''}"></div>
        <div class="form-field"><label>CATEG. FOLOSINȚĂ</label>
          <select id="f-catFolos">
            <option ${f.catFolos==='Pășune'?'selected':''}>Pășune</option>
            <option ${f.catFolos==='Pășune cu arbori'?'selected':''}>Pășune cu arbori</option>
            <option ${f.catFolos==='Fânețe'?'selected':''}>Fânețe</option>
            <option ${f.catFolos==='Pășune împădurită'?'selected':''}>Pășune împădurită</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>UNITATE RELIEF</label><input type="text" id="f-unitRel"
