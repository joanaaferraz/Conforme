// Projetos cifrados com senha (o plugin cifra no PC, a app decifra no telemóvel).
// PBKDF2-SHA256 → chave AES-GCM de 256 bits. O sal é fixo por projeto, por isso a chave derivada
// pode ficar guardada no telemóvel (não exportável) e a senha só é pedida uma vez.
// O plugin (ui/telemovel.js) usa exactamente o mesmo envelope — ver schema/conforme-cifrado.md.

export const ENVELOPE = 'conforme-cifrado';

const b64 = {
  de: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)),
  para: u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); },
};

export class SenhaErrada extends Error {}

export function eEnvelope(j) { return !!j && j.formato === ENVELOPE && j.versao === 1; }

/** Deriva a chave a partir da senha e do sal do envelope. */
export async function chaveDe(senha, env) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64.de(env.sal), iterations: env.iteracoes },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

/** Decifra o envelope e devolve o texto JSON do projeto. */
export async function decifrar(env, chave) {
  try {
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.de(env.iv) }, chave, b64.de(env.dados));
    return new TextDecoder().decode(claro);
  } catch { throw new SenhaErrada('Senha errada (ou o ficheiro foi alterado).'); }
}

/** Cifra (usado nos testes; o plugin tem a mesma função). */
export async function cifrar(texto, senha, sal, iteracoes = 310000) {
  const env = { formato: ENVELOPE, versao: 1, kdf: 'PBKDF2-SHA256', iteracoes, sal: b64.para(sal), iv: '' };
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  const chave = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  env.iv = b64.para(iv);
  env.dados = b64.para(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, new TextEncoder().encode(texto)));
  return env;
}
