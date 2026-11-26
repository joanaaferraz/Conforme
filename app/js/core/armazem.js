// Projetos guardados no telemóvel (IndexedDB), para a app funcionar sem rede.
// Se o IndexedDB não estiver disponível (janela privada), guarda só em memória.
const BD = 'conforme', LOJA = 'projetos';
let memoria = new Map();

function abrir() {
  return new Promise((ok, erro) => {
    if (!('indexedDB' in self)) return erro(new Error('sem IndexedDB'));
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA, { keyPath: 'id' });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
}
async function tx(modo, fn) {
  try {
    const db = await abrir();
    return await new Promise((ok, erro) => {
      const t = db.transaction(LOJA, modo); const s = t.objectStore(LOJA); const r = fn(s);
      t.oncomplete = () => ok(r && 'result' in r ? r.result : undefined); t.onerror = () => erro(t.error);
    });
  } catch { return null; }
}

export async function listar() {
  const r = await tx('readonly', s => s.getAll());
  const l = r || [...memoria.values()];
  return l.sort((a, b) => String(b.exportado).localeCompare(String(a.exportado)));
}
export async function guardar(p) {
  memoria.set(p.id, p);
  await tx('readwrite', s => s.put({ ...p, guardadoEm: new Date().toISOString() }));
}
export async function apagar(id) {
  memoria.delete(id);
  await tx('readwrite', s => s.delete(id));
}
