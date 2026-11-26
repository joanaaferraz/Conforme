// Projetos que o plugin envia cifrados para o GitHub (ramo «dados»). Sem interface.
import { REMOTO } from '../config.js';
import { eEnvelope, chaveDe, decifrar } from './cifra.js';

export const codigoValido = c => /^[a-z0-9]{16,40}$/.test(String(c || ''));

/** Código do projeto a partir do que o QR Code tem (endereço com #p=… ou só o código). */
export function codigoDe(texto) {
  const s = String(texto || '').trim();
  const m = s.match(/[#&?]p=([a-z0-9]+)/i);
  const c = (m ? m[1] : s).toLowerCase();
  return codigoValido(c) ? c : null;
}

/**
 * Vai buscar o envelope cifrado. Com etag, devolve null se não mudou (304 — não gasta o limite de pedidos do GitHub).
 * Devolve { env, etag } ou null. Lança Error com .estado = 404 se o projeto não existe.
 */
export async function buscar(codigo, etag) {
  let r;
  try {
    r = await fetch(`${REMOTO.api}/${codigo}.json?ref=${REMOTO.ramo}`, {
      cache: 'no-store', headers: { Accept: 'application/vnd.github.raw+json', ...(etag ? { 'If-None-Match': etag } : {}) },
    });
  } catch { r = null; }
  if (r && r.status === 304) return null;
  if (r && r.ok) return { env: await r.json(), etag: r.headers.get('ETag') || '' };
  if (r && r.status === 404) { const e = new Error('Projeto não encontrado. Envia-o primeiro a partir do Revit.'); e.estado = 404; throw e; }
  // limite de pedidos da API ou sem resposta: tenta a cópia «raw» (pode ter até 5 minutos de atraso)
  const r2 = await fetch(`${REMOTO.raw}/${codigo}.json?t=${Date.now()}`, { cache: 'no-store' });
  if (r2.status === 404) { const e = new Error('Projeto não encontrado.'); e.estado = 404; throw e; }
  if (!r2.ok) throw new Error(`GitHub respondeu ${r2.status}`);
  return { env: await r2.json(), etag: etag || '' };
}

/** Abre um envelope: com a chave guardada, ou com a senha (e então devolve a chave nova para guardar). */
export async function abrir(env, { chave, senha }) {
  if (!eEnvelope(env)) throw new Error('O ficheiro no GitHub não é um projeto cifrado do Conforme.');
  if (!chave || (chave.sal && chave.sal !== env.sal)) {
    if (!senha) { const e = new Error('Precisa da senha'); e.senha = true; throw e; }
    chave = { sal: env.sal, chave: await chaveDe(senha, env) };
  }
  return { texto: await decifrar(env, chave.chave), chave };
}
