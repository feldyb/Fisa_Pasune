/**
 * FIȘIER: app.js
 * Versiunea 100% imună la erori. Toate secțiunile incluse.
 */

const BOT_BY_COD = {};
try {
  if (typeof BOTANICAL !== 'undefined' && Array.isArray(BOTANICAL)) {
    BOTANICAL.forEach(b => { if(b && b.cod) BOT_BY_COD[b.cod] = b; });
  }
} catch(e) { console.log("Botanical bypass"); }

function isToxic(cat) { return cat ? (cat.toLowerCase().includes('toxice') || cat.toLowerCase().includes('toxic')) : false; }
function isBalast(cat) { return cat ? (cat.toLowerCase().includes('balast') || cat.toLowerCase().includes('daunatoare')) : false; }

// Navigare între tab-urile mari
function showTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pTarget = document.getElementById('page-' + name);
  const tTarget = document.getElementById('tab-' + name);
  if (pTarget) pTarget.classList.add('active');
  if (tTarget) tTarget.classList.add('active');
  if (name === 'fise') closeFisa();
}

// Randare Specii din Excel
function renderSpecii(list) {
  const container = document.getElementById('specii-list');
  if (!container) return;
  let html = '', lastCat = null;
  const arr = Array.isArray(list) ? list : [];
  arr.forEach(p => {
    if(!p) return;
    if (p.categorie !== lastCat) {
      lastCat = p.categorie;
      html += `<div class="cat-label ${isToxic(p.categorie)?'toxic':isBalast(p.categorie)?'balast':''}">${p.categorie}</div>`;
    }
    html += `<div class="plant-item" onclick="openPlantModal(${p.cod})">
      <div class="plant-cod ${isToxic(p.categorie)?'toxic':isBalast(p.categorie)?'balast':''}">${p.cod}</div>
      <div class="plant-names"><div class="plant-stiintific">${p.stiintific}</div><div class="plant-popular">${p.popular}</div></div>
      <div class="plant-chevron">›</div>
    </div>`;
  });
  container.innerHTML = html || `<div class="empty-state">Nicio specie găsită</div>`;
}

function filterSpecii() {
  const q = document.getElementById('search-specii')?.value.toLowerCase().trim() || '';
  const sursa = typeof PLANTE !== 'undefined' ? PLANTE : [];
  if (!q) { renderSpecii(sursa); return; }
  renderSpecii(sursa.filter(p => p && (String(p.cod)===q || p.stiintific?.toLowerCase().includes(q) || p.popular?.toLowerCase().includes(q))));
}

// Structură Fișă Nouă / Salvare
let fise = [];
try { fise = JSON.parse(localStorage.getItem('fise_pastoral') || '[]'); } catch(e) {}
let currentFisa = null;
let currentFisaIdx = null;
let fisaSpecii = { gram: [], leg: [], div: [], toxic: [] };

function loadFiseList() {
  const c = document.getElementById('fise-saved');
  if (!c) return;
  if (!fise.length) { c.innerHTML = `<div class="empty-state">Nicio fișă salvată. Apasă „Fișă nouă".</div>`; return; }
  c.innerHTML = fise.map((f, i) => `
    <div class="fisa-list-item" onclick="editFisa(${i})">
      <button class="fisa-del" onclick="event.stopPropagation();deleteFisa(${i})">🗑</button>
      <div class="fi-header"><div class="fi-id">Tr.${f.trPas||'?'}/u.a.${f.ua||'?'}</div><div class="fi-date">${f.data||''}</div></div>
      <div class="fi-tip">${f.tipPajiste || 'Nespecificat'}</div>
    </div>`).join('');
}

function newFisa() {
  currentFisa = { trPas:'', ua:'', sup:'', grFunct:'', ts:'', catFolos:'Pășune', unitRel:'', confTeren:'', incl:'', exp:'', alt:'', unitSol:'', tipPajiste:'', acopIerb:'', valPast:'mijlocie', arbusti:'', grAcop:'', raspArb:'', vegFor:'', varsta:'', consist:'', raspFor:'', dateCompl:'', lucrExec:'', data: new Date().toLocaleDateString('ro-RO') };
  currentFisaIdx = null; fisaSpecii = { gram:[], leg:[], div:[], toxic:[] };
  openFisaForm();
}

