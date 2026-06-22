// ============================================================
// OfflineDB — IndexedDB Wrapper for Local Storage & Sync Queue
// Implements client-side database caching for offline capability
// ============================================================

const DB_NAME = 'TaniMakmurOfflineDB';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initializes the IndexedDB database.
   * Creates object stores and indexes if they do not exist.
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Gagal membuka IndexedDB:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Store for Members (Anggota)
        if (!db.objectStoreNames.contains('anggota')) {
          db.createObjectStore('anggota', { keyPath: 'id' });
        }

        // 2. Store for Transactions (Transaksi)
        if (!db.objectStoreNames.contains('transaksi')) {
          db.createObjectStore('transaksi', { keyPath: 'id' });
        }

        // 3. Store for Monthly Recap (Rekap Bulanan)
        if (!db.objectStoreNames.contains('rekapBulanan')) {
          db.createObjectStore('rekapBulanan', { keyPath: 'periode' });
        }

        // 4. Store for Balances (Saldo Anggota)
        if (!db.objectStoreNames.contains('saldo')) {
          db.createObjectStore('saldo', { keyPath: 'anggota_id' });
        }

        // 5. Store for offline changes pending upload (Sync Queue)
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }

        // 6. Store for single-entry objects / metadata (config, periodes, dashboard, lastSyncTime)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Helper to open a transaction and access a store.
   * @param {string} storeName - Name of the store
   * @param {string} mode - 'readonly' or 'readwrite'
   * @returns {Promise<IDBObjectStore>}
   */
  async getStore(storeName, mode = 'readonly') {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Gets all objects from a store.
   * @param {string} storeName
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets a single object by key.
   * @param {string} storeName
   * @param {any} key
   * @returns {Promise<any|null>}
   */
  async getById(storeName, key) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adds or updates an object in a store.
   * @param {string} storeName
   * @param {any} value
   * @returns {Promise<any>}
   */
  async put(storeName, value) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Performs a bulk update/insert in a single transaction.
   * @param {string} storeName
   * @param {Array} values
   * @returns {Promise<void>}
   */
  async bulkPut(storeName, values) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      values.forEach((value) => {
        store.put(value);
      });
    });
  }

  /**
   * Deletes an object by key.
   * @param {string} storeName
   * @param {any} key
   * @returns {Promise<boolean>}
   */
  async delete(storeName, key) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all records from a store.
   * @param {string} storeName
   * @returns {Promise<boolean>}
   */
  async clear(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================
  // Sync Queue Methods
  // ============================================================

  /**
   * Pushes a new operation into the sync queue.
   * @param {string} action - 'createAnggota', 'updateAnggota', 'deleteAnggota', 'createTransaksi', 'setConfig'
   * @param {Object} data - Payload data for the action
   * @returns {Promise<number>} - Generated item ID
   */
  async enqueueSync(action, data) {
    const queueItem = {
      action,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending', // 'pending' | 'syncing' | 'failed'
      error: null
    };
    return this.put('syncQueue', queueItem);
  }

  /**
   * Updates status or error of a sync queue item.
   * @param {Object} item - Full item including ID
   * @returns {Promise<number>}
   */
  async updateSyncItem(item) {
    return this.put('syncQueue', item);
  }

  /**
   * Gets all elements in the sync queue.
   * @returns {Promise<Array>}
   */
  async getSyncQueue() {
    return this.getAll('syncQueue');
  }

  /**
   * Deletes an element from the sync queue after successful sync.
   * @param {number} id - Sync queue item ID
   * @returns {Promise<boolean>}
   */
  async dequeueSync(id) {
    return this.delete('syncQueue', id);
  }

  /**
   * Clears the entire sync queue.
   * @returns {Promise<boolean>}
   */
  async clearSyncQueue() {
    return this.clear('syncQueue');
  }
}

export const offlineDB = new OfflineDB();
export default offlineDB;
