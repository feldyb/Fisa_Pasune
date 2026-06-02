// ── PLANTNET CAMERA (VARIANTA DIRECTĂ PENTRU GITHUB - FĂRĂ PHP) ────────────────
const PLANTNET_KEY = '2b10Qq1LQb6AOnIw2QXcWdMqOe'; // ⚠ ATENȚIE: Vizibilă public pe Git!
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
  document.getElementById('cam-status').textContent = '';

  try {
    const formData = new FormData();
    formData.append('images', file);
    formData.append('organs', 'auto'); // Adăugat direct aici, fiindcă nu mai avem PHP

    // Apelăm direct API-ul PlantNet (funcționează pe GitHub Pages)
    const resp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_KEY}&lang=ro&nb-results=5`,
      { method: 'POST', body: formData }
    );

    document.getElementById('cam-loading').style.display = 'none';

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      document.getElementById('cam-status').textContent = `Eroare PlantNet: ${err.message || resp.status}`;
      return;
    }

    const data = await resp.json();
    renderPlantNetResults(data.results || []);

  } catch(e) {
    document.getElementById('cam-loading').style.display = 'none';
    document.getElementById('cam-status').textContent = '❌ Fără conexiune internet. PlantNet necesită semnal.';
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

    // Căutare în lista ta din Excel (PLANTE)
    let excelMatch = PLANTE.find(p => {
      const pg = p.stiintific.split(' ')[0].toLowerCase();
      const ps = (p.stiintific.split(' ')[1] || '').toLowerCase();
      return pg === genus && ps === sp2;
    });
    
    if (!excelMatch) {
      excelMatch = PLANTE.find(p => p.stiintific.split(' ')[0].toLowerCase() === genus);
    }

    const toxic = excelMatch && isToxic(excelMatch.categorie);
    let badgeStyle = excelMatch && toxic ? 'style="background:#fde;color:var(--red-toxic)"' : (!excelMatch ? 'style="background:#e3f2fd;color:#0d47a1;border:1px dashed #90caf9"' : '');
    const codBadge = excelMatch ? `<span class="cr-cod" ${badgeStyle}>Cod ${excelMatch.cod} — ${excelMatch.popular}</span>` : `<span class="cr-cod" ${badgeStyle}>✨ Specie nouă (Nu este în Excel)</span>`;

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
    // Generăm cod temporar pentru plantele care NU sunt în Excel-ul tău
    const tempCod = Math.floor(Date.now() / 1000); 
    isNewPlant = true;
    p = { cod: tempCod, stiintific: sciName, popular: popularName + " (PlantNet)", categorie: "Diverse (Identificare Cameră)" };
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
