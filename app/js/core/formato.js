// Lê e valida um ficheiro .conforme.json gravado pelo plugin (ver schema/conforme.schema.json).
// Devolve sempre o mesmo modelo interno, para a interface não depender dos pormenores do ficheiro.
import { FORMATO } from '../config.js';

export class FormatoInvalido extends Error {}

const txt = v => (v == null ? '' : String(v));
const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
const lista = v => (Array.isArray(v) ? v : []);

export function lerProjeto(texto, nomeFicheiro = '') {
  let j;
  try { j = typeof texto === 'string' ? JSON.parse(texto) : texto; }
  catch { throw new FormatoInvalido('O ficheiro não é JSON. Escolhe um ficheiro .conforme.json gravado pelo plugin.'); }
  if (!j || j.formato !== FORMATO.nome) throw new FormatoInvalido('Este ficheiro não foi gravado pelo Conforme (falta "formato": "conforme").');
  if (!(j.versao >= 1)) throw new FormatoInvalido('Versão do ficheiro desconhecida.');
  if (j.versao > FORMATO.versaoMaxima) throw new FormatoInvalido(`O ficheiro é da versão ${j.versao} e esta app só lê até à ${FORMATO.versaoMaxima}. Actualiza a app.`);

  const e = j.enquadramento || {};
  const m = j.medicoes || null;
  const morada = txt(e.morada) || txt(m && m.moradaProjecto);
  return {
    id: txt(j.id) || (morada || txt(j.modelo) || nomeFicheiro).toLowerCase().replace(/[^a-z0-9à-ú]+/gi, '-'),
    nome: morada || txt(j.modelo) || nomeFicheiro,
    ficheiro: nomeFicheiro,
    exportado: txt(j.exportado),
    plugin: txt(j.plugin),
    modelo: txt(j.modelo),
    exemplo: !!j.exemplo,
    enquadramento: {
      morada, cp: txt(e.cp), localidade: txt(e.localidade), freguesia: txt(e.freguesia),
      uso: txt(e.uso), intervencao: txt(e.intervencao), procedimento: txt(e.proc || e.procedimento), pedido: txt(e.pedido),
      natureza: txt(e.natureza), tipoHab: txt(e.tipoHab),
    },
    lote: j.lote && typeof j.lote === 'object' ? j.lote : null,
    medicoes: m ? {
      data: txt(m.data), fase: txt(m.faseMedida),
      resultados: lista(m.resultados).map(r => ({ conceito: txt(r.conceito), valor: num(r.valor), unidade: txt(r.unidade), casas: num(r.casas) ?? 2, provisorio: !!r.provisorio, metodo: txt(r.metodo) })),
      niveis: lista(m.niveis).map(n => ({ nome: txt(n.nome), cota: num(n.cota), area: num(n.areaPavimentos), compartimentos: num(n.compartimentos) ?? 0, acima: !!n.acimaSoleira, conta: n.contaArea !== false })),
      fogos: lista(m.fogos).map(f => ({ fogo: txt(f.fogo), tipologia: txt(f.tipologia), bruta: num(f.areaBruta), util: num(f.areaUtil) })),
      avisos: lista(m.avisos).map(txt), erros: lista(m.erros).map(txt),
    } : null,
    verificacoes: lista(j.verificacoes).map(v => ({
      estado: ({ fail: 'fail', pass: 'ok', ok: 'ok', warn: 'warn', skip: 'skip' })[v.status] || 'skip',
      titulo: txt(v.titulo), meta: txt(v.meta), detalhe: txt(v.detalhe), artigo: txt(v.artigo), leg: txt(v.leg), falhas: lista(v.falhas).map(txt),
    })),
    documentos: lista(j.documentos).map(d => ({ nome: txt(d.nome), estado: txt(d.estado), nota: txt(d.nota) })),
  };
}

/** Valor de uma medição pelo início do nome do conceito (como o painel do plugin faz). */
export function medicao(p, inicio) {
  const r = p.medicoes && p.medicoes.resultados.find(x => x.conceito.toLowerCase().startsWith(inicio.toLowerCase()));
  return r || null;
}

export function fmtNum(v, casas = 2) {
  return v == null ? '—' : Number(v).toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
