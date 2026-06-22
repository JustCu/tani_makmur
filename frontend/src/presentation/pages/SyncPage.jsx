// ============================================================
// SyncPage — Dashboard for Offline Synchronization
// Modern glassmorphism layout, sync progress, cache statistics
// ============================================================

import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Clock, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertCircle, 
  Trash,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { useOffline } from '../../shared/OfflineContext';
import { offlineDB } from '../../infrastructure/OfflineDB';
import { Card, Button, Badge, Modal, EmptyState } from '../components/ui';
import { formatRupiah, formatDate } from '../../shared/formatters';

export default function SyncPage() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncProgress,
    triggerSync,
    triggerPull,
    triggerPush,
    clearCache,
    refreshSyncMeta
  } = useOffline();

  const [queue, setQueue] = useState([]);
  const [dbStats, setDbStats] = useState({ anggotaCount: 0, transaksiCount: 0, rekapCount: 0, saldoCount: 0 });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Load sync queue and database stats
  const loadData = async () => {
    try {
      const q = await offlineDB.getSyncQueue();
      setQueue(q);

      const anggota = await offlineDB.getAll('anggota');
      const transaksi = await offlineDB.getAll('transaksi');
      const rekap = await offlineDB.getAll('rekapBulanan');
      const saldo = await offlineDB.getAll('saldo');

      setDbStats({
        anggotaCount: anggota.length,
        transaksiCount: transaksi.length,
        rekapCount: rekap.length,
        saldoCount: saldo.length
      });
    } catch (error) {
      console.error('Gagal memuat statistik database lokal:', error);
    }
  };

  useEffect(() => {
    loadData();
    // Reload queue and stats whenever sync states or pending counts change
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [pendingCount, isSyncing]);

  const handleSyncAll = async () => {
    setSyncError(null);
    try {
      await triggerSync();
      await loadData();
    } catch (err) {
      setSyncError(err.message || 'Sinkronisasi gagal.');
    }
  };

  const handlePullOnly = async () => {
    setSyncError(null);
    try {
      await triggerPull();
      await loadData();
    } catch (err) {
      setSyncError(err.message || 'Gagal mengunduh data.');
    }
  };

  const handlePushOnly = async () => {
    setSyncError(null);
    try {
      await triggerPush();
      await loadData();
    } catch (err) {
      setSyncError(err.message || 'Gagal mengunggah perubahan.');
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    await loadData();
    setShowConfirmDelete(false);
  };

  const handleDiscardItem = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan perubahan tunda ini?')) {
      await offlineDB.dequeueSync(id);
      await refreshSyncMeta();
      await loadData();
    }
  };

  // Formatting utilities for SyncPage
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${formatDate(d)} ${time}`;
  };

  const getFriendlyAction = (action) => {
    const actions = {
      createAnggota: 'Tambah Anggota',
      updateAnggota: 'Ubah Anggota',
      deleteAnggota: 'Hapus Anggota',
      createTransaksi: 'Catat Transaksi',
      setConfig: 'Simpan Pengaturan'
    };
    return actions[action] || action;
  };

  const getQueueItemDetail = (item) => {
    if (item.action === 'createTransaksi') {
      const typeLabel = {
        PINJAM: 'Pinjam',
        BAYAR_POKOK: 'Bayar Pokok',
        BAYAR_BUNGA: 'Bayar Bunga',
        HUTANG_BUNGA: 'Hutang Bunga',
        BAYAR_HUTANG_BUNGA: 'Bayar Hutang Bunga'
      }[item.data.tipe] || item.data.tipe;

      return `${item.data.nama || 'Anggota'} - ${typeLabel} (${formatRupiah(item.data.jumlah)})`;
    }
    if (item.action === 'createAnggota' || item.action === 'updateAnggota') {
      return item.data.nama || `ID: ${item.data.id}`;
    }
    if (item.action === 'setConfig') {
      return `${item.data.key}: ${item.data.value}`;
    }
    return JSON.stringify(item.data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-surface-50">Sinkronisasi Data</h1>
        <p className="text-sm text-surface-400 mt-1">
          Kelola penyimpanan offline lokal dan sinkronisasikan data Anda dengan server utama secara aman.
        </p>
      </div>

      {/* Connection & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Koneksi */}
        <Card className="flex items-center gap-4 border border-surface-600">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
            ${isOnline 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }
          `}>
            {isOnline ? (
              <div className="relative flex">
                <Wifi className="w-6 h-6" />
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            ) : (
              <div className="relative flex">
                <WifiOff className="w-6 h-6" />
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              </div>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block mb-0.5">
              Koneksi Jaringan
            </span>
            <p className="text-lg font-extrabold text-surface-50 leading-none">
              {isOnline ? 'Terhubung (Online)' : 'Terputus (Offline)'}
            </p>
            <span className="text-xs text-surface-500 mt-1 block leading-normal">
              {isOnline ? 'Aplikasi siap sinkronisasi.' : 'Bekerja dengan database lokal.'}
            </span>
          </div>
        </Card>

        {/* Antrean Offline */}
        <Card className="flex items-center gap-4 border border-surface-600">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
            ${pendingCount > 0 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse' 
              : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
            }
          `}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block mb-0.5">
              Perubahan Tertunda
            </span>
            <p className="text-lg font-extrabold text-surface-50 leading-none">
              {pendingCount} Baris Data
            </p>
            <span className="text-xs text-surface-500 mt-1 block leading-normal">
              {pendingCount > 0 ? 'Perlu diunggah ke server.' : 'Semua data lokal sinkron.'}
            </span>
          </div>
        </Card>

        {/* Sinkronisasi Terakhir */}
        <Card className="flex items-center gap-4 border border-surface-600">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block mb-0.5">
              Pembaruan Terakhir
            </span>
            <p className="text-lg font-extrabold text-surface-50 leading-none truncate max-w-[200px]">
              {lastSyncTime ? formatDateTime(lastSyncTime) : 'Belum pernah'}
            </p>
            <span className="text-xs text-surface-500 mt-1 block leading-normal">
              Waktu terakhir data diunduh.
            </span>
          </div>
        </Card>
      </div>

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Controls Panel */}
        <Card className="lg:col-span-1 border border-surface-600 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-surface-300 uppercase tracking-wider">
              Kontrol Sinkronisasi
            </h2>
            <p className="text-xs text-surface-400 leading-relaxed">
              Jalankan sinkronisasi dua arah untuk mengunggah perubahan lokal Anda dan mengunduh pembaruan terbaru dari database server.
            </p>

            <div className="space-y-2 pt-2">
              <Button 
                variant="primary" 
                className="w-full justify-center" 
                onClick={handleSyncAll}
                loading={isSyncing}
                disabled={!isOnline}
                icon={RefreshCw}
              >
                Sinkronisasi Penuh
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handlePullOnly}
                  loading={isSyncing}
                  disabled={!isOnline}
                  icon={ArrowDown}
                  className="text-xs py-2 px-3"
                >
                  Unduh (Pull)
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handlePushOnly}
                  loading={isSyncing}
                  disabled={!isOnline || pendingCount === 0}
                  icon={ArrowUp}
                  className="text-xs py-2 px-3"
                >
                  Unggah (Push)
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-600 mt-6 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400 flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-surface-500" />
                Cache Anggota
              </span>
              <span className="font-bold text-surface-200">{dbStats.anggotaCount} baris</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400 flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-surface-500" />
                Cache Transaksi
              </span>
              <span className="font-bold text-surface-200">{dbStats.transaksiCount} baris</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400 flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-surface-500" />
                Cache Rekap Bulanan
              </span>
              <span className="font-bold text-surface-200">{dbStats.rekapCount} baris</span>
            </div>
            
            <Button
              variant="danger"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isSyncing}
              icon={Trash2}
              className="w-full text-xs mt-2 py-2"
            >
              Hapus Cache Lokal
            </Button>
          </div>
        </Card>

        {/* Sync Progress & Queue Details */}
        <Card className="lg:col-span-2 border border-surface-600 flex flex-col">
          <h2 className="text-sm font-bold text-surface-300 uppercase tracking-wider mb-4">
            Aktivitas & Status Sinkronisasi
          </h2>

          {/* Sync Progress Indicator */}
          {isSyncing ? (
            <div className="p-4 rounded-xl bg-surface-900 border border-surface-600 space-y-3 mb-6 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-primary-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {syncProgress.message || 'Memproses sinkronisasi data...'}
                </span>
                <span className="text-surface-300">{syncProgress.progress}%</span>
              </div>
              <div className="w-full bg-surface-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress.progress}%` }}
                />
              </div>
            </div>
          ) : syncError ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-3 text-xs mb-6">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold uppercase tracking-wider text-red-400 text-[10px]">Kesalahan Sinkronisasi</p>
                <p className="mt-1 leading-relaxed">{syncError}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-900 border border-surface-600 flex items-center gap-3 text-xs text-surface-400 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Sistem siap. Tidak ada proses sinkronisasi aktif di latar belakang.</span>
            </div>
          )}

          {/* Table of pending queue */}
          <div className="flex-1 flex flex-col min-h-[250px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-2">
              Antrean Perubahan Tertunda
              {queue.length > 0 && <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-extrabold">{queue.length}</span>}
            </h3>

            <div className="flex-1 overflow-x-auto">
              {queue.length === 0 ? (
                <EmptyState 
                  icon={CheckCircle2}
                  title="Antrean Bersih"
                  description="Semua data lokal telah disinkronkan ke server utama."
                />
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-700 text-surface-400 uppercase text-[9px] font-bold tracking-wider">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Aksi</th>
                      <th className="py-2 px-3">Detail</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item) => (
                      <tr key={item.id} className="border-b border-surface-800 hover:bg-surface-700 transition-colors">
                        <td className="py-2.5 px-3 text-surface-300 whitespace-nowrap">
                          {formatDateTime(item.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-surface-200">
                          {getFriendlyAction(item.action)}
                        </td>
                        <td className="py-2.5 px-3 text-surface-400 max-w-[200px] truncate" title={getQueueItemDetail(item)}>
                          {getQueueItemDetail(item)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.status === 'failed' && (
                            <Badge variant="danger" className="cursor-help" title={item.error}>
                              Gagal
                            </Badge>
                          )}
                          {item.status === 'pending' && (
                            <Badge variant="warning">
                              Menunggu
                            </Badge>
                          )}
                          {item.status === 'syncing' && (
                            <Badge variant="info" className="flex items-center gap-1.5 justify-center">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              Mengunggah
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDiscardItem(item.id)}
                            className="p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Batalkan perubahan"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal for Clearing Cache */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Konfirmasi Hapus Cache"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Tindakan Berisiko Tinggi</p>
              <p className="mt-1 leading-relaxed">
                Tindakan ini akan menghapus semua salinan data Anggota, Transaksi, dan Laporan yang disimpan secara lokal di browser ini.
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <p className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg leading-relaxed">
              Peringatan: Terdapat {pendingCount} baris perubahan dalam antrean yang belum diunggah. Menghapus cache sekarang akan menghapus data tersebut secara permanen dari browser ini!
            </p>
          )}

          <p className="text-xs text-surface-300 leading-relaxed">
            Data yang telah disinkronkan ke Google Spreadsheet aman dan tidak akan terpengaruh. Anda harus mengunduh ulang data dari server setelah ini untuk memulihkan cache lokal.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleClearCache} icon={Trash2}>
              Hapus Cache Lokal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
