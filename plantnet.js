// ── PLANTNET CAMERA ───────────────────────────────────────────────────────────
let camTarget = null; // Categoria în care se va adăuga planta după identificare

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

  // Afișează preview-ul imaginii
  const preview = document.getElementById('cam-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';

  document.getElementById('cam-loading').style.display = 'block';
  document.getElementById('cam-results').innerHTML = '';
  document.getElementById('cam-status').textContent = '';

  try {
    const formData = new FormData();
    formData.append('images', file);

    // Apelăm scriptul proxy local PHP (identificare.php se ocupă de cheia API și organs=auto)
    const resp = await fetch('identificare.php', {
      method: 'POST',
      body: formData
    });

    document.getElementById('cam-loading').style.display = 'none';

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      document.getElementById('cam-status').textContent = `Eroare server: ${err.message || resp.status}`;
      return;
    }

    const data = await resp.json();
    renderPlantNetResults(data.results || []);

  } catch(e) {
    document.getElementById('cam-loading').style.display = 'none';
    document.getElementById('cam-status').textContent = '❌ Fără conexiune internet sau scriptul PHP este inaccesibil.';
  }
}

function renderPlantNetResults(results) {
  const container = document.getElementById('cam-results');
  if (!results.length) {
    container.innerHTML = '<div class="cam-no-match">Nicio plantă identificată. Încearcă o poză mai clară.</div>';
    return;
  }

  let html = `<div style="font-family:var(--font-mono);font-size:11px;color:#888;margin-bottom:8px">
    Atinge un rezultat pentru a-l adăuga în fișă:</div>`;

  results.forEach(r => {
    const sciName = r.species?.scientificNameWithoutAuthor || '';
    const commonNames = r.species?.commonNames || [];
    const score = Math.round((r.score || 0) * 100);
    const genus = sciName.split(' ')[0].toLowerCase();
    const sp2 = sciName.split(' ')[1]?.toLowerCase() || '';

    // Căutare potrivire în lista locală Excel (PLANTE)
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
      // Stil albastru/punctat pentru plantele care NU sunt în baza ta Excel
      badgeStyle = 'style="background:#e3f2fd;color:#0d47a1;border:1px dashed #90caf9"';
    }

    const codBadge = excelMatch
      ? `<span class="cr-cod" ${badgeStyle}>Cod ${excelMatch.cod} — ${excelMatch.popular}</span>`
      : `<span class="cr-cod" ${badgeStyle}>✨ Specie nouă (Nu este în Excel)</span>`;

    // Pregătim denumirile populare (fallback dacă PlantNet nu trimite denumire în română)
    const popularName = commonNames.length ? commonNames.slice(0,2).join(', ') : 'Specie externă';
    
    // Criptăm textele ca să nu spargă ghilimelele din HTML-ul inline
    const safeSci = encodeURIComponent(sciName);
    const safePop = encodeURIComponent(popularName);
    const matchCod = excelMatch ? excelMatch.cod : 'null';

    html += `<div class="cam-result ${toxic ? 'toxic-match' : ''}" onclick="addPlantNetResult(${matchCod}, ${score}, '${safeSci}', '${safePop}')">
      <span class="cr-score">${score}%</span>
      <div class="cr-sci">${sciName}</div>
      ${commonNames.length ? `<div class="cr-pop">${popularName}</div>` : ''}
      ${codBadge}
    </div>`;
  });

  container.innerHTML = html;
}

function addPlantNetResult(cod, score, safeSci, safePop) {
  // Decodificăm denumirile plantelor
  const sciName = decodeURIComponent(safeSci);
  const popularName = decodeURIComponent(safePop);
  
  let p = null;
  let isNewPlant = false;

  if (cod === null) {
    // Generăm un cod unic artificial bazat pe timp, ca să nu se bată cap în cap cu restul codurilor tale
    const tempCod = Math.floor(Date.now() / 1000); 
    isNewPlant = true;
    
    p = {
      cod: tempCod,
      stiintific: sciName,
      popular: popularName + " (PlantNet)",
      categorie: "Diverse (Identificare Cameră)"
    };

    // O injectăm temporar în lista globală PLANTE ca funcțiile tale de randare (renderChips) să nu dea eroare
    PLANTE.push(p);
    cod = tempCod;
  } else {
    p = PLANTE.find(x => x.cod === cod);
  }

  if (!p) return;

  const toxic = typeof isToxic === 'function' ? isToxic(p.categorie) : false;
  const balast = typeof isBalast === 'function' ? isBalast(p.categorie) : false;

  // Stabilim secțiunea din fișă unde trimitem planta
  let target = camTarget;
  if (!target) {
    if (p.categorie.includes('Graminee')) target = 'gram';
    else if (p.categorie.includes('Leguminoase')) target = 'leg';
    else if (toxic || balast) target = toxic ? 'toxic' : 'div';
    else target = 'div'; // Cele noi merg automat la diverse dacă nu s-a specificat o categorie la deschiderea camerei
  }

  // Verificăm dublurile
  if (fisaSpecii[target].find(s => s.cod === cod)) {
    toast(`Această specie a fost deja adăugată.`);
    closeCameraModal();
    return;
  }

  // Solicitare procent
  const pctRaw = prompt(`Adaugă ${p.stiintific}\nIntroduce procentul (%) estimat în teren:`, '');
  if (pctRaw === null) return; 

  const parsedPct = pctRaw.trim() === '' ? '?' : parseFloat(pctRaw.replace(',', '.'));
  const finalPct = isNaN(parsedPct) ? '?' : parsedPct;

  // Introducere în baza ta de date din sesiune
  fisaSpecii[target].push({ cod, pct: finalPct });
  
  // Re-randare elemente vizuale (chips-uri) în interfața fișei
  document.getElementById('chips-' + target).innerHTML = renderChips(target);
  closeCameraModal();
  
  if (isNewPlant) {
    toast(`✓ Specie nouă salvată: ${p.stiintific} în secțiunea [${target}]`);
  } else {
    toast(`✓ Cod ${cod} adăugat în ${target} (${score}% certitudine)`);
  }
}
