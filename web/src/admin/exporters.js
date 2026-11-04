// Report downloads built in the browser: CSV, Excel (.xlsx, a minimal zip written here) and PDF (print dialog).
// columns: [[header, (row) => value], ...]

const stamp = () => new Date().toISOString().slice(0, 10);

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const table = (columns, rows) => [columns.map(([h]) => h), ...rows.map((r) => columns.map(([, get]) => {
  const v = get(r);
  return v == null ? '' : String(v);
}))];

export function toCsv(columns, rows, name) {
  const cell = (v) => `"${v.replace(/"/g, '""')}"`;
  const csv = table(columns, rows).map((line) => line.map(cell).join(',')).join('\r\n');
  download(new Blob([`﻿${csv}`], { type: 'text/csv' }), `heh-${name}-${stamp()}.csv`);
}

// ---------- .xlsx ----------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Zip with stored (uncompressed) entries: enough for a small spreadsheet.
function zip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [path, text] of files) {
    const name = enc.encode(path);
    const data = enc.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(local.buffer, name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(cd.buffer, name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((n, b) => n + b.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, end.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const xml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const col = (i) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };

export function toXlsx(columns, rows, name, sheet = 'Report') {
  const data = table(columns, rows);
  const sheetRows = data.map((line, r) => `<row r="${r + 1}">${line.map((v, c) => (
    `<c r="${col(c)}${r + 1}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(v)}</t></is></c>`
  )).join('')}</row>`).join('');
  const widths = columns.map((_, c) => Math.min(60, Math.max(10, ...data.map((line) => line[c].length + 2))));
  const files = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheet.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>'],
    ['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows}</sheetData></worksheet>`],
  ];
  download(zip(files), `heh-${name}-${stamp()}.xlsx`);
}

// PDF: a printable page in a new window; the browser's print dialog saves it as PDF.
export function toPdf(columns, rows, title, subtitle = '') {
  const data = table(columns, rows);
  const w = window.open('', '_blank');
  if (!w) throw new Error('Allow pop-ups for this site to download the PDF.');
  const h = (s) => xml(String(s));
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${h(title)}</title><style>
    body{font:12px Arial,sans-serif;color:#1d2f4a;margin:24px}h1{font:bold 20px Georgia,serif;color:#0d2a4f;margin:0 0 4px}
    p{margin:0 0 14px;color:#55657c}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d6dce6;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#f2f4f8}@page{size:landscape;margin:12mm}</style></head><body>
    <h1>${h(title)}</h1><p>Hyderabad Entrepreneurs Hub · ${h(subtitle || `Generated ${stamp()}`)} · ${rows.length} records</p>
    <table><thead><tr>${data[0].map((c) => `<th>${h(c)}</th>`).join('')}</tr></thead>
    <tbody>${data.slice(1).map((line) => `<tr>${line.map((c) => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();
}

export function exportAs(format, columns, rows, { name, title, subtitle }) {
  if (format === 'xlsx') return toXlsx(columns, rows, name, title);
  if (format === 'pdf') return toPdf(columns, rows, title, subtitle);
  return toCsv(columns, rows, name);
}
