const DB_NAME = "ninjago-adventure";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, mode);
        const request = work(transaction.objectStore(PHOTO_STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  await runTransaction("readwrite", (store) => store.put({ id, blob, savedAt: Date.now() }));
}

export async function getPhoto(id: string): Promise<Blob | null> {
  const record = await runTransaction<{ id: string; blob: Blob } | undefined>(
    "readonly",
    (store) => store.get(id),
  );
  return record?.blob ?? null;
}

export async function deletePhoto(id: string): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(id));
}

export async function listPhotoIds(): Promise<string[]> {
  const keys = await runTransaction<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
  return keys.map(String);
}
