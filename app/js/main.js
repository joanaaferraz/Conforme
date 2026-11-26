// Interface da app Conforme. Toda a lógica está em js/core (sem interface), para poder ser reaproveitada numa app nativa.
import { VERSAO_APP, SO_NO_LXI, LXI_URL, REMOTO } from './config.js';
import { lerProjeto, medicao, fmtNum, FormatoInvalido } from './core/formato.js';
import * as armazem from './core/armazem.js';
import { carregar, aplicavel, requisitos, agrupar, USOS, INTERVENCOES } from './core/legislacao.js';
import { procurarMorada, consultarPonto, elementosDoLote } from './core/lisboa.js';
import { plantaLote, legendaZonas } from './core/planta.js';
import * as remoto from './core/remoto.js';

const S = { tab: 'projetos', projetos: [], proj: null, seg: 'resumo', filtro: 'todas', abertos: {}, legAbertos: {}, legQ: '',
  ligar: null, q: '', procura: null, morada: null, consulta: null, uso: 'Habitação', interv: 'Alteração', dados: null };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urlSegura = u => (/^https:\/\//.test(u || '') ? u : '#');
const pill = (k, t) => `<span class="pill p-${k}">${esc(t)}</span>`;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const quando = iso => { if (!iso) return '—'; const d = new Date(iso); if (isNaN(d)) return iso; const h = new Date(); const dia = d.toDateString() === h.toDateString() ? 'hoje' : d.toLocaleDateString('pt-PT'); return `${dia}, ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`; };
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2800); }

const ICON = {
  projetos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  morada: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  leg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v15M5 8h14M7 8l-3 6h6zM17 8l-3 6h6z"/><path d="M8 20h8"/></svg>',
  ficheiros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9a4.25 4.25 0 0 0 0 8.5z"/></svg>',
};
const LUPA = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>';

function bar(titulo, eyebrow, voltar, direita = '') {
  $('#appbar').innerHTML = `<div class="appbar-row">${voltar ? `<button class="back" data-voltar="1">‹ ${esc(voltar)}</button>` : `<span class="eyebrow">${esc(eyebrow || '')}</span>`}${direita}</div><h2>${esc(titulo)}</h2>`;
}
function tabs() {
  const t = [['projetos', 'Projetos'], ['morada', 'Morada'], ['leg', 'Legislação'], ['ficheiros', 'Ficheiros']];
  $('#tabbar').innerHTML = t.map(([k, l]) => `<button class="tab ${S.tab === k ? 'on' : ''}" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${ICON[k]}<span>${l}</span></button>`).join('');
}
const botaoAbrir = (texto = 'Abrir ficheiro .conforme.json', ghost = false) =>
  `<label class="file-in"><input type="file" data-abrir="1" accept=".json,application/json" multiple><span class="btn ${ghost ? 'ghost' : ''}" role="button" tabindex="0" style="display:block;text-align:center">${esc(texto)}</span></label>`;

