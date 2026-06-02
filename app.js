/**
 * FIȘIER: app.js
 * Versiune completă, reparată și optimizată pentru GitHub Pages
 */

const BOT_BY_COD = {};
BOTANICAL.forEach(b => { BOT_BY_COD[b.cod] = b; });

// Enhanced plant modal with botanical data
function openPlantModal(cod) {
  const p = PLANTE.find(x => x.cod === cod);
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

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-cod ${codCls}">#${p.cod}</div>
    <div class="modal-stiintific">${p.stiintific}</div>
    <div class="modal-popular">${p.popular}</div>
    <div class="modal-cat ${catCls}">${p.categorie}</div>
    ${toxic ? '<div style="background:#fff0f0;border:1.5px solid #c0392b;border-radius:8px;padding:12px;color:#c0392b;font-size:13px;font-family:var(--font-mono)">⚠️ SPECIE TOXICĂ — poate dăuna animalelor</div>' : ''}
    ${botHtml}
    ${!bot ? '<div style="font-family:var(--font-mono);font-size:11px;color:#bbb;margin-top:12px">Fișă botanică indisponibilă pentru această specie în versiunea PDF redusă.</div>' : ''}
  `;
  document.getElementById('plant-modal').classList.add('open');
}

// ===================== TABS =====================
function showTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ===================== SPECII =====================
function renderSpecii(list) {
  const container = document.getElementById('specii-list');
  let html = '';
  let lastCat = null;

  list.forEach(p => {
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

  if (!list.length) {
    html = `<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">Nicio specie găsită</div></div>`;
  }
  container.innerHTML = html;
}

function filterSpecii() {
  const q = document.getElementById('search-specii').value.toLowerCase().trim();
  if (!q) { renderSpecii(PLANTE); return; }
  const filtered = PLANTE.filter(p =>
    String(p.cod) === q ||
    p.stiintific.toLowerCase().includes(q) ||
    p.popular.toLowerCase().includes(q)
  );
  renderSpecii(filtered);
}

function closePlantModal(e) {
  if (!e || e.target === document.getElementById('plant-modal')) {
    document.getElementById('plant-modal').classList.remove('open');
  }
}

// ===================== UVM =====================
let selectedTip = null;

function renderTipGrid() {
  const grid = document.getElementById('tip-grid');
  grid.innerHTML = UVM_TIPURI.map(t => `
    <div class="tip-badge ${selectedTip === t.val ? 'selected' : ''}" onclick="selectTip('${t.val}')">
      <div class="tb-label">${t.label}</div>
      <div class="tb-range">${t.zona}</div>
      <div class="tb-uvm">${t.uvm_min}–${t.uvm_max} UVM/ha</div>
    </div>
  `).join('');
}

function selectTip(val) {
  selectedTip = val;
  renderTipGrid();
  calcUVM();
}

function calcUVM() {
  const tip = UVM_TIPURI.find(t => t.val === selectedTip);
  const sup = parseFloat(document.getElementById('uvm-sup').value) || 0;
  const zile = parseInt(document.getElementById('uvm-zile').value) || 180;
  const val = parseFloat(document.getElementById('uvm-val').value) || 0.75;

  if (!tip || !sup) {
    document.getElementById('uvm-result').style.display = 'none';
    return;
  }

  const uvmMid = (tip.uvm_min + tip.uvm_max) / 2;
  const uvmAdj = uvmMid * val;
  const totalMin = tip.uvm_min * val * sup;
  const totalMax = tip.uvm_max * val * sup;
  const totalMid = uvmAdj * sup;

  const unb = (totalMid * zile / 365).toFixed(1);

  document.getElementById('uvm-result').style.display = 'block';
  document.getElementById('uvm-result').innerHTML = `
    <div class="big-number">${totalMid.toFixed(1)}</div>
    <div class="big-label">UVM total (mijloc)</div>
    <div class="uvm-details">
      <div class="uvm-detail-item">
        <div class="dl">Interval UVM</div>
        <div class="dv">${totalMin.toFixed(1)} – ${totalMax.toFixed(1)}</div>
      </div>
      <div class="uvm-detail-item">
        <div class="dl">UVM/ha ajustat</div>
        <div class="dv">${uvmAdj.toFixed(2)}</div>
      </div>
      <div class="uvm-detail-item">
        <div class="dl">Suprafață</div>
        <div class="dv">${sup} ha</div>
      </div>
      <div class="uvm-detail-item">
        <div class="dl">Zile × UNB</div>
        <div class="dv">${unb} UNB/an</div>
      </div>
    </div>
  `;
}

// ===================== FISE =====================
let fise = JSON.parse(localStorage.getItem('fise_pastoral') || '[]');
let currentFisa = null;
let currentFisaIdx = null;
let fisaSpecii = { gram: [], leg: [], div: [], toxic: [] };
let fisaLucrari = [];
let spPickerTarget = null;
let fisaEroziune = [];

