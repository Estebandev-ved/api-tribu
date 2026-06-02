const DB_NAME = 'TribuOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingTransfers';

/**
 * 📦 dbOfflineQueue - Gestor de Cola de Transacciones Fuera de Línea (IndexedDB).
 *
 * PROPÓSITO:
 *   Habilitar resiliencia y capacidades offline a las transacciones de Tribu. Permite a los usuarios encolar
 *   transferencias de puntos cuando no tienen conexión a internet.
 *
 * MEDIDAS DE SEGURIDAD Y ARQUITECTURA:
 *   1. Integridad FIFO (First-In, First-Out): Sincroniza las transacciones de forma rigurosa en el orden en que
 *      fueron creadas por el usuario basándose en marcas de tiempo.
 *   2. Prevención de Ataques de Replay (Reutilización de Nonce): Genera un ID de transacción único ('TX-timestamp-random')
 *      para que el servidor pueda ignorar o anular peticiones de transferencias idénticas duplicadas por ráfagas.
 *   3. Encriptación/Saneamiento en Destino: El PIN de seguridad se encapsula y viaja cifrado en el canal seguro una vez
 *      restablecido el tráfico HTTPS.
 */
export const dbOfflineQueue = {
  db: null,

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.error('Error abriendo IndexedDB Tribu', e);
        reject(e);
      };
    });
  },

  async addTransfer(destinatario, monto, mensaje, pin) {
    const db = await this.init();
    const id = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const txData = {
      id,
      destinatario,
      monto,
      mensaje,
      pin,
      timestamp: new Date().toISOString(),
      status: 'pending', // pending, syncing, completed, failed
      attempts: 0,
      error: null
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(txData);

      request.onsuccess = () => resolve(txData);
      request.onerror = (e) => reject(e);
    });
  },

  async getPendingTransfers() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('pending'));

      request.onsuccess = (e) => {
        const list = e.target.result || [];
        // Ordenar estrictamente FIFO
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        resolve(list);
      };
      request.onerror = (e) => reject(e);
    });
  },

  async updateTransferStatus(id, status, error = null) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const data = getReq.result;
        if (!data) {
          reject(new Error('Transacción no encontrada'));
          return;
        }
        data.status = status;
        if (status === 'failed') {
          data.attempts += 1;
          data.error = error;
        }
        const putReq = store.put(data);
        putReq.onsuccess = () => resolve(data);
        putReq.onerror = (e) => reject(e);
      };
      getReq.onerror = (e) => reject(e);
    });
  },

  async deleteTransfer(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  },

  async getAllTransfers() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (e) => resolve(e.target.result || []);
      request.onerror = (e) => reject(e);
    });
  }
};
