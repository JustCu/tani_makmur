import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Wallet, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { StatCard, Card, Avatar, Badge, Button, Skeleton } from '../components/ui'
import { formatRupiah, formatDate, formatTipeTransaksi } from '../../shared/formatters'
import { TIPE_TRANSAKSI_COLORS } from '../../shared/constants'
import { fetchAnggotaDetail } from '../../infrastructure/DataProvider'

export default function DetailAnggotaPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const detail = await fetchAnggotaDetail(id)
        setData(detail)
      } catch (err) {
        console.error('Failed to load detail:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[120px]" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!data || !data.anggota) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-surface-400">Anggota tidak ditemukan</p>
        <Link to="/anggota" className="text-primary-400 hover:text-primary-300 mt-2 text-sm">
          ← Kembali ke daftar anggota
        </Link>
      </div>
    )
  }

  const { anggota, saldo, transaksi } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Link
          to="/anggota"
          className="w-10 h-10 rounded-lg bg-surface-900 dark:bg-surface-800 border border-surface-600 hover:bg-surface-700 dark:hover:bg-surface-700 flex items-center justify-center text-surface-300 hover:text-surface-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar name={anggota.nama} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-surface-50">{anggota.nama}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success">{anggota.status}</Badge>
              <span className="text-xs text-surface-500">{anggota.id}</span>
              {anggota.catatan && <span className="text-xs text-surface-400">· {anggota.catatan}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Wallet}
          label="Pokok Pinjaman"
          value={formatRupiah(saldo.pokok)}
          color="primary"
          delay={1}
        />
        <StatCard
          icon={TrendingUp}
          label="Bunga / Bulan"
          value={formatRupiah(saldo.bunga)}
          sub="3% dari pokok"
          color="accent"
          delay={2}
        />
        <StatCard
          icon={AlertTriangle}
          label="Total Kewajiban"
          value={formatRupiah(saldo.jumlah)}
          sub={saldo.hutang_bunga > 0 ? `Termasuk hutang bunga ${formatRupiah(saldo.hutang_bunga)}` : 'Tidak ada hutang bunga'}
          color={saldo.hutang_bunga > 0 ? 'danger' : 'info'}
          delay={3}
        />
      </div>

      {/* Transaction History */}
      <Card className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-surface-50">Riwayat Transaksi</h2>
            <p className="text-xs text-surface-500">{transaksi?.length || 0} transaksi tercatat</p>
          </div>
        </div>

        {transaksi && transaksi.length > 0 ? (
          <div className="space-y-2">
            {transaksi.map((tx, i) => (
              <div
                key={tx.id || i}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  tx.tipe === 'PINJAM' || tx.tipe === 'HUTANG_BUNGA'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${TIPE_TRANSAKSI_COLORS[tx.tipe] || 'text-surface-100'}`}>
                    {formatTipeTransaksi(tx.tipe)}
                  </p>
                  <p className="text-xs text-surface-500">
                    {formatDate(tx.tanggal)} {tx.keterangan ? `· ${tx.keterangan}` : ''} {tx.created_by ? `· Oleh: @${tx.created_by}` : ''}
                  </p>
                </div>
                <p className="text-sm font-bold text-surface-50">{formatRupiah(tx.jumlah)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-surface-500">Belum ada riwayat transaksi</p>
          </div>
        )}
      </Card>
    </div>
  )
}
