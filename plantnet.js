// ── PLANTNET CAMERA ───────────────────────────────────────────────────────────
const PLANTNET_KEY = '2b10Z2jOlH2ZLooNaGooW75L';
let camTarget = null; // which category to add to after ID

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

  // Show preview
  const preview = document.getElementById('cam-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';

  document.getElementById('cam-loading').style.display = 'block';
  document.getElementById('cam-results').innerHTML = '';
  document.getElementById('cam-status').textContent = '';

  try {
    const formData = new FormData();
    formData.append('images', file);
    formData.append('organs', 'auto');

    const resp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_KEY}&lang=ro&nb-results=5`,
      { method: 'POST', body: formData }
    );

    document.getElementById('cam-loading').style.display = 'none';

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({}));
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

  // Match each result against our Excel plant list
  let html = `<div style="font-family:var(--font-mono);font-size:11px;color:#888;margin-bottom:8px">
    Atinge un rezultat pentru a-l adăuga în fișă:</div>`;

  results.forEach(r => {
    const sciName = r.species?.scientificNameWithoutAuthor || '';
    const commonNames = r.species?.commonNames || [];
    const score = Math.round((r.score || 0) * 100);
    const genus = sciName.split(' ')[0].toLowerCase();
    const sp2 = sciName.split(' ')[1]?.toLowerCase() || '';

    // Try to find in Excel list
    let excelMatch = PLANTE.find(p => {
      const pg = p.stiintific.split(' ')[0].toLowerCase();
      const ps = (p.stiintific.split(' ')[1] || '').toLowerCase();
      return pg === genus && ps === sp2;
    });
    // Fallback: genus only
    if (!excelMatch) {
      excelMatch = PLANTE.find(p => p.stiintific.split(' ')[0].toLowerCase() === genus);
    }

    const toxic = excelMatch && isToxic(excelMatch.categorie);
    const codBadge = excelMatch
      ? `<span class="cr-cod ${toxic?'style="background:#fde;color:var(--red-toxic)"':''}">Cod ${excelMatch.cod} — ${excelMatch.popular}</span>`
      : `<span class="cr-cod" style="background:#f0f0f0;color:#aaa">Negăsit în lista Excel</span>`;

    html += `<div class="cam-result ${toxic?'toxic-match':''}" onclick="addPlantNetResult(${excelMatch?.cod||'null'}, '${sciName.replace(/'/g,"\\'")}', ${score})">
      <span class="cr-score">${score}%</span>
      <div class="cr-sci">${sciName}</div>
      ${commonNames.length ? `<div class="cr-pop">${commonNames.slice(0,2).join(', ')}</div>` : ''}
      ${codBadge}
    </div>`;
  });

  container.innerHTML = html;
}

function addPlantNetResult(cod, sciName, score) {
  if (!cod) {
    toast('Specia nu e în lista Excel — adaugă manual');
    closeCameraModal();
    return;
  }

  const p = PLANTE.find(x => x.cod === cod);
  const toxic = p && isToxic(p.categorie);

  // Determine target category based on plant type
  let target = camTarget;
  if (!target) {
    if (!p) target = 'div';
    else if (p.categorie.includes('Graminee')) target = 'gram';
    else if (p.categorie.includes('Leguminoase')) target = 'leg';
    else if (isToxic(p.categorie) || isBalast(p.categorie)) target = toxic ? 'toxic' : 'div';
    else target = 'div';
  }

  // Check if already added
  if (fisaSpecii[target].find(s => s.cod === cod)) {
    toast(`Cod ${cod} deja adăugat`);
    closeCameraModal();
    return;
  }

  const pct = prompt(`Adaugă ${sciName}\nIntroduce procentul (%) estimat:`, '');
  if (pct === null) return;

  fisaSpecii[target].push({ cod, pct: pct || '?' });
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
  closeCameraModal();
  toast(`✓ Cod ${cod} adăugat în ${target} (${score}% certitudine PlantNet)`);
}
