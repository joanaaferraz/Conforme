// Consulta por morada em Lisboa: morada → coordenadas → camadas públicas da CML que incidem no ponto.
// Sem interface: devolve dados simples, para a web app e para uma futura app nativa.
import { GEOCODER, CAMADAS_PUBLICAS } from '../config.js';

const espera = ms => new Promise(r => setTimeout(r, ms));

async function json(url, { signal, tentativas = 2 } = {}) {
  let ultimo;
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url, { signal, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j && j.error) throw new Error(j.error.message || 'erro do serviço');
      return j;
    } catch (e) {
      if (signal && signal.aborted) throw e;
      ultimo = e; await espera(600 * (i + 1));
    }
  }
  throw ultimo;
}

/** Procura moradas em Lisboa. Devolve [{morada, detalhe, lat, lon, exacta}]. Tenta o ArcGIS e, se falhar, o Nominatim. */
export async function procurarMorada(texto, { signal } = {}) {
  const q = String(texto || '').trim();
  if (q.length < 3) return [];
  const comLisboa = /lisboa/i.test(q) ? q : q + ', Lisboa';
  let erro = null;
  try {
    const r = await arcgis(comLisboa, signal);
    if (r.length) return r;
  } catch (e) { if (signal && signal.aborted) throw e; erro = e; }
  try { return await nominatim(comLisboa, signal); }
  catch (e) { throw erro || e; }
}

const dentroDeLisboa = (lat, lon) => { const [o, n, e, s] = GEOCODER.viewbox; return lon >= o && lon <= e && lat >= s && lat <= n; };

async function arcgis(q, signal) {
  const [o, n, e, s] = GEOCODER.viewbox;
  const p = new URLSearchParams({ SingleLine: q, countryCode: 'PRT', maxLocations: '6', langCode: 'PT',
    searchExtent: `${o},${s},${e},${n}`, outFields: 'Match_addr,Addr_type,Postal,Nbrhd,District,City', f: 'json' });
  const r = await json(`${GEOCODER.arcgis}?${p}`, { signal });
  const vistos = new Set();
  return (r.candidates || []).filter(c => c.score >= 75 && dentroDeLisboa(c.location.y, c.location.x)).map(c => {
    const a = c.attributes || {};
    const partes = String(c.address || a.Match_addr || '').split(',').map(x => x.trim());
    const morada = partes.filter(x => !/^\d{4}-\d{3}$/.test(x) && !/^lisboa$/i.test(x)).join(', ') || c.address;
    return { morada, detalhe: [a.Nbrhd || a.District, a.Postal, 'Lisboa'].filter(Boolean).join(' · '), lat: c.location.y, lon: c.location.x,
      exacta: /PointAddress|StreetAddress|Subaddress/i.test(a.Addr_type || '') };
  }).filter(m => { const k = m.morada.toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
}

async function nominatim(q, signal) {
  const [o, n, e, s] = GEOCODER.viewbox;
  const p = new URLSearchParams({
    q, format: 'jsonv2', addressdetails: '1', limit: '6',
    countrycodes: 'pt', viewbox: `${o},${n},${e},${s}`, bounded: '1', 'accept-language': 'pt-PT',
  });
  const r = await json(`${GEOCODER.url}?${p}`, { signal });
  return (r || []).map(x => {
    const a = x.address || {};
    const rua = a.road || a.pedestrian || a.square || x.name || '';
    const num = a.house_number ? `, ${a.house_number}` : '';
    const morada = rua ? rua + num : x.display_name.split(',').slice(0, 2).join(',');
    const det = [a.suburb || a.city_district || a.quarter, a.postcode, 'Lisboa'].filter(Boolean).join(' · ');
    return { morada, detalhe: det, lat: +x.lat, lon: +x.lon, exacta: !!a.house_number };
  });
}

const TECNICOS = /^(objectid|fid|shape|globalid|id|cod|codigo|created|last_|st_|area|perim|len)/i;
function rotulo(atr, preferidos) {
  for (const k of preferidos || []) {
    const hit = Object.keys(atr).find(a => a.toLowerCase() === k.toLowerCase());
    if (hit && atr[hit] != null && String(atr[hit]).trim()) return String(atr[hit]).trim();
  }
  const k = Object.keys(atr).find(a => !TECNICOS.test(a) && typeof atr[a] === 'string' && atr[a].trim().length > 2);
  return k ? atr[k].trim() : '';
}

function artigoDe(atr, c) {
  const v = c.artigoCampo && atr[c.artigoCampo];
  return v && String(v).trim() ? `RPDM, ${String(v).trim().replace(/^RPDM,?\s*/i, '')}` : c.artigos;
}

/** Uma camada: elementos que tocam no círculo de raio r (m) à volta do ponto. */
async function consultarCamada(c, lat, lon, signal) {
  const p = new URLSearchParams({
    geometry: `${lon},${lat}`, geometryType: 'esriGeometryPoint', inSR: '4326', spatialRel: 'esriSpatialRelIntersects',
    distance: String(c.raio || 0), units: 'esriSRUnit_Meter', outFields: '*', returnGeometry: 'false', resultRecordCount: '20', f: 'json',
  });
  const r = await json(`${c.url}/query?${p}`, { signal });
  return (r.features || []).map(f => ({ camada: c.id, tipo: c.tipo, nome: c.nome, valor: rotulo(f.attributes || {}, c.campos), artigos: artigoDe(f.attributes || {}, c), incide: !c.raio, fonte: 'CML · dados abertos' }));
}

/**
 * Consulta todas as camadas públicas. onPasso(i, total, camada) informa o progresso.
 * Devolve { elementos, falhas:[{camada, erro}] } — uma camada que falha não impede as outras.
 */
export async function consultarPonto(lat, lon, { signal, onPasso } = {}) {
  const elementos = [], falhas = [];
  let feitos = 0;
  await Promise.all(CAMADAS_PUBLICAS.map(async c => {
    try { elementos.push(...await consultarCamada(c, lat, lon, signal)); }
    catch (e) { if (!(signal && signal.aborted)) falhas.push({ camada: c.nome, erro: String(e.message || e) }); }
    finally { feitos++; onPasso && onPasso(feitos, CAMADAS_PUBLICAS.length, c); }
  }));
  const ordem = CAMADAS_PUBLICAS.map(c => c.id);
  elementos.sort((a, b) => (b.incide - a.incide) || (ordem.indexOf(a.camada) - ordem.indexOf(b.camada)));
  return { elementos, falhas };
}

/** Elementos do lote lidos pelo plugin no LXi (ficheiro .conforme.json) no mesmo formato da consulta. */
export function elementosDoLote(lote) {
  if (!lote || !Array.isArray(lote.elementos)) return [];
  const vistos = new Set();
  return lote.elementos.filter(e => { const k = e.camada + '|' + e.valor; if (vistos.has(k)) return false; vistos.add(k); return true; })
    .map(e => ({ camada: e.camada, tipo: e.servico || 'PDM', nome: e.camada, valor: e.valor, artigos: e.artigos || '', incide: e.incide === true, fonte: 'LXi · lido pelo plugin' }))
    .sort((a, b) => b.incide - a.incide);
}
