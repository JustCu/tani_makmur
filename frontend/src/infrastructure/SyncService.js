// ============================================================
// SyncService — Offline Queue Processing & Data Cache Refresh
// Coordinates upload push flow and download pull flow
// ============================================================

import { apiClient } from './api/ApiClient';
import { offlineDB } from './OfflineDB';

class SyncService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Pushes pending operations in the sync queue to the server.
   * Resolves temporary IDs and applies changes.
   * @param {Function} [onProgress] - Optional callback for progress updates
   */
  async pushPending(onProgress = () => {}) {
    const queue = await offlineDB.getSyncQueue();
    const pendingItems = queue.filter(item => item.status !== 'failed');

    if (pendingItems.length === 0) {
      onProgress({ message: 'Tidak ada data antrean baru untuk diunggah', progress: 100 });
      return;
    }

    onProgress({ message: `Mulai mengunggah ${pendingItems.length} data antrean...`, progress: 0 });

    // Mapping table: temporary ID (e.g. temp_A_123) -> server real ID (e.g. A0061)
    const tempIdMap = {};
    let completedCount = 0;

    for (const item of pendingItems) {
      item.status = 'syncing';
      await offlineDB.updateSyncItem(item);
      onProgress({ 
        message: `Memproses: ${this.getFriendlyActionName(item.action)} (${item.data.nama || item.data.id || ''})`, 
        progress: Math.round((completedCount / pendingItems.length) * 100) 
      });

      try {
        let responseData = null;

        // Process based on action
        switch (item.action) {
          case 'createAnggota': {
            const tempId = item.data.id;
            // Clean temp ID before sending to server
            const { id, ...dataToSend } = item.data;

            // Send to server
            responseData = await apiClient.post('createAnggota', dataToSend);

            if (responseData && responseData.id) {
              const realId = responseData.id;
              tempIdMap[tempId] = realId;

              // 1. Update local IndexedDB member store: delete temp, insert real
              await offlineDB.delete('anggota', tempId);
              await offlineDB.put('anggota', responseData);

              // 2. Update local IndexedDB saldo store: delete temp key, insert real
              const tempSaldo = await offlineDB.getById('saldo', tempId);
              if (tempSaldo) {
                await offlineDB.delete('saldo', tempId);
                await offlineDB.put('saldo', { ...tempSaldo, anggota_id: realId });
              }

              // 3. Update any offline transactions stored locally that reference this temp member
              const allLocalTx = await offlineDB.getAll('transaksi');
              for (const tx of allLocalTx) {
                if (tx.anggota_id === tempId) {
                  tx.anggota_id = realId;
                  await offlineDB.put('transaksi', tx);
                }
              }

              // 4. Update remaining queue items in memory that reference this temp member
              pendingItems.forEach(qi => {
                if (qi.action === 'createTransaksi' && qi.data.anggota_id === tempId) {
                  qi.data.anggota_id = realId;
                }
                if (qi.action === 'updateAnggota' && qi.data.id === tempId) {
                  qi.data.id = realId;
                }
                if (qi.action === 'deleteAnggota' && qi.data.id === tempId) {
                  qi.data.id = realId;
                }
              });
            }
            break;
          }

          case 'updateAnggota': {
            // Resolve ID if it was created offline and updated in memory map
            const targetId = tempIdMap[item.data.id] || item.data.id;
            const updatedData = { ...item.data, id: targetId };

            responseData = await apiClient.post('updateAnggota', updatedData);
            break;
          }

          case 'deleteAnggota': {
            const targetId = tempIdMap[item.data.id] || item.data.id;
            responseData = await apiClient.post('deleteAnggota', { id: targetId });
            break;
          }

          case 'createTransaksi': {
            const tempTxId = item.data.id;
            // Resolve member ID if it was created offline
            const resolvedAnggotaId = tempIdMap[item.data.anggota_id] || item.data.anggota_id;
            const { id, nama, ...dataToSend } = item.data;
            dataToSend.anggota_id = resolvedAnggotaId;

            responseData = await apiClient.post('createTransaksi', dataToSend);

            if (responseData && responseData.id) {
              // Update local transactions store: replace temp ID with real ID
              await offlineDB.delete('transaksi', tempTxId);
              // Ensure name is enriched locally as well
              await offlineDB.put('transaksi', {
                ...responseData,
                nama: nama || responseData.nama || 'Anggota'
              });
            }
            break;
          }

          case 'setConfig': {
            responseData = await apiClient.post('setConfig', item.data);
            break;
          }

          default:
            throw new Error(`Aksi tidak dikenal: ${item.action}`);
        }

        // Successfully synced! Remove from local queue
        await offlineDB.dequeueSync(item.id);
        completedCount++;

      } catch (error) {
        console.error(`Sync gagal untuk item queue #${item.id}:`, error);

        // Determine if it is a network failure or validation failure
        const isNetworkError = 
          error instanceof TypeError || 
          error.message.includes('Failed to fetch') || 
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          !navigator.onLine;

        if (isNetworkError) {
          // Keep item as pending and halt the sync queue process (network disconnected)
          item.status = 'pending';
          item.error = 'Koneksi jaringan terputus.';
          await offlineDB.updateSyncItem(item);
          throw new Error('Jaringan terputus selama sinkronisasi. Sinkronisasi dihentikan.');
        } else {
          // Business validation/server rule error (e.g. duplicate name, invalid status)
          // Keep item but mark as failed with error log, and CONTINUE loop so it doesn't block other elements
          item.status = 'failed';
          item.error = error.message || 'Server menolak permintaan.';
          await offlineDB.updateSyncItem(item);
          completedCount++;
        }
      }
    }

    onProgress({ message: 'Proses unggah selesai!', progress: 100 });
  }

  /**
   * Refreshes the local database cache by pulling all latest data from the server.
   * @param {Function} [onProgress]
   */
  async pullFromServer(onProgress = () => {}) {
    onProgress({ message: 'Menghubungkan ke server...', progress: 0 });

    try {
      // 1. Fetch Anggota Aktif
      onProgress({ message: 'Mengunduh data anggota...', progress: 15 });
      const anggotaList = await apiClient.get('getActiveAnggota');
      await offlineDB.clear('anggota');
      await offlineDB.bulkPut('anggota', anggotaList);

      // 2. Fetch Recent Transaksi
      onProgress({ message: 'Mengunduh data transaksi...', progress: 30 });
      const recentTx = await apiClient.get('getRecentTransaksi', { limit: 100 });
      await offlineDB.clear('transaksi');
      await offlineDB.bulkPut('transaksi', recentTx);

      // 3. Fetch Periodes
      onProgress({ message: 'Mengunduh data periode...', progress: 45 });
      const periodes = await apiClient.get('getPeriodes');
      await offlineDB.put('meta', { key: 'periodes', value: periodes });

      // 4. Fetch All Saldo (rekap saldo anggota)
      onProgress({ message: 'Mengunduh ringkasan saldo...', progress: 60 });
      const saldoList = await apiClient.get('getAllSaldo');
      await offlineDB.clear('saldo');
      await offlineDB.bulkPut('saldo', saldoList);

      // 5. Fetch Config
      onProgress({ message: 'Mengunduh konfigurasi...', progress: 75 });
      const config = await apiClient.get('getConfig');
      await offlineDB.put('meta', { key: 'config', value: config });

      // 6. Fetch Dashboard Stats
      onProgress({ message: 'Mengunduh statistik dashboard...', progress: 85 });
      const dashboard = await apiClient.get('getDashboard');
      await offlineDB.put('meta', { key: 'dashboard', value: dashboard });

      // 7. Fetch Monthly Trend
      onProgress({ message: 'Mengunduh tren bulanan...', progress: 95 });
      const monthlyTrend = await apiClient.get('getMonthlyTrend');
      await offlineDB.put('meta', { key: 'monthlyTrend', value: monthlyTrend });

      // Save last sync time
      const nowString = new Date().toISOString();
      await offlineDB.put('meta', { key: 'lastSyncTime', value: nowString });

      onProgress({ message: 'Data terbaru berhasil diunduh!', progress: 100 });
      return nowString;

    } catch (error) {
      console.error('Unduh data gagal:', error);
      throw new Error(`Gagal mengunduh data terbaru: ${error.message}`);
    }
  }

  /**
   * Performs full synchronization (Push pending, then Pull latest).
   * @param {Function} [onProgress]
   */
  async syncAll(onProgress = () => {}) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Upload local changes
      await this.pushPending(onProgress);

      // 2. Download server updates
      await this.pullFromServer(onProgress);

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Helper to translate action identifier to Indonesian.
   */
  getFriendlyActionName(action) {
    const names = {
      createAnggota: 'Tambah Anggota Baru',
      updateAnggota: 'Ubah Data Anggota',
      deleteAnggota: 'Nonaktifkan Anggota',
      createTransaksi: 'Catat Transaksi Baru',
      setConfig: 'Simpan Konfigurasi'
    };
    return names[action] || action;
  }
}

export const syncService = new SyncService();
export default syncService;
