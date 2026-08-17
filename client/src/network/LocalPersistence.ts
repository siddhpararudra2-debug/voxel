/** Orbital Field Manual reminder: local simulation preserves a small, recoverable field record without misrepresenting it as server authority. */
export type StandaloneSession = { roomId: string; username: string; updatedAt: number; lastMode: "MOCK" | "LOCAL" };

const DATABASE = "nebula-bound-field-record";
const STORE = "sessions";
const KEY = "active-session";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStandaloneSession(): Promise<StandaloneSession | null> {
  if (typeof indexedDB === "undefined") return null;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    request.onsuccess = () => { resolve((request.result as StandaloneSession | undefined) ?? null); database.close(); };
    request.onerror = () => { reject(request.error); database.close(); };
  });
}

export async function saveStandaloneSession(session: StandaloneSession) {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(session, KEY);
    request.onsuccess = () => { resolve(); database.close(); };
    request.onerror = () => { reject(request.error); database.close(); };
  });
}