function loadFiseList() {
  const container = document.getElementById('fise-saved');
  if (!fise.length) {
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
    </div>
  `).join('');
}

function newFisa() {
  currentFisa = {
    trPas:'', ua:'', sup:'', grFunct:'', ts:'', catFolos:'Pășune',
    unitRel:'', confTeren:'', incl:'', exp:'', alt:'', unitSol:'',
    tipPajiste:'', acopIerb:'', valPast:'mijlocie',
    arbusti:'', grAcop:'', raspArb:'',
    vegFor:'', varsta:'', consist:'', raspFor:'',
    dateCompl:'', lucrExec:'',
    speciiGram:[], speciiLeg:[], speciiDiv:[], speciiToxic:[],
    lucrari:[], eroziune:[], data: new Date().toLocaleDateString('ro-RO'),
    piUnitRelief:'', piConf:'', piIncl:'', piExp:'', piAlt:'',
    piTipFlora:'', piTipSol:'', piVarstaExpl:'', piDistDrum:'',
    piSemintis:'', piDateCompl:'', piLucrExec:'', piLucrPropuse:'',
    piArboret:'', piArboretList:[], lucrExecCod:''
  };
  currentFisaIdx = null;
  fisaSpecii = { gram:[], leg:[], div:[], toxic:[] };
  fisaLucrari = [];
  fisaEroziune = [];
  openFisaForm();
}

function editFisa(idx) {
  currentFisa = JSON.parse(JSON.stringify(fise[idx]));
  currentFisaIdx = idx;
  fisaSpecii = {
    gram: currentFisa.speciiGram || [],
    leg: currentFisa.speciiLeg || [],
    div: currentFisa.speciiDiv || [],
    toxic: currentFisa.speciiToxic || []
  };
  fisaLucrari = currentFisa.lucrari || [];
  fisaEroziune = currentFisa.eroziune || [];
  openFisaForm();
}

function deleteFisa(idx) {
  if (!confirm('Ștergi fișa?')) return;
  fise.splice(idx, 1);
  localStorage.setItem('fise_pastoral', JSON.stringify(fise));
  loadFiseList();
  toast('Fișă ștearsă');
}

function openFisaForm() {
  document.getElementById('fise-list-view').style.display = 'none';
  document.getElementById('fisa-form-page').style.display = 'block';
  document.getElementById('fisa-form-title').textContent =
    currentFisaIdx !== null ? `Tr.${currentFisa.trPas}/u.a.${currentFisa.ua}` : 'Fișă nouă';
  renderFisaForm();
}

function closeFisa() {
  document.getElementById('fise-list-view').style.display = 'block';
  document.getElementById('fisa-form-page').style.display = 'none';
  loadFiseList();
}

// Funcții auxiliare obligatorii pentru randarea corectă a interfeței
function onCatFolosChange(select) {
  if(currentFisa) currentFisa.catFolos = select.value;
}
function showArbustiRef() {
  const el = document.getElementById('arbusti-ref');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function addArbust(cod) {
  const input = document.getElementById('f-arbusti');
  let vals = input.value.trim() ? input.value.split(',').map(v=>v.trim()) : [];
  if (!vals.includes(cod)) {
    vals.push(cod);
    input.value = vals.join(', ');
  }
}

function renderChips(target) {
  if (!fisaSpecii[target] || !fisaSpecii[target].length) {
    return `<span style="color:#aaa; font-size:12px; font-style:italic;">Nicio specie adăugată.</span>`;
  }
  return fisaSpecii[target].map(s => {
    const p = PLANTE.find(x => x.cod === s.cod);
    if (!p) return '';
    return `
      <span class="plant-chip" style="display:inline-flex; align-items:center; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:16px; padding:4px 10px; margin:4px; font-size:13px; color:#1b5e20;">
        <strong>#${p.cod}</strong>&nbsp;${p.stiintific} (${s.pct}%)
        <button onclick="removeChip('${target}', ${s.cod})" style="background:none; border:none; margin-left:6px; color:#c62828; font-weight:bold; cursor:pointer; font-size:14px;">&times;</button>
      </span>`;
  }).join('');
}

function removeChip(target, cod) {
  fisaSpecii[target] = fisaSpecii[target].filter(s => s.cod !== cod);
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
}

function openSpeciesPicker(target) {
  spPickerTarget = target;
  const promptCod = prompt("Introdu codul numeric al plantei din listă:");
  if (!promptCod) return;
  const codNum = parseInt(promptCod);
  const p = PLANTE.find(x => x.cod === codNum);
  if (!p) { alert("Codul nu a fost găsit în baza locală!"); return; }
  
  const pct = prompt(`Introdu procentul (%) pentru ${p.stiintific}:`, "10");
  if (pct === null) return;
  
  fisaSpecii[target].push({ cod: codNum, pct: pct || '?' });
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
}

function toast(msg) {
  alert(msg); // Implementare simplă de notificare, înlocuibilă cu UI custom
}

function renderFisaForm() {
  const f = currentFisa;
  document.getElementById('fisa-form-content').innerHTML = `
    <div class="form-section">
      <div class="form-section-title">📍 Identificare parcelă</div>
      <div class="form-row">
        <div class="form-field">
          <label>Tr. Păș.</label>
          <input type="text" id="f-trPas" value="${f.trPas || ''}" placeholder="ex: 1">
        </div>
        <div class="form-field">
          <label>u.a.</label>
          <input type="text" id="f-ua" value="${f.ua || ''}" placeholder="ex: 1A">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Suprafață (ha)</label>
          <input type="number" id="f-sup" value="${f.sup || ''}" placeholder="ex: 12.5" step="0.1">
        </div>
        <div class="form-field">
          <label>Gr. funcțională</label>
          <input type="text" id="f-grFunct" value="${f.grFunct || ''}" placeholder="ex: II-PP">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Tip stațiune (T.S.)</label>
          <input type="text" id="f-ts" value="${f.ts || ''}" placeholder="ex: 52331">
        </div>
        <div class="form-field">
          <label>Categ. folosință</label>
          <select id="f-catFolos" onchange="onCatFolosChange(this)">
            <option ${f.catFolos==='Pășune'?'selected':''}>Pășune</option>
            <option ${f.catFolos==='Pășune cu arbori'?'selected':''}>Pășune cu arbori</option>
            <option ${f.catFolos==='Fânețe'?'selected':''}>Fânețe</option>
            <option ${f.catFolos==='Pășune împădurită'?'selected':''}>Pășune împădurită</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Unitate relief</label>
          <input type="text" id="f-unitRel" value="${f.unitRel || ''}" placeholder="ex: Versant inf.">
        </div>
        <div class="form-field">
          <label>Conf. teren</label>
          <select id="f-confTeren">
            <option ${f.confTeren==='plană'?'selected':''}>plană</option>
            <option ${f.confTeren==='ondulată'?'selected':''}>ondulată</option>
            <option ${f.confTeren==='frământată'?'selected':''}>frământată</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">🌡 Date staționale</div>
      <div class="form-row">
        <div class="form-field">
          <label>Înclinare (°)</label>
          <input type="number" id="f-incl" value="${f.incl || ''}" placeholder="0–45">
        </div>
        <div class="form-field">
          <label>Expoziție</label>
          <select id="f-exp">
            ${['','N','NE','E','SE','S','SV','V','NV','Plat'].map(e=>`<option ${f.exp===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Altitudine (m)</label>
          <input type="number" id="f-alt" value="${f.alt || ''}" placeholder="ex: 650">
        </div>
        <div class="form-field">
          <label>Unitate sol</label>
          <input type="text" id="f-unitSol" value="${f.unitSol || ''}" placeholder="ex: Brun acid tipic">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">🌿 Tip pajiște și acoperire</div>
      <div class="form-field">
        <label>Tip pajiște (asoc. fitocen.)</label>
        <input type="text" id="f-tipPajiste" value="${f.tipPajiste || ''}" placeholder="ex: Agrostis capillaris – Nardus stricta">
      </div>
      <div class="form-field">
        <label>Acoperire ierbacee (%)</label>
        <input type="number" id="f-acopIerb" value="${f.acopIerb || ''}" placeholder="0–100" min="0" max="100">
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">🌾 Graminee</div>
      <div class="form-field">
        <label>Total % graminee</label>
        <input type="number" id="f-gramTotal" value="${f.gramTotal||''}" placeholder="ex: 65" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-gram">${renderChips('gram')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('gram')">➕ Adaugă specie gramineă</button>
    <button class="add-specie-btn" onclick="openCameraModal('gram')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:4px">📷 Identifică gramineă cu camera</button>

    <div class="form-section">
      <div class="form-section-title">🍀 Leguminoase</div>
      <div class="form-field">
        <label>Total % leguminoase</label>
        <input type="number" id="f-legTotal" value="${f.legTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-leg">${renderChips('leg')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('leg')">➕ Adaugă specie leguminoasă</button>
    <button class="add-specie-btn" onclick="openCameraModal('leg')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:4px">📷 Identifică leguminoasă cu camera</button>

    <div class="form-section">
      <div class="form-section-title">🌼 Diverse + Balast</div>
      <div class="form-field">
        <label>Total % diverse + balast</label>
        <input type="number" id="f-divTotal" value="${f.divTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-div">${renderChips('div')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('div')">➕ Adaugă specie diversă</button>
    <button class="add-specie-btn" onclick="openCameraModal('div')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:4px">📷 Identifică plantă diversă cu camera</button>

    <div class="form-section">
      <div class="form-section-title" style="color:var(--red-toxic, #c0392b)">⚠️ Plante toxice + dăunătoare</div>
      <div class="form-field">
        <label>Total % toxice</label>
        <input type="number" id="f-toxicTotal" value="${f.toxicTotal||''}" placeholder="ex: 5" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-toxic">${renderChips('toxic')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('toxic')">➕ Adaugă specie toxică</button>
    <button class="add-specie-btn" onclick="openCameraModal('toxic')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:4px">📷 Identifică plantă toxică cu camera</button>

    <div class="form-section">
      <div class="form-section-title">⭐ Valoare pastorală și arbuști</div>
      <div class="form-field">
        <label>Valoare pastorală</label>
        <select id="f-valPast">
          <option ${f.valPast==='bună'?'selected':''}>bună</option>
          <option ${f.valPast==='mijlocie'?'selected':''}>mijlocie</option>
