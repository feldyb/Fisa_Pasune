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
    // Row1: Label | total% | specii (3 per rand, perechi cod+%) | 
    // Row2: empty | empty  | continuare specii
    function specRows(label, total, specii, isTox) {
      // Build pairs: [{cod, pct}, ...]
      // We have 6 middle cols: split as c[3],c[4],c[5],c[6],c[7],c[8]
      // Use as 3 pairs of (cod text col, pct col)
      // col widths for pairs: [c[3]+c[4], c[5]+c[6], c[7]+c[8]]
      const pairW = [c[3]+c[4], c[5]+c[6], c[7]+c[8]];
      
      function pairCells(startIdx) {
        const cells = [];
        for(let pi=0; pi<3; pi++) {
          const sp = specii[startIdx+pi];
          if(sp) {
            // Split pair width: ~65% name, 35% pct
            const w = pairW[pi];
            const wName = Math.round(w*0.65);
            const wPct = w - wName;
            cells.push(cell(wName, sp.cod+'', {sz:14, it:true}));
            cells.push(cell(wPct, sp.pct+'%', {sz:14, center:true}));
          } else {
            cells.push(eCell(pairW[pi], {span:2}));
          }
        }
        return cells;
      }

      // Note: pairCells returns 3 items (each spanning or 2 cols)
      // Actually we need to handle the column widths carefully
      // Simpler: use the 6 middle cols as individual cells
      // c[3]=850, c[4]=950, c[5]=950, c[6]=950, c[7]=750, c[8]=950
      // Use as: sp1name | sp1% | sp2name | sp2% | sp3name | sp3%
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
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('a',{sz:15,bold:true})]}),
                  new Paragraph({alignment:AlignmentType.CENTER,children:[tx('ani',{sz:15,bold:true})]})]}),
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

    // Tabel vegetatie forestiera (doar pentru pășune împădurită)
    if (f.catFolos === 'Pășune împădurită') {
      const PW2 = PW;
      // Coloane tabel PI: Label | Value (2 col layout)
      const cp = [3200, 7772]; // label | value, sum=10972... adjust
      // Use same PW
      const cp2 = [3500, PW-3500];
      const brdP = { top: bk, bottom: bk, left: bk, right: bk };

      function piH(text, w) {
        return new TableCell({ borders:brdP, width:{size:w,type:WidthType.DXA},
          margins:padSm, verticalAlign:VerticalAlign.CENTER,
          children:[new Paragraph({children:[tx(text,{sz:15,bold:true})]})] });
      }
      function piD(w, val, o={}) {
        return new TableCell({ borders:brdP, width:{size:w,type:WidthType.DXA},
          margins:pad, verticalAlign:VerticalAlign.CENTER, columnSpan:o.span||1,
          children:[new Paragraph({children:[tx(val||'',{sz:15})]})] });
      }

      const piRows = [];

      // Header
      piRows.push(new TableRow({ children:[
        new TableCell({ borders:brdP, width:{size:PW,type:WidthType.DXA},
          columnSpan:4, margins:padSm,
          shading:{fill:"1a3a0a",type:ShadingType.CLEAR},
          children:[new Paragraph({alignment:AlignmentType.CENTER,
            children:[tx('VEGETAȚIE FORESTIERĂ — PĂȘUNE ÎMPĂDURITĂ',{sz:17,bold:true,color:"c8e6a0"})]})]
        })
      ]}));

      // 4 col layout: label|val|label|val
      const c4 = [2200, 3286, 2200, 3286]; // sum=10972? check: 2200+3286+2200+3286=10972, PW=10772, diff=200
      const c4f = [2200, 3186, 2200, 3186]; // sum=10772 ✓

      function row4(l1,v1,l2,v2) {
        return new TableRow({height:{value:400,rule:'exact'}, children:[
          new TableCell({borders:brdP,width:{size:c4f[0],type:WidthType.DXA},margins:padSm,
            children:[new Paragraph({children:[tx(l1,{sz:15,bold:true})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[1],type:WidthType.DXA},margins:pad,
            children:[new Paragraph({children:[tx(v1||'',{sz:15})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[2],type:WidthType.DXA},margins:padSm,
            children:[new Paragraph({children:[tx(l2,{sz:15,bold:true})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[3],type:WidthType.DXA},margins:pad,
            children:[new Paragraph({children:[tx(v2||'',{sz:15})]})]})
        ]});
      }

      function row2(label, val, o={}) {
        return new TableRow({height:{value:o.tall?600:400,rule:'exact'}, children:[
          new TableCell({borders:brdP,width:{size:c4f[0],type:WidthType.DXA},margins:padSm,
            children:[new Paragraph({children:[tx(label,{sz:15,bold:true})]})]}),
          new TableCell({borders:brdP,width:{size:c4f[1]+c4f[2]+c4f[3],type:WidthType.DXA},
            columnSpan:3,margins:pad,
            children:[new Paragraph({children:[tx(val||'',{sz:15})]})]})
        ]});
      }

      piRows.push(row4('Unit. Relief:', f.piUnitRelief, 'Conf:', f.piConf));
      piRows.push(row4('Încl.:', f.piIncl, 'Exp:', f.piExp));
      piRows.push(row4('Alt. (m):', f.piAlt, 'Tip floră:', f.piTipFlora));
      piRows.push(row4('Tip sol:', f.piTipSol, 'Vârsta expl.:', f.piVarstaExpl));
      piRows.push(row4('Dist. Drum auto (m):', f.piDistDrum, 'Semințiș util.:', ''));
      // Arboret rows
      const arboretLines = (f.piArboret||'').split('\n').filter(l=>l.trim());
      if (arboretLines.length > 0) {
        // Header row for arboret
        piRows.push(new TableRow({ children:[
          new TableCell({borders:brdP, width:{size:PW, type:WidthType.DXA}, columnSpan:4,
            margins:padSm,
            children:[new Paragraph({children:[tx('Elem. arb.  |  Prp.%/Cons  |  Vârstă  |  D cm  |  H m  |  Prov.  |  CLP  |  Vol.ha  |  Vol.Total',{sz:14,bold:true})]})]
          })
        ]}));
        for(const line of arboretLines) {
          piRows.push(new TableRow({height:{value:400,rule:'exact'}, children:[
            new TableCell({borders:brdP, width:{size:PW, type:WidthType.DXA}, columnSpan:4,
              margins:padSm,
              children:[new Paragraph({children:[tx(line.trim(),{sz:14})]})]
            })
          ]}));
        }
        // Empty rows for additional entries
        for(let ai=arboretLines.length; ai<5; ai++){
          piRows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
            new TableCell({borders:brdP, width:{size:PW, type:WidthType.DXA}, columnSpan:4,
              margins:padSm, children:[new Paragraph({children:[tx('',{sz:14})]})]
            })
          ]}));
        }
      } else {
        // 5 empty arboret rows
        for(let ai=0;ai<5;ai++){
          piRows.push(new TableRow({height:{value:380,rule:'exact'}, children:[
            new TableCell({borders:brdP, width:{size:PW, type:WidthType.DXA}, columnSpan:4,
              margins:padSm, children:[new Paragraph({children:[tx('',{sz:14})]})]
            })
          ]}));
        }
      }
      piRows.push(row2('Semințiș util.:', f.piSemintis));
      piRows.push(row2('Date complementare:', f.piDateCompl, {tall:true}));
      piRows.push(row2('Lucr. exec.:', f.piLucrExec));
      piRows.push(row2('Lucr. propuse:', f.piLucrPropuse));

      const piTable = new Table({ width:{size:PW,type:WidthType.DXA}, columnWidths:c4f, rows:piRows });

      return [mainTable, new Paragraph({spacing:{before:60,after:60},children:[]}), piTable];
    }

    return [mainTable];
  }

  function cutLine() {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:{before:80,after:80},
      border:{bottom:{style:BorderStyle.DASHED,size:6,color:"666666",space:1}},
      children:[new TextRun({text:'\u2702  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  \u2702',
        size:12, color:"999999", font:"Arial"})]
    });
  }

  const children = [];
  for(let i=0; i<fise.length; i+=2){
    children.push(...buildFisa(fise[i]));
    children.push(new Paragraph({spacing:{before:80,after:80},children:[]}));
    children.push(cutLine());
    children.push(new Paragraph({spacing:{before:80,after:0},children:[]}));
    children.push(...(fise[i+1] ? buildFisa(fise[i+1]) : buildFisa({})));
    if(i+2 < fise.length)
      children.push(new Paragraph({pageBreakBefore:true,children:[]}));
  }

  const doc = new Document({
    styles:{default:{document:{run:{font:"Arial",size:16}}}},
    sections:[{
      properties:{page:{size:{width:11906,height:16838},margin:{top:567,bottom:567,left:567,right:567}}},
      children
    }]
  });

  return await Packer.toBlob(doc);
}