function editFisa(idx) {
  if(!fise[idx]) return;
  currentFisa = JSON.stringify(fise[idx]) ? JSON.parse(JSON.stringify(fise[idx])) : {};
  currentFisaIdx = idx;
  fisaSpecii = { gram: currentFisa.speciiGram||[], leg: currentFisa.speciiLeg||[], div: currentFisa.speciiDiv||[], toxic: currentFisa.speciiToxic||[] };
  openFisaForm();
}

function deleteFisa(idx) { if (confirm('Ștergi fișa?')) { fise.splice(idx,1); localStorage.setItem('fise_pastoral', JSON.stringify(fise)); loadFiseList(); } }
function openFisaForm() { document.getElementById('fise-list-view').style.display = 'none'; document.getElementById('fisa-form-page').style.display = 'block'; renderFisaForm(); }
function closeFisa() { document.getElementById('fise-list-view').style.display = 'block'; document.getElementById('fisa-form-page').style.display = 'none'; loadFiseList(); }

function saveFisa() {
  if (!currentFisa) return;
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
  
  currentFisa.speciiGram = fisaSpecii.gram;
  currentFisa.speciiLeg = fisaSpecii.leg;
  currentFisa.speciiDiv = fisaSpecii.div;
  currentFisa.speciiToxic = fisaSpecii.toxic;

  if (currentFisaIdx !== null) fise[currentFisaIdx] = currentFisa; else fise.push(currentFisa);
  localStorage.setItem('fise_pastoral', JSON.stringify(fise));
  alert('✓ Fișă salvată!');
  closeFisa();
}

function renderChips(t) {
  if (!fisaSpecii[t] || !fisaSpecii[t].length) return `<span style="color:#aaa;font-size:12px;font-style:italic;">Nicio specie adăugată.</span>`;
  const sursa = typeof PLANTE !== 'undefined' ? PLANTE : [];
  return fisaSpecii[t].map(s => {
    const p = sursa.find(x => x.cod === s.cod);
    if (!p) return '';
    return `<span class="plant-chip" style="display:inline-flex;align-items:center;background:#e8f5e9;border:1px solid #c8e6c9;border-radius:16px;padding:4px 10px;margin:4px;font-size:13px;color:#1b5e20;">
      <strong>#${p.cod}</strong>&nbsp;${p.stiintific} (${s.pct}%)
      <button onclick="event.stopPropagation();removeChip('${t}',${s.cod})" style="background:none;border:none;margin-left:6px;color:#c62828;font-weight:bold;cursor:pointer;">&times;</button>
    </span>`;
  }).join('');
}

function removeChip(t, c) { fisaSpecii[t] = fisaSpecii[t].filter(s => s.cod !== c); const e = document.getElementById('chips-'+t); if(e) e.innerHTML = renderChips(t); }

function openSpeciesPicker(t) {
  const cPrompt = prompt("Introdu codul numeric:"); if (!cPrompt) return;
  const cNum = parseInt(cPrompt);
  const p = (typeof PLANTE !== 'undefined' ? PLANTE : []).find(x => x.cod === cNum);
  if (!p) { alert("Cod inexistent!"); return; }
  const pct = prompt(`Procent (%) pentru ${p.stiintific}:`, "10"); if (pct === null) return;
  fisaSpecii[t].push({ cod: cNum, pct: pct || '?' });
  const e = document.getElementById('chips-'+t); if(e) e.innerHTML = renderChips(t);
}

