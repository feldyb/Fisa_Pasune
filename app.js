/**
 * FIȘIER: app.js
 * Versiune completă și securizată (Integrare locală cu identificare.php)
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

  // UNB = cap pășunat * zile / 365
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

function renderFisaForm() {
  const f = currentFisa;
  document.getElementById('fisa-form-content').innerHTML = `
    <div class="form-section">
      <div class="form-section-title">📍 Identificare parcelă</div>
      <div class="form-row">
        <div class="form-field">
          <label>Tr. Păș.</label>
          <input type="text" id="f-trPas" value="${f.trPas}" placeholder="ex: 1">
        </div>
        <div class="form-field">
          <label>u.a.</label>
          <input type="text" id="f-ua" value="${f.ua}" placeholder="ex: 1A">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Suprafață (ha)</label>
          <input type="number" id="f-sup" value="${f.sup}" placeholder="ex: 12.5" step="0.1">
        </div>
        <div class="form-field">
          <label>Gr. funcțională</label>
          <input type="text" id="f-grFunct" value="${f.grFunct}" placeholder="ex: II-PP">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Tip stațiune (T.S.)</label>
          <input type="text" id="f-ts" value="${f.ts}" placeholder="ex: 52331">
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
          <input type="text" id="f-unitRel" value="${f.unitRel}" placeholder="ex: Versant inf.">
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
          <input type="number" id="f-incl" value="${f.incl}" placeholder="0–45">
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
          <input type="number" id="f-alt" value="${f.alt}" placeholder="ex: 650">
        </div>
        <div class="form-field">
          <label>Unitate sol</label>
          <input type="text" id="f-unitSol" value="${f.unitSol}" placeholder="ex: Brun acid tipic">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">🌿 Tip pajiște și acoperire</div>
      <div class="form-field">
        <label>Tip pajiște (asoc. fitocen.)</label>
        <input type="text" id="f-tipPajiste" value="${f.tipPajiste}" placeholder="ex: Agrostis capillaris – Nardus stricta">
      </div>
      <div class="form-field">
        <label>Acoperire ierbacee (%)</label>
        <input type="number" id="f-acopIerb" value="${f.acopIerb}" placeholder="0–100" min="0" max="100">
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
    <button class="add-specie-btn" onclick="openCameraModal('gram')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:2px">📷 Identifică gramineă cu camera</button>

    <div class="form-section">
      <div class="form-section-title">🍀 Leguminoase</div>
      <div class="form-field">
        <label>Total % leguminoase</label>
        <input type="number" id="f-legTotal" value="${f.legTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-leg">${renderChips('leg')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('leg')">➕ Adaugă specie leguminoasă</button>
    <button class="add-specie-btn" onclick="openCameraModal('leg')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:2px">📷 Identifică leguminoasă cu camera</button>

    <div class="form-section">
      <div class="form-section-title">🌼 Diverse + Balast</div>
      <div class="form-field">
        <label>Total % diverse + balast</label>
        <input type="number" id="f-divTotal" value="${f.divTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-div">${renderChips('div')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('div')">➕ Adaugă specie diversă</button>
    <button class="add-specie-btn" onclick="openCameraModal('div')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:2px">📷 Identifică plantă diversă cu camera</button>

    <div class="form-section">
      <div class="form-section-title" style="color:var(--red-toxic)">⚠️ Plante toxice + dăunătoare</div>
      <div class="form-field">
        <label>Total % toxice</label>
        <input type="number" id="f-toxicTotal" value="${f.toxicTotal||''}" placeholder="ex: 5" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-toxic">${renderChips('toxic')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('toxic')">➕ Adaugă specie toxică</button>
    <button class="add-specie-btn" onclick="openCameraModal('toxic')" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:2px">📷 Identifică plantă toxică cu camera</button>

    <div class="form-section">
      <div class="form-section-title">🌲 Vegetație forestieră</div>
      <div class="form-field">
        <label>Compoziție (ex: 5MO3ANN2DM)</label>
        <input type="text" id="f-vegFor" value="${f.vegFor}" placeholder="ex: 5MO3ANN2DM">
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Vârsta (ani)</label>
          <input type="number" id="f-varsta" value="${f.varsta}" placeholder="ex: 25">
        </div>
        <div class="form-field">
          <label>Consistență</label>
          <input type="text" id="f-consist" value="${f.consist}" placeholder="ex: 0.4">
        </div>
      </div>
      <div class="form-field">
        <label>Răspândire / Volum (m³)</label>
        <input type="text" id="f-raspFor" value="${f.raspFor}" placeholder="ex: pâlcuri / 45 m³">
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">📝 Date complementare</div>
      <div class="form-field">
        <label>Observații teren</label>
        <textarea id="f-dateCompl" placeholder="mușuroaie, exces umiditate, vegetație lemnoasă pe pârâu etc.">${f.dateCompl}</textarea>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">✅ Lucrări executate anterior</div>
      <div class="form-field">
        <textarea id="f-lucrExec" placeholder="descriere lucrări anterioare">${f.lucrExec}</textarea>
      </div>
    </div>
  `;
}

// ── PLANTNET CAMERA (VARIANTA OPTIMIZATĂ CU PROXY CORS PENTRU GITHUB) ───────────
const PLANTNET_KEY = '2b10Qq1LQb6AOnIw2QXcWdMqOe'; 
let camTarget = null; 

function openCameraModal(target) {
  camTarget = target || null;
  document.getElementById('cam-preview').style.display = 'none';
  document.getElementById('cam-status').textContent = 'Fă o poză clară a frunzelor sau florii plantei';
  document.getElementById('cam-loading').style.display = 'none';
  document.getElementById('cam-results').innerHTML = '';
  document.getElementById('cam-input').value = '';
  document.getElementById('camera-modal').classList.add('open');
}

function closeCameraModal() {
  document.getElementById('camera-modal').classList.remove('open');
}

async function handleCamPhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById('cam-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';

  document.getElementById('cam-loading').style.display = 'block';
  document.getElementById('cam-results').innerHTML = '';
  document.getElementById('cam-status').textContent = 'Se identifică planta prin Proxy CORS, așteaptă...';

  try {
    const formData = new FormData();
    formData.append('images', file);
    formData.append('organs', 'auto');

    const targetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_KEY}&lang=ro&nb-results=5`;
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

    const resp = await fetch(proxyUrl + targetUrl, { 
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    document.getElementById('cam-loading').style.display = 'none';

    if (resp.status === 403) {
      document.getElementById('cam-status').innerHTML = `
        <div style="background:#fff3cd; color:#664d03; padding:10px; border-radius:6px; font-size:12px; border:1px solid #ffecb5; line-height:1.4">
          ⚠️ <strong>Necesită activare proxy temporară:</strong><br>
          Pentru a folosi camera de pe GitHub Pages, dă click o singură dată pe link-ul de mai jos, apasă butonul <strong>"Request temporary access to demo server"</strong>, apoi revino în aplicație și reîncearcă poza:<br><br>
          <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" style="color:#0d6efd; font-weight:bold; text-decoration:underline">Apasă aici pentru Activare Proxy</a>
        </div>`;
      return;
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      document.getElementById('cam-status').textContent = `❌ Eroare server (${resp.status}): ${err.message || 'Problemă la identificare'}`;
      return;
    }

    const data = await resp.json();
    document.getElementById('cam-status').textContent = '';
    renderPlantNetResults(data.results || []);

  } catch(e) {
    document.getElementById('cam-loading').style.display = 'none';
    document.getElementById('cam-status').textContent = `❌ Conexiunea a fost blocată de CORS sau rețea.`;
    console.error(e);
  }
}

function renderPlantNetResults(results) {
  const container = document.getElementById('cam-results');
  if (!results.length) {
    container.innerHTML = '<div class="cam-no-match">Nicio plantă identificată. Încearcă o poză mai clară.</div>';
    return;
  }

  let html = `<div style="font-family:var(--font-mono);font-size:11px;color:#888;margin-bottom:8px">Atinge un rezultat pentru a-l adăuga în fișă:</div>`;

  results.forEach(r => {
    const sciName = r.species?.scientificNameWithoutAuthor || '';
    const commonNames = r.species?.commonNames || [];
    const score = Math.round((r.score || 0) * 100);
    const genus = sciName.split(' ')[0].toLowerCase();
    const sp2 = sciName.split(' ')[1]?.toLowerCase() || '';

    let excelMatch = PLANTE.find(p => {
      const pg = p.stiintific.split(' ')[0].toLowerCase();
      const ps = (p.stiintific.split(' ')[1] || '').toLowerCase();
      return pg === genus && ps === sp2;
    });
    
    if (!excelMatch) {
      excelMatch = PLANTE.find(p => p.stiintific.split(' ')[0].toLowerCase() === genus);
    }

    const toxic = excelMatch && isToxic(excelMatch.categorie);
    
    let badgeStyle = "";
    if (excelMatch && toxic) {
      badgeStyle = 'style="background:#fde;color:var(--red-toxic)"';
    } else if (!excelMatch) {
      badgeStyle = 'style="background:#e3f2fd;color:#0d47a1;border:1px dashed #90caf9"';
    }

    const codBadge = excelMatch
      ? `<span class="cr-cod" ${badgeStyle}>Cod ${excelMatch.cod} — ${excelMatch.popular}</span>`
      : `<span class="cr-cod" ${badgeStyle}>✨ Specie nouă (Nu este în Excel)</span>`;

    const popularName = commonNames.length ? commonNames.slice(0,2).join(', ') : 'Specie externă';
    
    html += `<div class="cam-result ${toxic ? 'toxic-match' : ''}" onclick="addPlantNetResult(${excelMatch ? excelMatch.cod : 'null'}, ${score}, '${encodeURIComponent(sciName)}', '${encodeURIComponent(popularName)}')">
      <span class="cr-score">${score}%</span>
      <div class="cr-sci">${sciName}</div>
      ${commonNames.length ? `<div class="cr-pop">${popularName}</div>` : ''}
      ${codBadge}
    </div>`;
  });
  container.innerHTML = html;
}

function addPlantNetResult(cod, score, safeSci, safePop) {
  const sciName = decodeURIComponent(safeSci);
  const popularName = decodeURIComponent(safePop);
  let p = null, isNewPlant = false;

  if (cod === null) {
    const tempCod = Math.floor(Date.now() / 1000); 
    isNewPlant = true;
    p = { 
      cod: tempCod, 
      stiintific: sciName, 
      popular: popularName + " (PlantNet)", 
      categorie: "Diverse (Identificare Cameră)" 
    };
    PLANTE.push(p);
    cod = tempCod;
  } else {
    p = PLANTE.find(x => x.cod === cod);
  }

  if (!p) return;
  const toxic = typeof isToxic === 'function' ? isToxic(p.categorie) : false;
  const balast = typeof isBalast === 'function' ? isBalast(p.categorie) : false;

  let target = camTarget;
  if (!target) {
    if (p.categorie.includes('Graminee')) target = 'gram';
    else if (p.categorie.includes('Leguminoase')) target = 'leg';
    else if (toxic || balast) target = toxic ? 'toxic' : 'div';
    else target = 'div';
  }

  if (fisaSpecii[target].find(s => s.cod === cod)) {
    toast(`Această specie a fost deja adăugată.`);
    closeCameraModal();
    return;
  }

  const pctRaw = prompt(`Adaugă ${p.stiintific}\nIntroduce procentul (%) estimat în teren:`, '');
  if (pctRaw === null) return; 

  const parsedPct = pctRaw.trim() === '' ? '?' : parseFloat(pctRaw.replace(',', '.'));
  fisaSpecii[target].push({ cod, pct: isNaN(parsedPct) ? '?' : parsedPct });
  
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
  closeCameraModal();
  toast(isNewPlant ? `✓ Specie nouă: ${p.stiintific}` : `✓ Cod ${cod} adăugat`);
}
