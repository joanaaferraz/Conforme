// Planta diagramática do lote a partir do que o plugin leu no LXi (lote, edifícios, eixos e limites das zonas).
// Devolve uma string SVG; as coordenadas vêm no sistema do LXi (metros), por isso a escala é real.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function plantaLote(lote, { largura = 340, altura = 240 } = {}) {
  if (!lote || !lote.lote || !Array.isArray(lote.lote.rings)) return '';
  const pts = [];
  const junta = rings => (rings || []).forEach(r => (r || []).forEach(p => Array.isArray(p) && pts.push(p)));
  junta(lote.lote.rings);
  let [x0, y0, x1, y1] = Array.isArray(lote.rect) && lote.rect.length === 4 ? lote.rect : [Infinity, Infinity, -Infinity, -Infinity];
  if (!isFinite(x0)) { pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); x0 -= 15; y0 -= 15; x1 += 15; y1 += 15; }
  const s = Math.min(largura / (x1 - x0), altura / (y1 - y0));
  const ox = (largura - (x1 - x0) * s) / 2, oy = (altura - (y1 - y0) * s) / 2;
  const P = ([x, y]) => `${(ox + (x - x0) * s).toFixed(1)},${(oy + (y1 - y) * s).toFixed(1)}`;
  const anel = r => 'M' + r.map(P).join('L') + 'Z';
  const linha = r => 'M' + r.map(P).join('L');
  const caminho = (rings, fechar = true) => (rings || []).filter(r => Array.isArray(r) && r.length > 1).map(fechar ? anel : linha).join('');

  const cores = ['#a8402f', '#1e4b6e', '#8a6414', '#3d7ea6', '#5c7a5c', '#7a6a9a', '#9a5a7a'];
  const zonas = (lote.elementos || []).filter(e => Array.isArray(e.rings) && e.rings.length);
  const vistos = new Map();
  zonas.forEach(e => { if (!vistos.has(e.camada)) vistos.set(e.camada, cores[vistos.size % cores.length]); });

  const barra = Math.max(5, Math.round(20 / 5) * 5), bpx = barra * s; // escala gráfica de 20 m
  return `<svg viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Planta diagramática do lote">
    <rect width="${largura}" height="${altura}" fill="var(--canvas-bg)"/>
    <path d="${caminho(lote.eixos, false)}" fill="none" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="6 3"/>
    <path d="${caminho(lote.edificios)}" fill="var(--line)" fill-opacity=".55" stroke="var(--line-strong)" stroke-width=".8"/>
    ${zonas.map(e => `<path d="${caminho(e.rings)}" fill="${vistos.get(e.camada)}" fill-opacity=".06" stroke="${vistos.get(e.camada)}" stroke-width="1.2" stroke-dasharray="5 3"><title>${esc(e.camada)} · ${esc(e.valor)}</title></path>`).join('')}
    <path d="${caminho(lote.lote.rings)}" fill="var(--blueprint)" fill-opacity=".16" stroke="var(--blueprint)" stroke-width="2"/>
    <g transform="translate(${largura - 18} 22)"><path d="M0 -10 L4.5 4 L0 0.5 L-4.5 4Z" fill="var(--ink)"/><text y="15" font-family="IBM Plex Mono,monospace" font-size="8" fill="var(--ink)" text-anchor="middle">N</text></g>
    <g transform="translate(10 ${altura - 12})"><path d="M0 0 H${bpx.toFixed(1)}" stroke="var(--ink)" stroke-width="2"/><text x="${(bpx + 6).toFixed(1)}" y="3" font-family="IBM Plex Mono,monospace" font-size="8" fill="var(--ink)">${barra} m</text></g>
  </svg>`;
}

export function legendaZonas(lote) {
  const cores = ['#a8402f', '#1e4b6e', '#8a6414', '#3d7ea6', '#5c7a5c', '#7a6a9a', '#9a5a7a'];
  const m = new Map();
  (lote && lote.elementos || []).filter(e => Array.isArray(e.rings) && e.rings.length).forEach(e => { if (!m.has(e.camada)) m.set(e.camada, cores[m.size % cores.length]); });
  return m;
}