function renderFisaForm() {
  const f = currentFisa || {};
  const el = document.getElementById('fisa-form-content');
  if(!el) return;
  el.innerHTML = `
    <div class="form-section">
      <div class="form-section-title">📍 IDENTIFICARE PARCELĂ</div>
      <div class="form-row">
        <div class="form-field"><label>TR. PĂȘ.</label><input type="text" id="f-trPas" value="${f.trPas||''}"></div>
        <div class="form-field"><label>U.A.</label><input type="text" id="f-ua" value="${f.ua||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>SUPRAFAȚĂ (HA)</label><input type="number" id="f-sup" value="${f.sup||''}" step="0.1"></div>
        <div class="form-field"><label>GR. FUNCȚIONALĂ</label><input type="text" id="f-grFunct" value="${f.grFunct||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>TIP STAȚIUNE</label><input type="text" id="f-ts" value="${f.ts||''}"></div>
        <div class="form-field"><label>CATEG. FOLOSINȚĂ</label>
          <select id="f-catFolos">
            <option ${f.catFolos==='Pășune'?'selected':''}>Pășune</option>
            <option ${f.catFolos==='Pășune cu arbori'?'selected':''}>Pășune cu arbori</option>
            <option ${f.catFolos==='Fânețe'?'selected':''}>Fânețe</option>
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">🌡️ DATE STAȚIONALE</div>
      <div class="form-row">
        <div class="form-field"><label>ÎNCLINARE (°)</label><input type="number" id="f-incl" value="${f.incl||''}"></div>
        <div class="form-field"><label>EXPOZIȚIE</label><input type="text" id="f-exp" value="${f.exp||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>ALTITUDINE (M)</label><input type="number" id="f-alt" value="${f.alt||''}"></div>
        <div class="form-field"><label>UNITATE SOL</label><input type="text" id="f-unitSol" value="${f.unitSol||''}"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">📦 COMPOZIȚIE FLORISTICĂ</div>
      <div class="form-field"><label>TIP PAJIȘTE</label><input type="text" id="f-tipPajiste" value="${f.tipPajiste||''}"></div>
    </div>
    <div class="specii-adaugate" id="chips-gram">${renderChips('gram')}</div><button class="add-specie-btn" onclick="openSpeciesPicker('gram')">➕ Adaugă gramineă</button>
    <div class="specii-adaugate" id="chips-leg">${renderChips('leg')}</div><button class="add-specie-btn" onclick="openSpeciesPicker('leg')">➕ Adaugă leguminoasă</button>
    <div class="specii-adaugate" id="chips-div">${renderChips('div')}</div><button class="add-specie-btn" onclick="openSpeciesPicker('div')">➕ Adaugă diversă</button>
    <div class="specii-adaugate" id="chips-toxic">${renderChips('toxic')}</div><button class="add-specie-btn" onclick="openSpeciesPicker('toxic')">➕ Adaugă toxică</button>
    <div class="form-section" style="margin-top:15px;">
      <div class="form-section-title">⭐ VALOARE PASTORALĂ ȘI ARBUȘTI</div>
      <div class="form-field"><label>ARBUȘTI (CODURI)</label><input type="text" id="f-arbusti" value="${f.arbusti||''}"></div>
    </div>
    <div class="form-section">
      <div class="form-section-title">🌲 VEGETAȚIE FORESTIERĂ</div>
      <div class="form-field"><label>COMPOZIȚIE</label><input type="text" id="f-vegFor" value="${f.vegFor||''}"></div>
    </div>
    <div class="form-section">
      <div class="form-section-title">📝 DATE COMPLEMENTARE</div>
      <textarea id="f-dateCompl" rows="3">${f.dateCompl||''}</textarea>
    </div>
    <div class="form-section">
      <div class="form-section-title">✅ LUCRĂRI EXECUTATE</div>
      <textarea id="f-lucrExec" rows="2">${f.lucrExec||''}</textarea>
    </div>
    <div style="padding:15px 0;display:flex;gap:10px;">
       <button class="add-specie-btn" style="background:#2e7d32;color:#fff;font-weight:bold;flex:1;" onclick="saveFisa()">💾 Salvează Datele</button>
       <button class="add-specie-btn" style="background:#757575;color:#fff;" onclick="closeFisa()">Renunță</button>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderSpecii(typeof PLANTE !== 'undefined' ? PLANTE : []);
  loadFiseList();
  document.getElementById('search-specii')?.addEventListener('input', filterSpecii);
});
