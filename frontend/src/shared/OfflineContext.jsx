// ============================================================
// OfflineContext — React context for network & sync status
// Coordinates network events and synchronization triggers
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { offlineDB } from '../infrastructure/OfflineDB';
import { syncService } from '../infrastructure/SyncService';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncProgress, setSyncProgress] = useState({ message: '', progress: 0 });
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // Function to refresh queue count and last sync time from IndexedDB
  const refreshSyncMeta = async () => {
    try {
      // Initialize IndexedDB in case it's not initialized
      await offlineDB.init();
      
      const queue = await offlineDB.getSyncQueue();
      // Count items that are not failed
      setPendingCount(queue.length);

      const lastSyncDoc = await offlineDB.getById('meta', 'lastSyncTime');
      if (lastSyncDoc && lastSyncDoc.value) {
        setLastSyncTime(lastSyncDoc.value);
      }
    } catch (error) {
      console.error('Gagal memperbarui metadata offline:', error);
    }
  };

  useEffect(() => {
    refreshSyncMeta();

    const handleOnline = () => {
      setIsOnline(true);
      refreshSyncMeta();
      // Show click-to-sync toast only if there are pending items
      offlineDB.getSyncQueue().then(queue => {
        if (queue.length > 0) {
          setShowOnlineToast(true);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Occasional polling of metadata to sync with background writes
    const interval = setInterval(refreshSyncMeta, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  /**
   * Triggers full synchronization (Push then Pull).
   */
  const triggerSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    setShowOnlineToast(false);
    setSyncProgress({ message: 'Memulai sinkronisasi...', progress: 0 });

    try {
      await syncService.syncAll((prog) => {
        setSyncProgress(prog);
      });
      await refreshSyncMeta();
    } catch (error) {
      console.error('Sinkronisasi gagal:', error);
      setSyncProgress({ 
        message: `Sinkronisasi terhenti: ${error.message || 'Error tidak diketahui'}`, 
        progress: 0,
        isError: true
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Refreshes local cache from server (Pull only).
   */
  const triggerPull = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    setSyncProgress({ message: 'Mengunduh data terbaru...', progress: 0 });

    try {
      await syncService.pullFromServer((prog) => {
        setSyncProgress(prog);
      });
      await refreshSyncMeta();
    } catch (error) {
      console.error('Unduh data gagal:', error);
      setSyncProgress({ 
        message: `Unduh gagal: ${error.message}`, 
        progress: 0,
        isError: true
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Force push pending actions to server (Push only).
   */
  const triggerPush = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    setSyncProgress({ message: 'Mengunggah perubahan...', progress: 0 });

    try {
      await syncService.pushPending((prog) => {
        setSyncProgress(prog);
      });
      await refreshSyncMeta();
    } catch (error) {
      console.error('Unggah data gagal:', error);
      setSyncProgress({ 
        message: `Unggah gagal: ${error.message}`, 
        progress: 0,
        isError: true
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Clears the local cache database (conforming to confirmation request).
   */
  const clearCache = async () => {
    if (isSyncing) return;
    try {
      await offlineDB.clear('anggota');
      await offlineDB.clear('transaksi');
      await offlineDB.clear('rekapBulanan');
      await offlineDB.clear('saldo');
      await offlineDB.clear('meta'); // deletes lastSyncTime and config
      await refreshSyncMeta();
    } catch (error) {
      console.error('Gagal menghapus cache:', error);
    }
  };

  const value = {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncProgress,
    showOnlineToast,
    setShowOnlineToast,
    triggerSync,
    triggerPull,
    triggerPush,
    clearCache,
    refreshSyncMeta
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline harus digunakan di dalam OfflineProvider');
  }
  return context;
}
export default OfflineContext;
