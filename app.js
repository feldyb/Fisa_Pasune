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

// openPlantModal replaced below

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
    piArboret:'', lucrExecCod:''
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
    <!-- Antet -->
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

    <!-- Stationale -->
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

    <!-- Pajiste -->
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

    <!-- Graminee -->
    <div class="form-section">
      <div class="form-section-title">🌾 Graminee</div>
      <div class="form-field">
        <label>Total % graminee</label>
        <input type="number" id="f-gramTotal" value="${f.gramTotal||''}" placeholder="ex: 65" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-gram">${renderChips('gram')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('gram')">➕ Adaugă specie gramineă</button>
    <button class="add-specie-btn" onclick="openCameraModal()" style="border-color:#2d7bb5;color:#2d7bb5;margin-top:2px">📷 Identifică plantă cu camera (PlantNet)</button>

    <!-- Leguminoase -->
    <div class="form-section">
      <div class="form-section-title">🍀 Leguminoase</div>
      <div class="form-field">
        <label>Total % leguminoase</label>
        <input type="number" id="f-legTotal" value="${f.legTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-leg">${renderChips('leg')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('leg')">➕ Adaugă specie leguminoasă</button>

    <!-- Diverse -->
    <div class="form-section">
      <div class="form-section-title">🌼 Diverse + Balast</div>
      <div class="form-field">
        <label>Total % diverse + balast</label>
        <input type="number" id="f-divTotal" value="${f.divTotal||''}" placeholder="ex: 15" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-div">${renderChips('div')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('div')">➕ Adaugă specie diversă</button>

    <!-- Toxice -->
    <div class="form-section">
      <div class="form-section-title" style="color:var(--red-toxic)">⚠️ Plante toxice + dăunătoare</div>
      <div class="form-field">
        <label>Total % toxice</label>
        <input type="number" id="f-toxicTotal" value="${f.toxicTotal||''}" placeholder="ex: 5" min="0" max="100">
      </div>
    </div>
    <div class="specii-adaugate" id="chips-toxic">${renderChips('toxic')}</div>
    <button class="add-specie-btn" onclick="openSpeciesPicker('toxic')">➕ Adaugă specie toxică</button>

    <!-- Valoare + Arbusti -->
    <div class="form-section">
      <div class="form-section-title">⭐ Valoare pastorală și arbuști</div>
      <div class="form-field">
        <label>Valoare pastorală</label>
        <select id="f-valPast">
          <option ${f.valPast==='bună'?'selected':''}>bună</option>
          <option ${f.valPast==='mijlocie'?'selected':''}>mijlocie</option>
          <option ${f.valPast==='slabă'?'selected':''}>slabă</option>
        </select>
      </div>
      <div class="form-field">
        <label>Arbuști — cod literă (tap pentru listă)</label>
        <input type="text" id="f-arbusti" value="${f.arbusti||''}" placeholder="ex: K, L, Y"
          onclick="showArbustiRef()" readonly style="cursor:pointer">
      </div>
      <div id="arbusti-ref" style="display:none;padding:6px 14px 10px">
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${ARBUSTI.map(a=>`<span onclick="addArbust('${a.cod}')" style="background:var(--parchment);border:1px solid #ccc;border-radius:4px;padding:3px 7px;font-family:var(--font-mono);font-size:11px;cursor:pointer"><strong>${a.cod}</strong> ${a.den.split('(')[0].trim()}</span>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Gr. acoperire %</label>
          <input type="number" id="f-grAcop" value="${f.grAcop}" placeholder="ex: 20" min="0" max="100">
        </div>
        <div class="form-field">
          <label>Răspândire</label>
          <select id="f-raspArb">
            <option ${f.raspArb===''?'selected':''}></option>
            <option ${f.raspArb==='intim'?'selected':''}>intim</option>
            <option ${f.raspArb==='mixt'?'selected':''}>mixt</option>
            <option ${f.raspArb==='pâlcuri'?'selected':''}>pâlcuri</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Veg forestiera -->
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

    <!-- Date complementare -->
    <div class="form-section">
      <div class="form-section-title">📝 Date complementare</div>
      <div class="form-field">
        <label>Observații teren</label>
        <textarea id="f-dateCompl" placeholder="mușuroaie, exces umiditate, vegetație lemnoasă pe pârâu etc.">${f.dateCompl}</textarea>
      </div>
    </div>

    <!-- Lucrari executate -->
    <div class="form-section">
      <div class="form-section-title">✅ Lucrări executate anterior</div>
      <div class="form-field">
        <textarea id="f-lucrExec" placeholder="descriere lucrări anterioare">${f.lucrExec}</textarea>
      </div>
    </div>

    <!-- Lucrari executate cod -->
    <div class="form-section">
      <div class="form-section-title">✅ Lucrări executate (cod)</div>
      <div class="form-field">
        <label>Coduri lucrări executate</label>
        <input type="text" id="f-lucrExecCod" value="${f.lucrExecCod||''}" placeholder="ex: 623, 628, 632">
      </div>
    </div>

    <!-- Lucrari propuse -->
    <div class="form-section">
      <div class="form-section-title">🔧 Lucrări propuse</div>
      <div class="lucrari-grid" id="lucrari-grid">${renderLucrari()}</div>
    </div>

    <!-- Eroziune -->
    <div class="form-section">
      <div class="form-section-title" style="color:#8b3a00">🌊 Eroziune</div>
      <div class="lucrari-grid" id="eroziune-grid">${renderEroziune()}</div>
    </div>

    ${f.catFolos === 'Pășune împădurită' ? `
    <div class="form-section" style="border-color:#4a3010">
      <div class="form-section-title" style="background:#f5ede0;color:#4a3010">&#127795; DATE VEGETA&#538;IE FORESTIER&#258; (P&#259;&#351;une \u00eempădurit\u0103)</div>
      <div class="form-row">
        <div class="form-field"><label>Unit. Relief</label>
          <input type="text" id="f-piUnitRelief" value="${f.piUnitRelief||''}" placeholder="ex: Versant"></div>
        <div class="form-field"><label>Conf.</label>
          <input type="text" id="f-piConf" value="${f.piConf||''}" placeholder="ex: ondulat"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>&#206;ncl. (&#176;)</label>
          <input type="number" id="f-piIncl" value="${f.piIncl||''}" placeholder="ex: 20"></div>
        <div class="form-field"><label>Exp.</label>
          <select id="f-piExp">${['','N','NE','E','SE','S','SV','V','NV','Plat'].map(e=>`<option ${(f.piExp||'')===e?'selected':''}>${e}</option>`).join('')}</select></div>
        <div class="form-field"><label>Alt. (m)</label>
          <input type="number" id="f-piAlt" value="${f.piAlt||''}" placeholder="ex: 700"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>Tip flor&#259;</label>
          <input type="text" id="f-piTipFlora" value="${f.piTipFlora||''}" placeholder="ex: FM"></div>
        <div class="form-field"><label>Tip sol</label>
          <input type="text" id="f-piTipSol" value="${f.piTipSol||''}" placeholder="ex: 3312"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label>V&#226;rsta exploatabilit&#259;&#539;ii</label>
          <input type="number" id="f-piVarstaExpl" value="${f.piVarstaExpl||''}" placeholder="ani"></div>
        <div class="form-field"><label>Dist. Drum auto (m)</label>
          <input type="number" id="f-piDistDrum" value="${f.piDistDrum||''}" placeholder="ex: 500"></div>
      </div>
      <div class="form-field"><label>Sem&#226;n&#539;i&#351; utilizabil</label>
        <input type="text" id="f-piSemintis" value="${f.piSemintis||''}" placeholder="ex: MO 80% - 2000 ex/ha"></div>
      <div class="form-field"><label>Compozi&#539;ie arboret</label>
        <textarea id="f-piArboret" placeholder="ex: 5MO(50ani) 3FA(60ani) 2DM(40ani) - c&#226;te un element pe r&#226;nd">${f.piArboret||''}</textarea></div>
      <div class="form-field"><label>Date complementare</label>
        <textarea id="f-piDateCompl" placeholder="observa&#539;ii suplimentare">${f.piDateCompl||''}</textarea></div>
      <div class="form-field"><label>Lucr&#259;ri executate (coduri)</label>
        <input type="text" id="f-piLucrExec" value="${f.piLucrExec||''}" placeholder="ex: 46, T1, 628"></div>
      <div class="form-field"><label>Lucr&#259;ri propuse (coduri)</label>
        <input type="text" id="f-piLucrPropuse" value="${f.piLucrPropuse||''}" placeholder="ex: T2, 625, 632"></div>
    </div>
    ` : ''}

    <div style="height:20px"></div>
  `;
}

function renderChips(tip) {
  const list = fisaSpecii[tip];
  if (!list.length) return '<span style="font-family:var(--font-mono);font-size:11px;color:#aaa;padding:4px 6px">— nicio specie adăugată</span>';
  return list.map((s, i) => {
    const p = PLANTE.find(x => x.cod === s.cod);
    const isTox = p && isToxic(p.categorie);
    return `<span class="specie-chip ${isTox?'toxic':''}">
      <strong>${s.cod}</strong> ${p ? p.stiintific.split(' ')[0] : ''} <em>${s.pct}%</em>
      <button onclick="removeSpecie('${tip}',${i})">✕</button>
    </span>`;
  }).join('');
}

function removeSpecie(tip, idx) {
  fisaSpecii[tip].splice(idx, 1);
  document.getElementById('chips-' + tip).innerHTML = renderChips(tip);
}

function renderLucrari() {
  return LUCRARI.map(l => {
    const entry = fisaLucrari.find(x => (typeof x==='object' ? x.cod : x) === l.cod);
    const checked = !!entry;
    const pct = entry && typeof entry==='object' ? entry.pct : '';
    const pctInput = checked ? `<div style="display:flex;align-items:center;gap:6px;padding-left:22px" onclick="event.stopPropagation()"><span style="font-family:var(--font-mono);font-size:11px;color:#888">% supraf.:</span><input type="number" min="0" max="100" value="${pct}" placeholder="%" style="width:58px;border:1.5px solid var(--green-bright);border-radius:4px;padding:3px 6px;font-size:13px;font-family:var(--font-mono);background:white" oninput="updateLucrPct('` + l.cod + `',this.value)"></div>` : '';
    return `<div class="lucrare-check ${checked?'checked':''}" style="flex-direction:column;align-items:flex-start;gap:3px" onclick="toggleLucrare('${l.cod}',this)"><div style="display:flex;align-items:center;gap:6px;width:100%;pointer-events:none"><div class="lc-box">${checked?'✓':''}</div><span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--green-mid);min-width:28px">${l.cod}</span><span style="font-size:12px;flex:1;line-height:1.2">${l.den}</span></div>${pctInput}</div>`;
  }).join('');
}
function toggleLucrare(cod, el) {
  const idx = fisaLucrari.findIndex(x => (typeof x==='object' ? x.cod : x) === cod);
  if (idx > -1) {
    fisaLucrari.splice(idx, 1);
  } else {
    fisaLucrari.push({cod, pct:''});
  }
  document.getElementById('lucrari-grid').innerHTML = renderLucrari();
}

function updateLucrPct(cod, val) {
  const entry = fisaLucrari.find(x => (typeof x==='object' ? x.cod : x) === cod);
  if (entry && typeof entry==='object') entry.pct = val;
}

function renderEroziune() {
  return EROZIUNE.map(e => {
    const checked = fisaEroziune.includes(e.cod);
    return `<div class="lucrare-check ${checked?'checked':''}" style="border-color:#c06020" onclick="toggleEroziune('${e.cod}',this)">
      <div class="lc-box" style="border-color:#c06020;${checked?'background:#c06020;color:white;border-color:#c06020':''}">
        ${checked?'✓':''}
      </div>
      <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b3a00;min-width:28px">${e.cod}</span>
      <span style="font-size:12px">${e.den}</span>
    </div>`;
  }).join('');
}

function toggleEroziune(e, el) {
  const idx = fisaEroziune.indexOf(e);
  if (idx > -1) {
    fisaEroziune.splice(idx, 1);
    el.classList.remove('checked');
    el.querySelector('.lc-box').textContent = '';
  } else {
    fisaEroziune.push(e);
    el.classList.add('checked');
    el.querySelector('.lc-box').textContent = '✓';
  }
}

function onCatFolosChange(el) {
  // Update currentFisa.catFolos and re-render to show/hide PI section
  if (currentFisa) {
    currentFisa.catFolos = el.value;
    // Save all current field values before re-rendering
    saveFisa();
    renderFisaForm();
  }
}

function saveFisa() {
  const f = currentFisa;
  // Collect all field values
  const fields = ['trPas','ua','sup','grFunct','ts','catFolos','unitRel','confTeren',
    'incl','exp','alt','unitSol','tipPajiste','acopIerb','valPast',
    'arbusti','grAcop','raspArb','vegFor','varsta','consist','raspFor',
    'dateCompl','lucrExec','lucrExecCod','gramTotal','legTotal','divTotal','toxicTotal',
    'piUnitRelief','piConf','piIncl','piExp','piAlt','piTipFlora','piTipSol',
    'piVarstaExpl','piDistDrum','piSemintis','piDateCompl','piLucrExec','piLucrPropuse','piArboret'];

  fields.forEach(id => {
    const el = document.getElementById('f-' + id);
    if (el) f[id] = el.value;
  });

  f.eroziune = fisaEroziune;
  f.speciiGram = fisaSpecii.gram;
  f.speciiLeg = fisaSpecii.leg;
  f.speciiDiv = fisaSpecii.div;
  f.speciiToxic = fisaSpecii.toxic;
  f.lucrari = fisaLucrari;

  if (currentFisaIdx !== null) {
    fise[currentFisaIdx] = f;
  } else {
    fise.push(f);
    currentFisaIdx = fise.length - 1;
  }

  localStorage.setItem('fise_pastoral', JSON.stringify(fise));
  document.getElementById('fisa-form-title').textContent = `Tr.${f.trPas}/u.a.${f.ua}`;
  toast('✓ Fișă salvată');
}

// ===================== SPECIES PICKER =====================
function openSpeciesPicker(target) {
  // Save current form state first
  saveFisa();
  spPickerTarget = target;
  document.getElementById('sp-title').textContent = {
    gram:'Adaugă gramineă', leg:'Adaugă leguminoasă',
    div:'Adaugă diverse/balast', toxic:'Adaugă specie toxică'
  }[target];
  document.getElementById('sp-search').value = '';
  filterSpPicker();
  document.getElementById('species-picker').classList.add('open');
  setTimeout(() => document.getElementById('sp-search').focus(), 200);
}

function closeSpeciesPicker(e) {
  if (!e || e.target === document.getElementById('species-picker')) {
    document.getElementById('species-picker').classList.remove('open');
  }
}

function filterSpPicker() {
  const q = document.getElementById('sp-search').value.toLowerCase().trim();
  const list = q ? PLANTE.filter(p =>
    String(p.cod).startsWith(q) ||
    p.stiintific.toLowerCase().includes(q) ||
    p.popular.toLowerCase().includes(q)
  ) : PLANTE;

  let html = '';
  let lastCat = null;
  list.forEach(p => {
    if (p.categorie !== lastCat) {
      lastCat = p.categorie;
      html += `<div class="sp-cat-label">${p.categorie}</div>`;
    }
    const isTox = isToxic(p.categorie);
    html += `<div class="sp-item" onclick="addSpeciePicker(${p.cod})">
      <div class="sp-cod ${isTox?'toxic':''}">${p.cod}</div>
      <div class="sp-names">
        <div class="sp-sci">${p.stiintific}</div>
        <div class="sp-pop">${p.popular}</div>
      </div>
    </div>`;
  });
  document.getElementById('sp-list').innerHTML = html || '<div class="empty-state"><div class="es-text">Nicio specie</div></div>';
}

function addSpeciePicker(cod) {
  const already = fisaSpecii[spPickerTarget].find(s => s.cod === cod);
  if (already) { toast('Specia e deja adăugată'); return; }
  const pct = prompt('Procent (%) pentru această specie:', '');
  if (pct === null) return;
  fisaSpecii[spPickerTarget].push({ cod, pct: pct || '?' });
  document.getElementById('species-picker').classList.remove('open');
  document.getElementById('chips-' + spPickerTarget).innerHTML = renderChips(spPickerTarget);
  toast(`Cod ${cod} adăugat`);
}

// ===================== TOAST =====================
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}


function showArbustiRef() {
  const ref = document.getElementById('arbusti-ref');
  if (ref) ref.style.display = ref.style.display === 'none' ? 'block' : 'none';
}
function addArbust(cod) {
  const inp = document.getElementById('f-arbusti');
  if (!inp) return;
  const current = inp.value.split(',').map(s=>s.trim()).filter(Boolean);
  if (!current.includes(cod)) current.push(cod);
  inp.value = current.join(', ');
}
// ===================== INIT =====================
renderSpecii(PLANTE);
renderTipGrid();
loadFiseList();

// PWA offline indicator
window.addEventListener('online', () => document.getElementById('offline-badge').style.background = 'var(--green-bright)');
window.addEventListener('offline', () => document.getElementById('offline-badge').style.background = 'var(--red-toxic)');
