// ============================================================
// OfflineIndicator — Visual indicator for offline/online status
// Premium aesthetics with micro-animations & glassmorphism
// ============================================================

import { WifiOff, Wifi, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useOffline } from '../../../shared/OfflineContext';
import { Button } from './index';

export default function OfflineIndicator() {
  const { 
    isOnline, 
    pendingCount, 
    isSyncing, 
    showOnlineToast, 
    setShowOnlineToast, 
    triggerSync 
  } = useOffline();

  if (isOnline && !showOnlineToast) return null;

  return (
    <div className="fixed top-4 right-4 z-49 flex flex-col gap-2 max-w-md w-full no-print">
      {/* 1. Offline Mode Banner */}
      {!isOnline && (
        <div 
          className="
            flex items-center gap-3 p-3.5 rounded-xl border
            bg-amber-950/70 border-amber-500/40 text-amber-300 backdrop-blur-md
            shadow-xl shadow-amber-950/20 animate-slide-in
          "
        >
          <div className="relative flex shrink-0">
            <WifiOff className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-tight uppercase tracking-wider text-amber-400">
              Mode Offline Aktif
            </p>
            <p className="text-[11px] text-amber-200/90 leading-normal mt-0.5 font-medium">
              Data disimpan secara lokal. {pendingCount > 0 ? `${pendingCount} perubahan dalam antrean.` : 'Tidak ada perubahan baru.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Connection Restored Toast (Online & Has Pending Items) */}
      {isOnline && showOnlineToast && pendingCount > 0 && (
        <div 
          className="
            flex items-center gap-3 p-4 rounded-xl border
            bg-emerald-950/70 border-emerald-500/40 text-emerald-300 backdrop-blur-md
            shadow-2xl shadow-emerald-950/20 animate-scale-in
          "
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-tight uppercase tracking-wider text-emerald-400">
              Koneksi Terdeteksi
            </p>
            <p className="text-[11px] text-emerald-200/90 leading-normal mt-0.5 font-medium">
              Terdapat {pendingCount} data dalam antrean. Sinkronkan sekarang?
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                size="sm" 
                variant="primary" 
                className="bg-emerald-600 hover:bg-emerald-500 text-[10px] py-1 px-2.5 font-bold uppercase tracking-wider"
                onClick={triggerSync}
                loading={isSyncing}
              >
                Sinkronkan
              </Button>
              <button 
                onClick={() => setShowOnlineToast(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 hover:text-emerald-100 px-2 py-1 transition-colors cursor-pointer"
              >
                Abaikan
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowOnlineToast(false)}
            className="text-emerald-500 hover:text-emerald-300 cursor-pointer p-0.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
