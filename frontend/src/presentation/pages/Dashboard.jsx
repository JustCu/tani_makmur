// ============================================================
// Dashboard — Koperasi Command Center for Administrators
// Premium glassmorphism layout, sync alert banner, collection tabs
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  FileText,
  ArrowLeftRight,
  CheckCircle2
} from 'lucide-react'
import { StatCard, Card, Badge, Avatar, Skeleton, Button } from '../components/ui'
import { formatRupiah, formatDate, formatTipeTransaksi, formatPeriode } from '../../shared/formatters'
import { TIPE_TRANSAKSI_COLORS } from '../../shared/constants'
import { fetchDashboard, fetchMonthlyTrend, fetchAllSaldo } from '../../infrastructure/DataProvider'
import { useOffline } from '../../shared/OfflineContext'

export default function Dashboard() {
  const { isOnline, pendingCount, lastSyncTime, triggerSync, isSyncing } = useOffline()

  const [data, setData] = useState(null)
  const [trend, setTrend] = useState([])
  const [allSaldo, setAllSaldo] = useState([])
  const [loading, setLoading] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState('arrears') // 'arrears' | 'borrowers'

  useEffect(() => {
    async function load() {
      try {
        const [dashData, trendData, saldoData] = await Promise.all([
          fetchDashboard(),
          fetchMonthlyTrend(),
          fetchAllSaldo(),
        ])
        setData(dashData)
        setTrend(trendData)
        setAllSaldo(saldoData)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pendingCount]) // Reload when pendingCount changes to keep dashboard fresh

  const { stats, recentTransaksi } = data || {
    stats: { total_anggota: 0, total_pinjaman: 0, total_bunga_bulan_ini: 0, total_hutang_bunga: 0 },
    recentTransaksi: []
  }

  // Calculate sorted items for collection panel
  const topArrears = useMemo(() => {
    return allSaldo
      .filter(s => s.hutang_bunga > 0)
      .sort((a, b) => b.hutang_bunga - a.hutang_bunga)
      .slice(0, 5)
  }, [allSaldo])

  const topBorrowers = useMemo(() => {
    return allSaldo
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5)
  }, [allSaldo])

  // Calculate max for chart scale
  const maxJumlah = Math.max(...trend.map(t => t.total_jumlah), 1)

  // Format Y-Axis Label
  const formatYLabel = (val) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)} M`
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)} jt`
    return val.toLocaleString('id-ID')
  }

  // Format X-Axis Label to Short Month-Year
  const getShortMonthYear = (periode) => {
    if (!periode) return ''
    const [year, month] = periode.split('-')
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
    const shortMonth = monthNamesShort[parseInt(month, 10) - 1] || ''
    return `${shortMonth} ${year.substring(2, 4)}`
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-surface-50">Pusat Kendali Pengurus</h1>
          <p className="text-sm text-surface-400 mt-1">Kelompok Tani Makmur — Ringkasan Eksekutif Keuangan</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick status indicator */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {!isOnline && pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-slide-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="leading-relaxed">
              <strong>Peringatan Offline:</strong> Terdapat {pendingCount} transaksi tertunda di browser lokal Anda. Data dashboard di bawah ini belum diperbarui dengan transaksi baru tersebut sampai Anda melakukan sinkronisasi dengan server utama.
            </p>
          </div>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500 text-primary-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-scale-in">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-5 h-5 text-primary-400 shrink-0 animate-spin" />
            <div>
              <p className="font-semibold text-primary-200">Data Offline Tersedia</p>
              <p className="mt-0.5 text-surface-400">Ada {pendingCount} perubahan tunda yang siap diunggah ke server utama Spreadsheet.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={triggerSync} 
            loading={isSyncing}
            icon={RefreshCw}
            className="w-full sm:w-auto font-bold uppercase tracking-wider text-[10px]"
          >
            Sinkronkan Sekarang
          </Button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Saldo Pokok"
          value={formatRupiah(stats.total_pinjaman)}
          sub="Outstanding pinjaman pokok"
          color="primary"
          delay={1}
        />
        <StatCard
          icon={TrendingUp}
          label="Bunga Bulan Ini"
          value={formatRupiah(stats.total_bunga_bulan_ini)}
          sub="Estimasi 3% bunga berjalan"
          color="accent"
          delay={2}
        />
        <StatCard
          icon={AlertTriangle}
          label="Tunggakan Bunga"
          value={formatRupiah(stats.total_hutang_bunga)}
          sub="Total akumulasi bunga belum dibayar"
          color="danger"
          delay={3}
        />
        <StatCard
          icon={Users}
          label="Anggota Aktif"
          value={stats.total_anggota}
          sub="Total anggota terdaftar"
          color="info"
          delay={4}
        />
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Trend Bar Chart */}
        <Card className="lg:col-span-2 animate-fade-in flex flex-col justify-between border border-surface-600">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-surface-50">Tren Kebutuhan Likuiditas</h2>
              <p className="text-xs text-surface-500">Kombinasi saldo pokok pinjaman dan akumulasi tunggakan bunga</p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-surface-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-primary-600 block shrink-0" />
                <span>Pokok</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 block shrink-0" />
                <span>Tunggakan</span>
              </div>
              <Badge variant="success" className="normal-case tracking-normal py-0.5">{trend.length} Bulan</Badge>
            </div>
          </div>

          {/* Stacked Bar Chart */}
          <div className="flex gap-4 h-[230px] mt-6 relative pl-12 pr-2">
            {/* Y-Axis Grid labels */}
            <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[9px] text-surface-400 font-bold text-right select-none leading-none">
              <span>{formatYLabel(maxJumlah)}</span>
              <span>{formatYLabel(maxJumlah * 0.75)}</span>
              <span>{formatYLabel(maxJumlah * 0.50)}</span>
              <span>{formatYLabel(maxJumlah * 0.25)}</span>
              <span>0 jt</span>
            </div>

            {/* Dash Gridlines */}
            <div className="absolute left-12 right-2 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-dashed border-surface-700" />
              <div className="w-full border-t border-dashed border-surface-700" />
              <div className="w-full border-t border-dashed border-surface-700" />
              <div className="w-full border-t border-dashed border-surface-700" />
              <div className="w-full border-t border-surface-600" />
            </div>

            {/* Bar columns */}
            <div className="flex-1 flex items-end gap-3.5 z-10 h-[calc(100%-24px)]">
              {trend.map((item, i) => {
                const totalVal = item.total_jumlah || 1;
                const height = (totalVal / maxJumlah) * 100;
                
                // Stack percentages
                const pokokPct = (Math.min(item.total_pokok, totalVal) / totalVal) * 100;
                const arrearsVal = Math.max(0, totalVal - item.total_pokok);
                const arrearsPct = (arrearsVal / totalVal) * 100;
                
                return (
                  <div key={item.periode} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative">
                    {/* Hover Floating Tooltip */}
                    <div className="absolute -top-24 scale-0 group-hover:scale-100 transition-all duration-205 bg-surface-900 border border-surface-650 text-[10px] p-2.5 rounded-lg shadow-2xl z-30 pointer-events-none whitespace-nowrap space-y-1 text-left backdrop-blur-sm">
                      <p className="font-bold text-surface-400 border-b border-surface-700 pb-1 uppercase tracking-wider text-[8px]">
                        {formatPeriode(item.periode)}
                      </p>
                      <p className="font-medium text-surface-200 flex justify-between gap-4">
                        <span>Pokok:</span>
                        <span className="font-bold">{formatRupiah(item.total_pokok)}</span>
                      </p>
                      {arrearsVal > 0 && (
                        <p className="font-medium text-amber-400 flex justify-between gap-4">
                          <span>Tunggakan:</span>
                          <span className="font-bold">{formatRupiah(arrearsVal)}</span>
                        </p>
                      )}
                      <p className="font-bold text-primary-400 border-t border-surface-700 pt-1 flex justify-between gap-4">
                        <span>Kewajiban:</span>
                        <span className="font-extrabold">{formatRupiah(item.total_jumlah)}</span>
                      </p>
                      <p className="text-[8px] text-surface-500 font-bold mt-1">Peminjam Aktif: {item.jumlah_anggota || 0} orang</p>
                    </div>

                    {/* Stacked Rounded Column */}
                    <div
                      className="w-full rounded-t-md hover:scale-x-[1.08] transition-all duration-200 cursor-pointer min-h-[8px] flex flex-col justify-end overflow-hidden border border-transparent hover:border-surface-500 shadow-md animate-fade-in"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 0.04}s`,
                      }}
                    >
                      {/* Arrears component (top, amber) */}
                      {arrearsVal > 0 && (
                        <div 
                          className="bg-amber-500 hover:bg-amber-400 transition-colors shrink-0"
                          style={{ height: `${arrearsPct}%` }}
                        />
                      )}
                      {/* Pokok component (bottom, blue) */}
                      <div 
                        className="bg-primary-600 hover:bg-primary-500 transition-colors flex-1"
                        style={{ height: `${pokokPct}%` }}
                      />
                    </div>

                    {/* X-Axis label */}
                    <span className="absolute -bottom-6 text-[10px] text-surface-500 font-bold whitespace-nowrap uppercase tracking-wider">
                      {getShortMonthYear(item.periode)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Collection & Risk Management (Arrears & Top Borrowers) */}
        <Card className="animate-fade-in border border-surface-600 flex flex-col">
          <div className="flex flex-col gap-3 mb-4">
            <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider">
              Pemantauan Anggota
            </h2>
            
            {/* Segmented control tabs */}
            <div className="grid grid-cols-2 bg-white dark:bg-surface-900 p-0.5 rounded-lg border border-surface-600">
              <button
                onClick={() => setRightPanelTab('arrears')}
                className={`py-1 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                  rightPanelTab === 'arrears' 
                    ? 'bg-primary-600 text-white shadow-xs' 
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                Tunggakan Bunga
              </button>
              <button
                onClick={() => setRightPanelTab('borrowers')}
                className={`py-1 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                  rightPanelTab === 'borrowers' 
                    ? 'bg-primary-600 text-white shadow-xs' 
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                Peminjam Terbesar
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[220px] pr-1">
            {rightPanelTab === 'arrears' ? (
              topArrears.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-surface-100">Koleksi Sempurna</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">Tidak ada tunggakan bunga saat ini.</p>
                </div>
              ) : (
                topArrears.map((item, i) => (
                  <Link
                    key={item.anggota_id || i}
                    to={`/anggota/${item.anggota_id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-700 transition-all border border-transparent hover:border-surface-700 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={item.nama} size="sm" className="w-8.5 h-8.5 text-[10px]" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-350 transition-colors">
                          {item.nama}
                        </p>
                        <p className="text-[9px] text-surface-500 font-bold mt-0.5">{item.anggota_id}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-amber-500">
                        {formatRupiah(item.hutang_bunga)}
                      </p>
                      <p className="text-[9px] text-surface-500 font-semibold mt-0.5">Tunggakan</p>
                    </div>
                  </Link>
                ))
              )
            ) : (
              topBorrowers.map((item, i) => (
                <Link
                  key={item.anggota_id || i}
                  to={`/anggota/${item.anggota_id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-700 transition-all border border-transparent hover:border-surface-700 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={item.nama} size="sm" className="w-8.5 h-8.5 text-[10px]" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-350 transition-colors">
                        {item.nama}
                      </p>
                      <p className="text-[9px] text-surface-500 font-bold mt-0.5">{item.anggota_id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-primary-600 dark:text-primary-400">
                      {formatRupiah(item.jumlah)}
                    </p>
                    <p className="text-[9px] text-surface-500 font-semibold mt-0.5">Pokok: {formatRupiah(item.pokok)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Redesigned Mini Recent Transactions */}
        <Card className="lg:col-span-2 animate-fade-in border border-surface-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider">Aktivitas Transaksi Terbaru</h2>
              <p className="text-xs text-surface-500">5 transaksi terakhir yang dicatat ke sistem</p>
            </div>
            <Link 
              to="/transaksi" 
              className="text-xs text-primary-500 hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors font-bold uppercase tracking-wider text-[10px]"
            >
              Riwayat Lengkap <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-700 text-surface-500 uppercase text-[9px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">Anggota</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Tanggal</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {recentTransaksi?.slice(0, 5).map((tx, i) => {
                  const isAdd = tx.tipe === 'PINJAM' || tx.tipe === 'HUTANG_BUNGA';
                  return (
                    <tr 
                      key={tx.id || i} 
                      className="border-b border-surface-800 hover:bg-surface-850/40 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={tx.nama} size="sm" className="w-6.5 h-6.5 text-[9px]" />
                          <span className="text-surface-100 font-semibold truncate max-w-[130px]" title={tx.nama}>
                            {tx.nama}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={
                          tx.tipe === 'PINJAM' ? 'danger' :
                          tx.tipe.startsWith('BAYAR') ? 'success' : 'warning'
                        }>
                          {formatTipeTransaksi(tx.tipe)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right text-surface-400 font-medium">
                        {formatDate(tx.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-bold ${isAdd ? 'text-red-400' : 'text-green-400'}`}>
                          {isAdd ? '+' : '-'}{formatRupiah(tx.jumlah)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Administration Shortcuts */}
        <Card className="animate-fade-in border border-surface-600 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider">
              Status Sinkronisasi & Aksi
            </h2>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-900 border border-surface-700 text-xs">
                <span className="text-surface-400 font-medium">Status Database</span>
                <Badge variant={isOnline ? 'success' : 'warning'}>
                  {isOnline ? 'Terhubung (Online)' : 'Database Lokal (Offline)'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-900 border border-surface-700 text-xs">
                <span className="text-surface-400 font-medium">Antrean Tunda</span>
                <Badge variant={pendingCount > 0 ? 'warning' : 'default'}>
                  {pendingCount} baris
                </Badge>
              </div>
 
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-900 border border-surface-700 text-xs font-medium text-surface-200">
                <span className="text-surface-400">Sinkron Terakhir</span>
                <span>
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-700 space-y-2">
            <Link to="/sync" className="block w-full">
              <Button icon={RefreshCw} variant="secondary" className="w-full justify-start text-xs py-2">
                Buka Panel Sinkronisasi
              </Button>
            </Link>
            <Link to="/laporan" className="block w-full">
              <Button icon={FileText} variant="secondary" className="w-full justify-start text-xs py-2">
                Cetak Rekap Bulanan
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  )
}
