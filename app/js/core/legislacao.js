// Legislação e regras: os mesmos ficheiros do plugin (leg-v2.js → data/legislacao.json, ui/regras.json → data/regras.json).
let LEG = null, REGRAS = null;

export async function carregar() {
  if (!LEG) {
    const [a, b] = await Promise.all([fetch('data/legislacao.json'), fetch('data/regras.json')]);
    LEG = await a.json(); REGRAS = (await b.json()).regras || [];
  }
  return { leg: LEG, regras: REGRAS };
}

export const USOS = ['Habitação', 'Comércio', 'Serviços', 'Turismo', 'Equipamento', 'Indústria'];
export const INTERVENCOES = ['Construção nova', 'Alteração', 'Ampliação', 'Reconstrução', 'Demolição'];

/** Diplomas aplicáveis em Lisboa a um uso, tendo em conta o que se encontrou no lote. */
export function aplicavel(leg, { uso = 'Habitação', elementos = [] } = {}) {
  const tem = re => elementos.some(e => re.test(e.nome + ' ' + e.valor));
  const patrimonio = tem(/patrim|classifica|monumento|interesse|zep|protec/i);
  return leg.filter(l => {
    if (l.s && l.s !== '*' && l.s !== uso) return false;
    if (l.s === '*' && !/aquisição de habitação/i.test(l.t)) return false;
    if (/Açores|Madeira/.test(l.t)) return false;
    if (/^(PROT|Programa intermunicipal|Planos intermunicipais|Medidas preventivas)/.test(l.t)) return false;
    if (/^Plano de Urbanização/.test(l.t) && !tem(/urbaniza/i)) return false;
    if (/^Plano de Pormenor/.test(l.t) && !tem(/pormenor/i)) return false;
    if (/bens classificados/i.test(l.t) && !patrimonio) return false;
    if (/Habitação de custos controlados|Funcionamento de parques|Segurança contra incêndio em parques/.test(l.t)) return false;
    if (uso !== 'Habitação' && /Requisitos funcionais da habitação|Lei de Bases da Habitação/.test(l.t)) return false;
    return true;
  });
}

/** Requisitos do regras.json que se aplicam ao uso e às camadas encontradas no lote. */
export function requisitos(regras, { uso = 'Habitação', elementos = [] } = {}) {
  const chave = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const textoLote = chave(elementos.map(e => e.nome + ' ' + e.valor).join(' | '));
  // regra do plugin que depende do lote → o que tem de aparecer nas camadas encontradas
  const NO_LOTE = { zep: /\bzep\b|zona especial de protec/, aeronautica: /aeronaut/, arqueologia: /arqueol/, estacionamento: /estacionamento/,
    inundacoes: /inunda/, 'servidao-militar': /militar/, 'implantacao-existente': /central e habitacional/ };
  return regras.filter(r => {
    if (r.usos && !r.usos.includes(uso)) return false;
    if (!r.lote) return /RGEU|DL 163|SCIE/.test(r.artigo);
    const re = NO_LOTE[r.id];
    return !!re && re.test(textoLote);
  });
}

export function agrupar(lista) {
  const g = new Map();
  lista.forEach(l => { if (!g.has(l.g)) g.set(l.g, []); g.get(l.g).push(l); });
  return [...g.entries()];
}