/* ---------- Projetos ---------- */
function contagem(p) { const c = k => p.verificacoes.filter(v => v.estado === k).length; return { fail: c('fail'), warn: c('warn'), ok: c('ok') }; }
function vProjetos() {
  bar('Projetos', 'CONFORME');
  if (!S.projetos.length) return `<div class="empty"><h3>Ainda não há projetos no telemóvel</h3>
    <p>No Revit, carrega em <b>Conforme › Enviar para o telemóvel</b>. O plugin grava o projeto na pasta <b>OneDrive › Conforme › Telemóvel</b>. Depois abre-o aqui.</p>
    <button class="btn" data-ligar="1">Ler QR Code do projeto</button><div style="height:8px"></div>${botaoAbrir('Abrir ficheiro .conforme.json', true)}<div style="height:8px"></div><button class="btn ghost" data-exemplo="1">Ver um projeto de exemplo</button></div>`;
  return S.projetos.map(p => { const c = contagem(p);
    return `<button class="proj" data-proj="${esc(p.id)}"><div class="proj-top"><div class="proj-name">${esc(p.nome)}</div><span class="ext">›</span></div>
      <div class="proj-meta">${esc([p.enquadramento.intervencao || p.enquadramento.natureza, p.enquadramento.procedimento].filter(Boolean).join(' · ') || p.modelo)}<br>exportado ${esc(quando(p.exportado))}${p.exemplo ? ' · exemplo' : ''}${p.remoto ? `<br><span class="sync">● ligado ao Revit${p.remoto.erro ? ' · ' + esc(p.remoto.erro) : ''}</span>` : ''}</div>
      <div class="proj-stats">${p.verificacoes.length ? `${c.fail ? pill('fail', c.fail + ' não cumpre') : ''}${c.warn ? pill('warn', c.warn + ' a confirmar') : ''}${pill('ok', c.ok + ' cumpre')}` : pill('mute', 'sem verificação')}${p.lote ? pill('info', 'lote lido no LXi') : ''}</div></button>`; }).join('')
    + `<div style="margin-top:14px;display:grid;gap:8px"><button class="btn" data-ligar="1">Ler QR Code de outro projeto</button>${botaoAbrir('Abrir ficheiro .conforme.json', true)}</div>`;
}
function kpi(p, conceito, rotulo) { const r = medicao(p, conceito); return `<div class="kpi"><div class="l">${esc(rotulo)}</div><div class="n ${r && r.provisorio ? 'prov' : ''}">${r ? fmtNum(r.valor, r.casas) : '—'} <small>${esc(r ? r.unidade : '')}</small></div></div>`; }
function vProjeto() {
  const p = S.projetos.find(x => x.id === S.proj); if (!p) { S.proj = null; return vProjetos(); }
  bar(p.nome, '', 'Projetos');
  const segs = [['resumo', 'Resumo'], ['lote', 'Lote'], ['verif', 'Verificação'], ['med', 'Medições'], ...(p.documentos.length ? [['docs', 'Documentos']] : [])];
  let h = `<div class="seg" role="tablist">${segs.map(([k, l]) => `<button role="tab" aria-selected="${S.seg === k}" class="${S.seg === k ? 'on' : ''}" data-seg="${k}">${l}</button>`).join('')}</div>`;
  const e = p.enquadramento, c = contagem(p);
  if (S.seg === 'resumo') {
    const linhas = [['Morada', [e.morada, e.cp, e.localidade].filter(Boolean).join(', ')], ['Freguesia', e.freguesia], ['Uso', e.uso], ['Intervenção', e.intervencao || e.natureza], ['Procedimento', e.procedimento], ['Pedido', e.pedido]].filter(x => x[1]);
    h += `<div class="card">${linhas.map(([k, v]) => `<div class="row"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('') || '<div class="row"><span class="k">Enquadramento por preencher no plugin</span></div>'}</div>`;
    if (p.medicoes) h += `<div class="sec-title"><span>Modelo medido</span><span>${esc(p.modelo)}</span></div><div class="kpis">${kpi(p, 'Área de implantação', 'ÁREA DE IMPLANTAÇÃO')}${kpi(p, 'Área de construção', 'ÁREA DE CONSTRUÇÃO')}${kpi(p, 'Área útil', 'ÁREA ÚTIL')}${kpi(p, 'Altura da fachada', 'ALTURA DA FACHADA')}</div>`;
    h += `<div class="sec-title"><span>Verificação de normas</span></div>` + (p.verificacoes.length
      ? `<div class="card"><button class="row" style="width:100%;background:none;border:none;cursor:pointer;color:var(--ink);font-family:var(--font-sans)" data-seg="verif"><span class="k">${c.fail} não cumpre · ${c.warn} a confirmar · ${c.ok} cumpre</span><span class="ext">ver ›</span></button></div>`
      : `<p class="note">O ficheiro não traz verificações. Corre «Verificar normas» no Revit e envia de novo.</p>`);
    if (p.lote) h += `<div class="sec-title"><span>Lote</span><span>${elementosDoLote(p.lote).length} elementos LXi</span></div><div class="plan">${plantaLote(p.lote)}</div>`;
    h += `<p class="note">Exportado ${esc(quando(p.exportado))} pelo Conforme ${esc(p.plugin)}${p.remoto ? ` · ligado ao Revit, verificado ${esc(quando(p.remoto.verificado))}` : ' · ' + esc(p.ficheiro)}</p>
      <div style="margin-top:16px"><button class="btn ghost" data-apagar="${esc(p.id)}">Retirar este projeto do telemóvel</button></div>`;
  }
  if (S.seg === 'lote') {
    if (!p.lote) return h + `<p class="note">O plugin ainda não leu o lote no LXi. No Revit: 04 Requisitos › «Encontrar dados no mapa», e depois envia de novo para o telemóvel.</p>`;
    const els = elementosDoLote(p.lote), cores = legendaZonas(p.lote);
    h += `<div class="plan">${plantaLote(p.lote)}<div class="plan-cap"><span>Planta diagramática · lote + 15 m</span><span>${esc(p.lote.data || '')}</span></div></div>
      <div class="sec-title"><span>Condicionantes</span><span>${els.length}</span></div>${listaElementos(els, cores)}`;
  }
  if (S.seg === 'verif') {
    if (!p.verificacoes.length) return h + `<p class="note">Sem verificações neste ficheiro.</p>`;
    const fl = [['todas', 'Todas'], ['fail', 'Não cumpre'], ['warn', 'A confirmar'], ['ok', 'Cumpre']];
    const lista = p.verificacoes.map((v, i) => [v, i]).filter(([v]) => S.filtro === 'todas' || v.estado === S.filtro);
    h += `<div class="filter">${fl.map(([k, l]) => `<button class="chipb ${S.filtro === k ? 'on' : ''}" data-filtro="${k}">${l} · ${k === 'todas' ? p.verificacoes.length : p.verificacoes.filter(v => v.estado === k).length}</button>`).join('')}</div>
      <div class="card">${lista.map(([v, i]) => { const op = S.abertos['v' + i];
        return `<div class="check" data-abre="v${i}" role="button" tabindex="0" aria-expanded="${!!op}"><span class="dot d-${v.estado === 'skip' ? 'mute' : v.estado}"></span><div>
          <div class="check-t">${esc(v.titulo)}</div><div class="check-m">${esc(v.artigo || v.meta)}</div>
          ${op ? `<div class="check-x ${v.estado === 'warn' ? 'w' : v.estado === 'ok' ? 'o' : ''}">${esc(v.detalhe || v.meta)}${v.falhas.length ? `<ul style="margin:6px 0 0;padding-left:16px">${v.falhas.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}</div>` : ''}</div></div>`; }).join('') || '<div class="row"><span class="k">Nenhuma neste filtro</span></div>'}</div>
      <p class="note">As marcas a vermelho no modelo ficam no Revit; aqui vês o resultado e o artigo.</p>`;
  }
  if (S.seg === 'med') {
    if (!p.medicoes) return h + `<p class="note">Sem medições neste ficheiro.</p>`;
    const m = p.medicoes;
    h += `${m.erros.map(x => `<div class="err">${esc(x)}</div>`).join('')}
      <div class="sec-title" style="margin-top:2px"><span>Medições · DR 5/2019</span><span>${esc(m.fase)}</span></div>
      <div class="card">${m.resultados.map(r => `<div class="row"><span class="k">${esc(r.conceito)}${r.provisorio ? '<small class="prov">provisório</small>' : ''}</span><span class="v">${fmtNum(r.valor, r.casas)} ${esc(r.unidade)}</span></div>`).join('')}</div>`;
    const pisos = m.niveis.filter(n => n.conta);
    if (pisos.length) h += `<div class="sec-title"><span>Por piso</span></div><div class="card">${pisos.map(n => `<div class="row"><span class="k">${esc(n.nome)}<small>${n.compartimentos} compartimentos · ${n.acima ? 'acima' : 'abaixo'} da soleira</small></span><span class="v">${fmtNum(n.area, 1)} m²</span></div>`).join('')}</div>`;
    if (m.fogos.length) h += `<div class="sec-title"><span>Fogos</span></div><div class="card">${m.fogos.map(f => `<div class="row"><span class="k">${esc(f.fogo)} ${esc(f.tipologia)}<small>área útil ${fmtNum(f.util, 1)} m²</small></span><span class="v">${fmtNum(f.bruta, 1)} m²</span></div>`).join('')}</div>`;
    if (m.avisos.length) h += `<div class="sec-title"><span>Avisos da medição</span></div><div class="card">${m.avisos.map(a => `<div class="row"><span class="k">${esc(a)}</span></div>`).join('')}</div>`;
  }
  if (S.seg === 'docs') {
    const est = d => /entreg|pronto|gerad|feito/i.test(d.estado) ? 'ok' : /falta|carregar/i.test(d.estado) ? 'fail' : 'info';
    h += `<div class="card">${p.documentos.map(d => `<div class="doc"><div><div class="doc-n">${esc(d.nome)}</div><div class="doc-m">${esc(d.nota)}</div></div>${pill(est(d), d.estado || '—')}</div>`).join('')}</div>`;
  }
  return h;
}
function listaElementos(els, cores = new Map()) {
  if (!els.length) return `<p class="note">Nenhuma camada encontrada.</p>`;
  return `<div class="card">${els.map(e => `<div class="layer"><div class="layer-top"><div class="layer-n"><span class="sw" style="background:${cores.get(e.camada) || 'var(--line-strong)'};opacity:.75"></span><span>${esc(e.nome)}${e.valor && e.valor !== e.nome ? ` · ${esc(e.valor)}` : ''}</span></div>${pill(e.incide ? 'info' : 'mute', e.incide ? 'incide no lote' : 'na envolvente')}</div>
    ${e.artigos ? `<div class="layer-a">${esc(e.artigos)}</div>` : ''}<div class="src">${esc(e.fonte)}</div></div>`).join('')}</div>`;
}

/* ---------- Morada ---------- */
function projetoDaMorada(m) { const k = norm(m); return S.projetos.find(p => p.lote && norm(p.enquadramento.morada) && (norm(p.enquadramento.morada).includes(k) || k.includes(norm(p.enquadramento.morada)))); }
function vMorada() {
  bar('Consultar morada', 'LISBOA');
  let h = `<form id="fq"><div class="search">${LUPA}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Rua e número, ex. Rua de São Bento 100" value="${esc(S.q)}" aria-label="Morada em Lisboa"></div><button class="btn" type="submit" style="margin-top:8px">Consultar</button></form>
    <div class="opts"><div><label for="uso">USO</label><select id="uso">${USOS.map(u => `<option ${S.uso === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
    <div><label for="interv">INTERVENÇÃO</label><select id="interv">${INTERVENCOES.map(u => `<option ${S.interv === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div>`;
  const pr = S.procura;
  if (pr && !S.morada) {
    if (pr.estado === 'a procurar') h += `<div class="steps"><div class="step run"><span class="s"><span class="spin"></span></span><span>A procurar a morada…</span></div></div>`;
    else if (pr.erro) h += `<div class="err">Não foi possível procurar a morada (${esc(pr.erro)}). Verifica a ligação à internet e tenta de novo.</div>`;
    else if (!pr.resultados.length) h += `<p class="note">Não encontrei esta morada em Lisboa. Experimenta escrever o nome da rua sem abreviaturas, com o número.</p>`;
    else h += `<div class="sec-title"><span>Escolhe a morada</span></div><div class="sugg" style="border-top:1px solid var(--line-strong)">${pr.resultados.map((r, i) => `<button data-escolhe="${i}">${esc(r.morada)}<small>${esc(r.detalhe)}${r.exacta ? '' : ' · sem número de porta'}</small></button>`).join('')}</div>`;
  }
  if (!pr && !S.morada) {
    const comLote = S.projetos.filter(p => p.lote && p.enquadramento.morada);
    if (comLote.length) h += `<div class="sec-title"><span>Moradas dos teus projetos</span></div><div class="card">${comLote.map(p => `<button class="row" style="width:100%;background:none;border:none;border-bottom:1px solid var(--line);cursor:pointer;color:var(--ink);font-family:var(--font-sans);text-align:left" data-pesquisa="${esc(p.enquadramento.morada)}"><span>${esc(p.enquadramento.morada)}</span><span class="ext">›</span></button>`).join('')}</div>`;
    h += `<p class="note">A app procura a morada, consulta as camadas públicas da Câmara de Lisboa nesse ponto e cruza o resultado com as regras e a legislação do Conforme. As camadas do PDM que só existem no LXi aparecem como «por confirmar», a não ser que a morada seja de um projeto teu, lido pelo plugin.</p>`;
  }
  if (!S.morada) return h + blocoGeral();
  const m = S.morada, c = S.consulta;
  h += `<div class="sec-title"><span>Resultado</span><button class="back" data-limpar="1" style="font-size:10.5px">nova consulta</button></div>
    <div class="addr-head"><div class="a">${esc(m.morada)}</div><div class="m">${esc(m.detalhe)}<br>${m.lat.toFixed(5)}, ${m.lon.toFixed(5)} · ${esc(S.uso)} · ${esc(S.interv)}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px"><a class="ln" href="https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lon}#map=19/${m.lat}/${m.lon}" target="_blank" rel="noopener">ver no mapa ↗</a><a class="ln" href="${LXI_URL}" target="_blank" rel="noopener">abrir o LXi ↗</a></div></div>`;
  if (!c || c.estado === 'a consultar') return h + `<div class="steps"><div class="step done"><span class="s">✓</span><span>Morada → coordenadas</span></div><div class="step run"><span class="s"><span class="spin"></span></span><span>Camadas da CML · ${c ? c.feitos : 0} de ${c ? c.total : '…'}</span></div><div class="step"><span class="s">·</span><span>Regras e legislação aplicável</span></div></div>`;
  const proj = projetoDaMorada(m.morada);
  const doLxi = proj ? elementosDoLote(proj.lote) : [];
  const els = [...doLxi, ...c.elementos];
  if (proj) h += `<div class="sec-title"><span>Lote lido no LXi pelo plugin</span><button class="back" data-proj="${esc(proj.id)}" style="font-size:10.5px">abrir projeto ›</button></div><div class="plan">${plantaLote(proj.lote)}</div>${listaElementos(doLxi, legendaZonas(proj.lote))}`;
  h += `<div class="sec-title"><span>Camadas públicas da CML</span><span>${c.elementos.length}</span></div>${listaElementos(c.elementos)}`;
  if (c.falhas.length) h += `<div class="err">Não responderam: ${esc(c.falhas.map(f => f.camada).join(', '))}. O resultado pode estar incompleto.</div>`;
  if (!proj) h += `<div class="sec-title"><span>Por confirmar no LXi</span></div><ul class="lxi-list">${SO_NO_LXI.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="note">Estas camadas do PDM não estão nos serviços públicos que a app consegue ler. Abre o LXi para as ver, ou lê o lote com o plugin no Revit.</p>`;
  const { leg, regras } = S.dados;
  const req = requisitos(regras, { uso: S.uso, elementos: els });
  h += `<div class="sec-title"><span>Requisitos do Conforme</span><span>${req.length}</span></div><div class="card">${req.map(r => `<div class="req"><div class="req-t"><span>${esc(r.titulo)}</span>${pill(r.lote ? 'warn' : 'mute', r.lote ? 'do lote' : 'geral')}</div><div class="req-v">${esc(r.texto)}</div><div class="req-s">${esc(r.artigo)}</div></div>`).join('')}</div>`;
  const la = aplicavel(leg, { uso: S.uso, elementos: els });
  h += `<div class="sec-title"><span>Legislação aplicável</span><span>${la.length} diplomas</span></div>${legLista(la, 'm')}`;
  return h;
}
async function pesquisar(texto) {
  S.q = texto; S.morada = null; S.consulta = null; S.procura = { estado: 'a procurar' }; render(true);
  try { S.procura = { estado: 'ok', resultados: await procurarMorada(texto) }; }
  catch (e) { S.procura = { estado: 'erro', erro: e.message || 'erro' }; }
  if (S.procura.resultados && S.procura.resultados.length === 1 && S.procura.resultados[0].exacta) return escolher(0);
  render(true);
}
async function escolher(i) {
  const m = S.procura.resultados[i]; S.morada = m; S.consulta = { estado: 'a consultar', feitos: 0, total: 0 }; render(true);
  const r = await consultarPonto(m.lat, m.lon, { onPasso: (f, t) => { if (S.morada === m) { S.consulta.feitos = f; S.consulta.total = t; render(true); } } });
  if (S.morada !== m) return;
  S.consulta = { estado: 'ok', ...r }; render(true);
}

/** Requisitos gerais e legislação aplicável em Lisboa para o uso escolhido, mesmo sem morada ou sem resposta dos serviços. */
function blocoGeral() {
  const { leg, regras } = S.dados;
  const req = requisitos(regras, { uso: S.uso, elementos: [] });
  const la = aplicavel(leg, { uso: S.uso, elementos: [] });
  return `<div class="sec-title"><span>Requisitos gerais · ${esc(S.uso)}</span><span>${req.length}</span></div><div class="card">${req.map(r => `<div class="req"><div class="req-t"><span>${esc(r.titulo)}</span>${pill('mute', 'geral')}</div><div class="req-v">${esc(r.texto)}</div><div class="req-s">${esc(r.artigo)}</div></div>`).join('')}</div>
    <div class="sec-title"><span>Legislação aplicável em Lisboa</span><span>${la.length} diplomas</span></div>${legLista(la, 'g')}
    <p class="note">Sem morada, a lista não inclui o que depende do lote (património, planos de pormenor, servidões). Consulta uma morada para a completar.</p>`;
}

/* ---------- Legislação ---------- */
function legLista(lista, pref) {
  return agrupar(lista).map(([g, it]) => { const k = pref + g, op = S.legAbertos[k];
    return `<details class="lg" ${op ? 'open' : ''} data-lg="${esc(k)}"><summary><span class="chev">›</span><span class="lg-name">${esc(g)}</span><span class="lg-n">${it.length}</span></summary>
    ${op ? it.map(l => `<a class="lg-item" href="${esc(urlSegura(l.u))}" target="_blank" rel="noopener"><div class="lg-t"><span>${esc(l.t)}</span><span class="ext">${esc(l.a || '')} ↗</span></div><div class="lg-d">${esc(l.d)}</div>${l.r ? `<div class="lg-r">${esc(l.r.length > 160 ? l.r.slice(0, 157) + '…' : l.r)}</div>` : ''}</a>`).join('') : ''}</details>`; }).join('');
}
function vLeg() {
  bar('Legislação', 'TABELA DO CONFORME');
  const q = norm(S.legQ), leg = S.dados.leg;
  const lista = q ? leg.filter(l => norm(l.t + ' ' + l.d + ' ' + l.r).includes(q)) : leg;
  if (q) agrupar(lista).forEach(([g]) => S.legAbertos['l' + g] = true);
  return `<div class="search">${LUPA}<input id="lq" type="search" autocomplete="off" placeholder="Procurar, ex. RGEU, 555/99, acústica" value="${esc(S.legQ)}" aria-label="Procurar na legislação"></div>
    <p class="note" style="margin-bottom:12px">${lista.length} diplomas · cada um abre no Diário da República.</p>${legLista(lista, 'l')}`;
}

/* ---------- Ficheiros ---------- */
function vFicheiros() {
  bar('Ficheiros', 'LIGAÇÃO AO REVIT');
  return `<div class="card"><div class="row"><span class="k">Projetos no telemóvel</span><span class="v">${S.projetos.length}</span></div>
    <div class="row"><span class="k">Ligados ao Revit</span><span class="v">${S.projetos.filter(p => p.remoto).length}</span></div>
    <div class="row"><span class="k">Pasta no PC</span><span class="v">OneDrive › Conforme › Telemóvel</span></div>
    <div class="row"><span class="k">Versão da app</span><span class="v">${VERSAO_APP}</span></div></div>
    <div style="margin-top:14px;display:grid;gap:8px"><button class="btn" data-ligar="1">Ler QR Code do projeto</button><button class="btn ghost" data-ligar="manual">Escrever o código do projeto</button></div>
    <div class="sec-title"><span>Com QR Code (recomendado)</span></div>
    <ol class="lxi-list" style="color:var(--ink)"><li>No Revit, <b>Conforme › Enviar para o telemóvel</b> e depois <b>QR Code</b>.</li>
    <li>Aqui, «Ler QR Code do projeto», aponta para o ecrã do PC e escreve a senha. Só a pedimos uma vez.</li>
    <li>A partir daí o projeto atualiza-se sozinho: ao abrir a app e de minuto a minuto enquanto ela está aberta. Com «automático» ligado no plugin, cada alteração no modelo chega em menos de um minuto.</li></ol>
    <p class="note">Os projetos viajam cifrados com a tua senha; sem ela ninguém os consegue ler. Lê o QR Code dentro desta app (e não com a câmara do iPhone), porque a app instalada no ecrã principal e o Safari guardam os dados em sítios diferentes.</p>
    <div class="sec-title"><span>Com ficheiro</span></div>
    <div>${botaoAbrir('Abrir ficheiro .conforme.json', true)}</div>
    <p class="note">O plugin grava também uma cópia em <b>OneDrive › Conforme › Telemóvel</b>, que podes abrir pela app Ficheiros. Um projeto aberto assim não se atualiza sozinho.</p>`;
}

/* ---------- abrir ficheiros ---------- */
async function abrirFicheiros(files) {
  let ok = 0, ult = null;
  for (const f of files) {
    try { const p = lerProjeto(await f.text(), f.name); await armazem.guardar(p); ok++; ult = p; }
    catch (e) { toast(e instanceof FormatoInvalido ? `${f.name}: ${e.message}` : `${f.name}: não foi possível ler o ficheiro`); }
  }
  S.projetos = await armazem.listar();
  if (ok) { toast(ok === 1 ? `Projeto «${ult.nome}» atualizado` : `${ok} projetos atualizados`); S.tab = 'projetos'; S.proj = ok === 1 ? ult.id : null; S.seg = 'resumo'; }
  render();
}

/* ---------- ligar por QR Code + atualização automática ---------- */
const modal = () => $('#modal');
function pintarLigar() {
  const L = S.ligar, m = modal();
  if (!L) { m.hidden = true; m.innerHTML = ''; return; }
  m.hidden = false;
  let h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ligT">';
  if (L.scan && !L.codigo) {
    h += `<h3 id="ligT">Ler QR Code</h3><p class="note" style="margin-top:0">Aponta para o QR Code que o plugin mostra no Revit.</p>
      <div class="scan"><video id="cam" playsinline muted></video><div class="mira"></div></div>
      ${L.erro ? `<div class="err">${esc(L.erro)}</div>` : ''}
      <div class="acoes"><button class="btn ghost" data-ligar="manual">Escrever o código</button><button class="btn ghost" data-fechar="1">Cancelar</button></div>`;
  } else {
    h += `<form id="fligar"><h3 id="ligT">Ligar projeto do Revit</h3>
      ${L.codigo && !L.manual ? `<div class="code">código ${esc(L.codigo)}</div>` : `<input type="text" id="ligCod" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Código do projeto (no painel, por baixo do QR)" value="${esc(L.codigo || '')}">`}
      <input type="password" id="ligSenha" autocomplete="current-password" placeholder="Senha" aria-label="Senha">
      ${L.erro ? `<div class="err">${esc(L.erro)}</div>` : ''}
      <div class="acoes"><button class="btn" type="submit" ${L.ocupado ? 'disabled' : ''}>${L.ocupado ? 'A abrir…' : 'Abrir projeto'}</button><button class="btn ghost" type="button" data-fechar="1">Cancelar</button></div></form>`;
  }
  m.innerHTML = h + '</div>';
  if (L.scan && !L.codigo) iniciarCamara(); else setTimeout(() => { const i = $('#ligCod') || $('#ligSenha'); i && i.focus(); }, 50);
}
function abrirLigar(o) { pararCamara(); S.ligar = { ...o }; pintarLigar(); }
function fecharLigar() { pararCamara(); S.ligar = null; pintarLigar(); }

let camara = null;
function carregarJsQR() {
  if (window.jsQR) return Promise.resolve();
  return new Promise((ok, erro) => { const s = document.createElement('script'); s.src = 'vendor/jsQR.js'; s.onload = ok; s.onerror = () => erro(new Error('jsQR')); document.head.appendChild(s); });
}
async function iniciarCamara() {
  if (camara) return;
  const v = $('#cam'); if (!v) return;
  camara = { vivo: true };
  try {
    await carregarJsQR();
    camara.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    if (!camara || !camara.vivo) return;
    v.srcObject = camara.stream; await v.play();
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const passo = () => {
      if (!camara || !camara.vivo) return;
      if (v.readyState >= 2 && v.videoWidth) {
        const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        cv.width = Math.round(v.videoWidth * k); cv.height = Math.round(v.videoHeight * k);
        cx.drawImage(v, 0, 0, cv.width, cv.height);
        const r = window.jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' });
        if (r && r.data) {
          const c = remoto.codigoDe(r.data);
          if (c) { if (navigator.vibrate) navigator.vibrate(40); abrirLigar({ codigo: c }); return; }
          S.ligar.erro = 'Este QR Code não é de um projeto do Conforme.';
        }
      }
      camara.raf = requestAnimationFrame(passo);
    };
    passo();
  } catch (e) {
    pararCamara();
    if (S.ligar) { S.ligar = { manual: true, erro: 'Não foi possível usar a câmara. Autoriza o acesso nas definições do iPhone, ou escreve o código que aparece por baixo do QR Code.' }; pintarLigar(); }
  }
}
function pararCamara() {
  if (!camara) return;
  camara.vivo = false; cancelAnimationFrame(camara.raf);
  if (camara.stream) camara.stream.getTracks().forEach(t => t.stop());
  camara = null;
}

async function submeterLigar() {
  const L = S.ligar; if (!L || L.ocupado) return;
  const codigo = L.manual || !L.codigo ? remoto.codigoDe($('#ligCod') && $('#ligCod').value) : L.codigo;
  const senha = $('#ligSenha').value;
  if (!codigo) { L.erro = 'Código inválido. Copia-o tal como aparece no painel do Revit.'; pintarLigar(); return; }
  if (!senha) { L.codigo = codigo; L.erro = 'Escreve a senha que definiste no plugin.'; pintarLigar(); return; }
  L.codigo = codigo; L.ocupado = true; L.erro = ''; pintarLigar();
  try {
    const r = await remoto.buscar(codigo);
    const { texto, chave } = await remoto.abrir(r.env, { senha });
    const p = await guardarRemoto(codigo, texto, { etag: r.etag, chave });
    fecharLigar(); S.projetos = await armazem.listar();
    S.tab = 'projetos'; S.proj = p.id; S.seg = 'resumo'; render();
    toast(`«${p.nome}» ligado. Vai atualizar-se sozinho.`);
  } catch (e) {
    if (!S.ligar) return;
    S.ligar.ocupado = false; S.ligar.erro = e.message || 'Não foi possível abrir o projeto.'; pintarLigar();
  }
}
async function guardarRemoto(codigo, texto, { etag, chave }) {
  const p = lerProjeto(texto, 'GitHub');
  p.id = 'r-' + codigo;
  p.remoto = { codigo, etag: etag || '', chave, verificado: new Date().toISOString(), erro: '' };
  await armazem.guardar(p);
  return p;
}

let aSincronizar = false;
async function sincronizar() {
  if (aSincronizar || !navigator.onLine) return;
  const lista = S.projetos.filter(p => p.remoto && p.remoto.chave);
  if (!lista.length) return;
  aSincronizar = true;
  let mudou = [];
  try {
    for (const p of lista) {
      try {
        const r = await remoto.buscar(p.remoto.codigo, p.remoto.etag);
        if (!r) { p.remoto.verificado = new Date().toISOString(); p.remoto.erro = ''; await armazem.guardar(p); continue; }
        const { texto, chave } = await remoto.abrir(r.env, { chave: p.remoto.chave });
        const novo = lerProjeto(texto, 'GitHub');
        if (novo.exportado !== p.exportado) mudou.push(novo.nome);
        await guardarRemoto(p.remoto.codigo, texto, { etag: r.etag, chave });
      } catch (e) {
        p.remoto.erro = e.senha ? 'a senha mudou: lê o QR Code de novo' : e.estado === 404 ? 'já não está no GitHub' : '';
        await armazem.guardar(p);
      }
    }
  } finally { aSincronizar = false; }
  S.projetos = await armazem.listar();
  if (mudou.length) toast(mudou.length === 1 ? `«${mudou[0]}» atualizado a partir do Revit` : `${mudou.length} projetos atualizados`);
  // só volta a desenhar o ecrã se algo mudou e a pessoa não está a escrever
  const aEscrever = document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  if (mudou.length && !S.ligar && !aEscrever && !(S.consulta && S.consulta.estado === 'a consultar')) render(true);
}

/* ---------- render + eventos ---------- */
function render(manterScroll) {
  tabs();
  const c = $('#content'), st = c.scrollTop;
  if (!S.dados) { c.innerHTML = '<p class="note">A carregar…</p>'; return; }
  c.innerHTML = S.tab === 'projetos' ? (S.proj ? vProjeto() : vProjetos()) : S.tab === 'morada' ? vMorada() : S.tab === 'leg' ? vLeg() : vFicheiros();
  c.scrollTop = manterScroll ? st : 0;
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-tab],[data-proj],[data-seg],[data-voltar],[data-filtro],[data-abre],[data-escolhe],[data-limpar],[data-pesquisa],[data-exemplo],[data-apagar],[data-ligar],[data-fechar]');
  if (!t) return;
  const d = t.dataset;
  if (d.tab) { if (S.tab === d.tab && d.tab === 'projetos') S.proj = null; S.tab = d.tab; render(); return; }
  if (d.proj) { S.tab = 'projetos'; S.proj = d.proj; S.seg = 'resumo'; S.abertos = {}; S.filtro = 'todas'; render(); return; }
  if (d.seg) { S.seg = d.seg; render(); return; }
  if (d.voltar) { S.proj = null; render(); return; }
  if (d.filtro) { S.filtro = d.filtro; render(true); return; }
  if (d.abre) { S.abertos[d.abre] = !S.abertos[d.abre]; render(true); return; }
  if (d.escolhe) { escolher(+d.escolhe); return; }
  if (d.limpar) { S.morada = null; S.consulta = null; S.procura = null; S.q = ''; render(); return; }
  if (d.pesquisa) { pesquisar(d.pesquisa); return; }
  if (d.exemplo) { const r = await fetch('data/exemplo.conforme.json'); await abrirFicheiros([new File([await r.text()], 'exemplo.conforme.json')]); return; }
  if (d.ligar) { abrirLigar(d.ligar === 'manual' ? { manual: true } : { scan: true }); return; }
  if (d.fechar) { fecharLigar(); return; }
  if (d.apagar) { await armazem.apagar(d.apagar); S.projetos = await armazem.listar(); S.proj = null; toast('Projeto retirado do telemóvel'); render(); return; }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-abre]')) { e.preventDefault(); e.target.click(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.file-in .btn')) { e.preventDefault(); e.target.closest('label').querySelector('input').click(); }
});
document.addEventListener('submit', e => { if (e.target.id === 'fligar') { e.preventDefault(); submeterLigar(); return; } if (e.target.id === 'fq') { e.preventDefault(); const v = $('#q').value.trim(); if (v.length >= 3) { $('#q').blur(); pesquisar(v); } } });
document.addEventListener('toggle', e => { const el = e.target; if (el.matches && el.matches('details[data-lg]') && S.legAbertos[el.dataset.lg] !== el.open) { S.legAbertos[el.dataset.lg] = el.open; render(true); } }, true);
document.addEventListener('input', e => { if (e.target.id === 'lq') { S.legQ = e.target.value; const pos = e.target.selectionStart; render(true); const i = $('#lq'); i.focus(); i.setSelectionRange(pos, pos); } if (e.target.id === 'q') S.q = e.target.value; });
document.addEventListener('change', e => {
  if (e.target.id === 'uso') { S.uso = e.target.value; render(true); }
  if (e.target.id === 'interv') { S.interv = e.target.value; render(true); }
  if (e.target.matches('[data-abrir]') && e.target.files.length) abrirFicheiros([...e.target.files]);
});

(async function iniciar() {
  render();
  try { S.dados = await carregar(); } catch { $('#content').innerHTML = '<div class="err">Não foi possível carregar a legislação. Abre a app com ligação à internet pelo menos uma vez.</div>'; return; }
  S.projetos = await armazem.listar();
  render();
  const doQr = remoto.codigoDe(location.hash);
  if (doQr) { history.replaceState(null, '', location.pathname); abrirLigar({ codigo: doQr }); }
  sincronizar();
  setInterval(() => { if (document.visibilityState === 'visible') sincronizar(); }, REMOTO.intervalo);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizar(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
