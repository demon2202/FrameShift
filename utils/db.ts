export const DB_CONFIG = {
  NAME: 'PosterVerseDB',
  VERSION: 1,
  STORES: {
    IMAGES: 'images'
  }
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.IMAGES)) {
        db.createObjectStore(DB_CONFIG.STORES.IMAGES);
      }
    };
  });
};

export const saveImageToDB = async (id: string, base64: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_CONFIG.STORES.IMAGES, 'readwrite');
    const store = transaction.objectStore(DB_CONFIG.STORES.IMAGES);
    const request = store.put(base64, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImageFromDB = async (id: string): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_CONFIG.STORES.IMAGES, 'readonly');
    const store = transaction.objectStore(DB_CONFIG.STORES.IMAGES);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as string || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_CONFIG.STORES.IMAGES, 'readwrite');
    const store = transaction.objectStore(DB_CONFIG.STORES.IMAGES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
