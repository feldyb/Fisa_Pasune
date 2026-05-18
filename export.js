// ── EXPORT DOCX ──────────────────────────────────────────────────────────────
async function exportDocx() {
  if (!fise.length) { toast('Nu există fișe salvate'); return; }
  toast('⏳ Se generează documentul...');

  // Verify docx library loaded
  if (!window.docx || !window.docx.Document) {
    toast('⏳ Se încarcă biblioteca, încearcă din nou...');
    // Try waiting 2s then retry
    await new Promise(r => setTimeout(r, 2000));
    if (!window.docx || !window.docx.Document) {
      toast('❌ Biblioteca docx nu s-a încărcat. Reîncarcă pagina cu internet.');
      return;
    }
  }

  try {
    const blob = await buildDocx(fise);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fise_pasune_${new Date().toISOString().slice(0,10)}.docx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(`✓ ${fise.length} fișe exportate`);
  } catch(e) {
    console.error(e);
    toast('❌ Eroare la generare: ' + e.message);
  }
}

async function buildDocx(fise) {
  const D = window.docx;
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign } = D;

  const PW = 10772;
  const bk = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const brd = { top: bk, bottom: bk, left: bk, right: bk };
  const bN = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const bNone = { top: bN, bottom: bN, left: bN, right: bN };
  const padN = { top: 40, bottom: 40, left: 80, right: 80 };
  const padSm = { top: 20, bottom: 20, left: 60, right: 60 };

  function tx(text, o={}) {
    return new TextRun({ text: String(text||''), font:"Arial", size:o.sz||16, bold:!!o.bold });
  }
  function cell(w, text, o={}) {
    return new TableCell({ borders: o.noBorder?bNone:brd,
      width:{size:w,type:WidthType.DXA}, margins:o.sm?padSm:padN,
      verticalAlign:VerticalAlign.CENTER,
      columnSpan:o.span||1, rowSpan:o.rowSpan||1,
      children:[new Paragraph({alignment:o.center?AlignmentType.CENTER:AlignmentType.LEFT,
        children:[tx(text,{sz:o.sz||16,bold:!!o.bold})]})] });
  }
  function eCell(w, o={}) { return cell(w,'',o); }

  function specStr(arr) {
    if(!arr||!arr.length) return '';
    return arr.map(s=>`${s.cod}(${s.pct}%)`).join(' ');
  }

  function buildFisa(f) {
    f = f||{};
    const c = [1800,750,950,850,950,950,950,750,950,1872]; // sum=10772

    const rows = [];

    // Header coloane
    rows.push(new TableRow({ children: [
      cell(c[0],'Tr. păşune',{bold:true,center:true}),
      cell(c[1],'u. a.',{bold:true,center:true}),
      new TableCell({borders:brd,width:{size:c[2],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Supraf',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('.',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('- ha -',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[3],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Gr.',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('funcţ.',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[4],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Categ.',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('folos.',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[5],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Unit.',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('relief',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[6],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Config',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('.',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('teren',{sz:15,bold:true})]})]}),
      cell(c[7],'T.S.',{bold:true,center:true}),
      cell(c[8],'T.P.',{bold:true,center:true}),
      cell(c[9],'-',{bold:true,center:true}),
    ]}));

    // Date identificare
    rows.push(new TableRow({height:{value:520,rule:'exact'}, children:[
      cell(c[0],f.trPas||''), cell(c[1],f.ua||''), cell(c[2],f.sup||''),
      cell(c[3],f.grFunct||''), cell(c[4],f.catFolos||''), cell(c[5],f.unitRel||''),
      cell(c[6],f.confTeren||''), cell(c[7],f.ts||''), eCell(c[8]), eCell(c[9]),
    ]}));

    // Date stat. suplimentare
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0]+c[1],'Date staţ. suplimentare',{span:2}),
      eCell(c[2]+c[3]+c[4]+c[5]+c[6]+c[7]+c[8]+c[9],{span:8}),
    ]}));

    // Incl / Exp / Alt / Unit.sol
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0],'Încl.:',{sz:15}), eCell(c[1]),
      cell(c[2],'Exp.:',{sz:15}), eCell(c[3]),
      cell(c[4],'Alt.:',{sz:15}), eCell(c[5]), eCell(c[6]),
      cell(c[7]+c[8],'Unit. sol.:',{span:2,sz:15}), eCell(c[9]),
    ]}));

    // Tip pajiste + acoperire
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0]+c[1],'Tip pajişte :',{span:2,sz:15}),
      eCell(c[2]+c[3]+c[4]+c[5]+c[6],{span:5}),
      cell(c[7]+c[8],'Acoperire ierbacee:',{span:2,sz:15}),
      cell(c[9],f.acopIerb?f.acopIerb+'%':'%',{center:true}),
    ]}));

    // Helper: build 2 rows for a species category
    function specRows(label, total, specii, isTox) {
      const pairW = [c[3]+c[4], c[5]+c[6], c[7]+c[8]];
      
      function sixCells(startIdx) {
        const s = specii;
        const slots = [
          {w:c[3]+c[4], sp:s[startIdx]},
          {w:c[5]+c[6], sp:s[startIdx+1]},
          {w:c[7]+c[8], sp:s[startIdx+2]},
        ];
        const cells = [];
        for(const sl of slots) {
          if(sl.sp) {
            const nm = Math.round(sl.w*0.65);
            const pc = sl.w - nm;
            cells.push(cell(nm, sl.sp.cod+'', {sz:13}));
            cells.push(cell(pc, sl.sp.pct+'%', {sz:13, center:true}));
          } else {
            cells.push(eCell(sl.w, {span:2}));
          }
        }
        return cells;
      }

      const r1 = new TableRow({height:{value:400,rule:'exact'}, children:[
        cell(c[0]+c[1], label, {span:2, sz:15}),
        cell(c[2], total?total+'%':'%', {center:true}),
        ...sixCells(0),
        cell(c[9], specii[0]||specii[1]||specii[2] ? '' : '%', {center:true}),
      ]});
      const r2 = new TableRow({height:{value:380,rule:'exact'}, children:[
        eCell(c[0]+c[1], {span:2}),
        eCell(c[2]),
        ...sixCells(3),
        cell(c[9], specii[3]||specii[4]||specii[5] ? '' : '%', {center:true}),
      ]});
      return [r1, r2];
    }

    rows.push(...specRows('Gram :', f.gramTotal, f.speciiGram||[], false));
    rows.push(...specRows('Leg :', f.legTotal, f.speciiLeg||[], false));
    rows.push(...specRows('Div plante', f.divTotal, f.speciiDiv||[], false));

    // Pl. daunatoare + toxice (single row)
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0]+c[1],'Pl. dăunătoare + toxice',{span:2,sz:15}),
      cell(c[2],f.toxicTotal?f.toxicTotal+'%':'%',{center:true}),
      eCell(c[3]+c[4]+c[5]+c[6]+c[7]+c[8],{span:6}),
      cell(c[9],specStr(f.speciiToxic)||'%',{sz:13}),
    ]}));

    // Val. past + Arbusti
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0]+c[1],'Val. past.',{span:2,sz:15}),
      cell(c[2],f.valPast||''),
      cell(c[3],'Arbuşti',{sz:15}),
      cell(c[4]+c[5],f.arbusti||'',{span:2}),
      cell(c[6],'Gr. acop',{sz:15}),
      cell(c[7],f.grAcop||''),
      cell(c[8],'Răsp.',{sz:15}),
      cell(c[9],f.raspArb||''),
    ]}));

    // Veget. forestiera
    rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
      cell(c[0]+c[1],'Veget. forestieră :',{span:2,sz:15}),
      eCell(c[2]+c[3]+c[4]+c[5]+c[6]+c[7],{span:6}),
      cell(c[8],'Volum',{sz:15}),
      cell(c[9],f.vegFor||'',{sz:13}),
    ]}));

    // Date complementare
    rows.push(new TableRow({height:{value:400,rule:'exact'}, children:[
      cell(c[0]+c[1],'Date complementare',{span:2,sz:15}),
      cell(c[2]+c[3]+c[4]+c[5]+c[6]+c[7]+c[8]+c[9],f.dateCompl||'',{span:8}),
    ]}));

    const lrExec = f.lucrExecCod || '';
    const lr = Array.isArray(f.lucrari)&&f.lucrari.length ? f.lucrari.map(l=>typeof l==='object'?`${l.cod}(${l.pct||''}%)`:`${l}`).join('  ') : '';
    const eroz = Array.isArray(f.eroziune)&&f.eroziune.length ? f.eroziune.join(' ') : '';

    // Lucr. exec.
    rows.push(new TableRow({height:{value:360,rule:'exact'}, children:[
      cell(c[0]+c[1],'Lucr. exec.',{span:2,sz:15}),
      cell(c[2]+c[3]+c[4]+c[5]+c[6]+c[7]+c[8],lrExec,{span:7,sz:14}),
      cell(c[9],eroz,{sz:13}),
    ]}));

    // Lucr. propuse
    rows.push(new TableRow({height:{value:360,rule:'exact'}, children:[
      cell(c[0]+c[1],'Lucr. propuse',{span:2,sz:15}),
      cell(c[2],'%',{center:true}),
      cell(c[3]+c[4],lr,{span:2,sz:13}),
      cell(c[5],'%',{center:true}),
      eCell(c[6]+c[7],{span:2}),
      cell(c[8],'%',{center:true}), cell(c[9],'%',{center:true}),
    ]}));

    // Sub-header vegetatie forestiera (2 randuri cu rowSpan)
    rows.push(new TableRow({ children:[
      new TableCell({borders:brd,width:{size:c[0]+c[1],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,columnSpan:2,rowSpan:2,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Elem',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('arb',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[2],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,rowSpan:2,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Prp. %',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Cons',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[3],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,rowSpan:2,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Vârst',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('a',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[4],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,rowSpan:2,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('D',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('cm',{sz:15,bold:true})]})]}),
      new TableCell({borders:brd,width:{size:c[5],type:WidthType.DXA},margins:padSm,verticalAlign:VerticalAlign.CENTER,rowSpan:2,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('H',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('m',{sz:15,bold:true})]})]}),
      cell(c[6],'Prov.',{bold:true,center:true,rowSpan:2}),
      cell(c[7],'CLP',{bold:true,center:true,rowSpan:2}),
      cell(c[8]+c[9],'Volum (mc)',{bold:true,center:true,span:2}),
    ]}));
    rows.push(new TableRow({ children:[
      cell(c[8],'ha',{bold:true,center:true}),
      cell(c[9],'Total',{bold:true,center:true}),
    ]}));

    // 5 randuri goale vegetatie
    for(let i=0;i<5;i++){
      rows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
        eCell(c[0]+c[1],{span:2}), eCell(c[2]), eCell(c[3]), eCell(c[4]),
        eCell(c[5]), eCell(c[6]), eCell(c[7]), eCell(c[8]), eCell(c[9]),
      ]}));
    }

    const mainTable = new Table({ width:{size:PW,type:WidthType.DXA}, columnWidths:c, rows });

    // Tabel suplimentar exclusiv pentru Pășune împădurită
    if (f.catFolos === 'Pășune împădurită' || f.catFolos === 'Păşune împădurită') {
      const brdP = { top: bk, bottom: bk, left: bk, right: bk };
      const piRows = [];

      // Header tabel secundar
      piRows.push(new TableRow({ children:[
        new TableCell({ borders:brdP, width:{size:PW,type:WidthType.DXA},
          columnSpan:4, margins:padSm,
          shading:{fill:"1a3a0a",type:ShadingType.CLEAR},
          children:[new Paragraph({alignment:AlignmentType.CENTER,
            children:[tx('VEGETAȚIE FORESTIERĂ — PĂȘUNE ÎMPĂDURITĂ',{sz:17,bold:true,color:"c8e6a0"})]})]
        })
      ]}));

      const c4f = [2200, 3186, 2200, 3186]; // sum=10772

      function row4(l1,v1,l2,v2) {
        return new TableRow({height:{value:400,rule:'exact'}, children:[
          new TableCell({borders:brdP,width:{size:c4f[0],type:WidthType.DXA},margins:padSm,children:[new Paragraph({children:[tx(l1,{sz:15,bold:true})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[1],type:WidthType.DXA},margins:padN,children:[new Paragraph({children:[tx(v1||'',{sz:15})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[2],type:WidthType.DXA},margins:padSm,children:[new Paragraph({children:[tx(l2,{sz:15,bold:true})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[3],type:WidthType.DXA},margins:padN,children:[new Paragraph({children:[tx(v2||'',{sz:15})]})]})
        ]});
      }

      piRows.push(row4('Unit. Relief:', f.piUnitRelief, 'Conf:', f.piConf));
      piRows.push(row4('Încl.:', f.piIncl, 'Exp:', f.piExp));
      piRows.push(row4('Alt. (m):', f.piAlt, 'Tip floră:', f.piTipFlora));
      piRows.push(row4('Tip sol:', f.piTipSol, 'Vârsta expl.:', f.piVarstaExpl));
      piRows.push(row4('Dist. Drum (m):', f.piDistDrum, 'Semințiș util:', f.piSemintis||''));

      // Arboret headers
      const cAf = [1700, 1372, 1100, 950, 950, 1000, 900, 1400, 1400]; // sum = 10772
      piRows.push(new TableRow({ children:[
        new TableCell({borders:brdP,width:{size:cAf[0],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Elem arb',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[1],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Prp.% Cons',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[2],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Vârstă ani',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[3],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('D cm',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[4],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('H m',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[5],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Prov.',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[6],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('CLP',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[7]+cAf[8],type:WidthType.DXA},columnSpan:2,margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Volum (mc)',{sz:13,bold:true})]})]})
      ]}));
      
      piRows.push(new TableRow({ children:[
        new TableCell({borders:brdP,width:{size:cAf[0]+cAf[1]+cAf[2]+cAf[3]+cAf[4]+cAf[5]+cAf[6],type:WidthType.DXA},columnSpan:7,margins:padSm,children:[new Paragraph({children:[tx('',{sz:12})]})] }),
        new TableCell({borders:brdP,width:{size:cAf[7],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('ha',{sz:13,bold:true})]})]}),
        new TableCell({borders:brdP,width:{size:cAf[8],type:WidthType.DXA},margins:padSm,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[tx('Total',{sz:13,bold:true})]})]})
      ]}));

      const arboretList = f.piArboretList || [];
      const minRows = Math.max(arboretList.length, 5);
      for(let ai=0; ai<minRows; ai++){
        const s = arboretList[ai] || {};
        piRows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
          new TableCell({borders:brdP, width:{size:cAf[0], type:WidthType.DXA}, margins:padN, children:[new Paragraph({children:[tx(s.elem||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[1], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.cons||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[2], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.varsta||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[3], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.d||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[4], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.h||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[5], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.prov||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[6], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.clp||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[7], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.volHa||'')]})]}),
          new TableCell({borders:brdP, width:{size:cAf[8], type:WidthType.DXA}, margins:padN, children:[new Paragraph({alignment:AlignmentType.CENTER, children:[tx(s.volTotal||'')]})]})
        ]}));
      }

      const piTable = new Table({ width:{size:PW, type:WidthType.DXA}, columnWidths:cAf, rows:piRows });

      return [
        mainTable,
        new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
        piTable
      ];
    }

    return [mainTable];
  }

  // Generare secțiuni per fișă
  const sections = [];
  for (const f of fise) {
    const fisaElements = buildFisa(f);
    sections.push({
      properties: {},
      children: [
        ...fisaElements,
        new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }) 
      ]
    });
  }

  return await Packer.toBlob(new Document({ sections }));
}
