import { useState, useEffect, useMemo } from 'react'
import { Plus, ArrowLeftRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { Card, Button, Input, SearchablePicker, Modal, Avatar, Badge, Skeleton, EmptyState } from '../components/ui'
import { formatRupiah, formatDate, formatTipeTransaksi } from '../../shared/formatters'
import { TIPE_TRANSAKSI, TIPE_TRANSAKSI_LABELS, TIPE_TRANSAKSI_COLORS } from '../../shared/constants'
import { fetchAnggota, fetchRecentTransaksi, createTransaksi } from '../../infrastructure/DataProvider'
import { useAuth } from '../../shared/AuthContext'

export default function TransaksiPage() {
  const { user } = useAuth()
  const [anggotaList, setAnggotaList] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Pagination & Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipe, setFilterTipe] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formData, setFormData] = useState({
    anggota_id: '',
    tipe: TIPE_TRANSAKSI.PINJAM,
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [anggota, txList] = await Promise.all([
        fetchAnggota(),
        fetchRecentTransaksi(500),
      ])
      setAnggotaList(anggota)
      setTransactions(txList)
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterTipeChange = (e) => {
    setFilterTipe(e.target.value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Filter transactions in memory
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        !searchQuery || 
        tx.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.anggota_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.keterangan && tx.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchTipe = !filterTipe || tx.tipe === filterTipe;

      return matchSearch && matchTipe;
    })
  }, [transactions, searchQuery, filterTipe])

  // Pagination calculations
  const totalItems = filteredTransactions.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, startIndex, endIndex])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.anggota_id || !formData.jumlah) return
    setSaving(true)
    try {
      await createTransaksi({
        ...formData,
        jumlah: parseFloat(formData.jumlah),
        created_by: user?.username || 'system',
      })
      setShowForm(false)
      setFormData({
        anggota_id: '',
        tipe: TIPE_TRANSAKSI.PINJAM,
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
      })
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tipeOptions = Object.entries(TIPE_TRANSAKSI_LABELS).map(([value, label]) => ({
    value, label,
  }))

  const anggotaOptions = anggotaList.map(a => ({ value: a.id, label: `${a.nama} (${a.id})` }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Transaksi</h1>
          <p className="text-sm text-surface-400 mt-1">Catat dan lihat riwayat transaksi</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>
          Catat Transaksi
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in no-print">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama anggota, ID, atau keterangan..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2 rounded-lg text-sm bg-white dark:bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Tipe Filter */}
        <select
          value={filterTipe}
          onChange={handleFilterTipeChange}
          className="w-full sm:w-56 px-3 py-2 rounded-lg text-sm bg-white dark:bg-surface-800 border border-surface-600 text-surface-150 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer transition-all"
        >
          <option value="">Semua Tipe Transaksi</option>
          {tipeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction List Card */}
      <Card className="animate-fade-in overflow-hidden">
        <h2 className="text-sm font-bold text-surface-50 mb-4">Riwayat Transaksi</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Tidak ada transaksi"
            description={searchQuery || filterTipe ? 'Coba ubah filter pencarian Anda' : 'Mulai dengan mencatat transaksi pertama'}
          />
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-700 text-surface-400 uppercase text-[9px] font-bold tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Anggota</th>
                    <th className="py-3 px-4">Tipe Transaksi</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4">Pencatat</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx, i) => {
                    const isAdd = tx.tipe === 'PINJAM' || tx.tipe === 'HUTANG_BUNGA';
                    return (
                      <tr 
                        key={tx.id || i} 
                        className="border-b border-surface-800 hover:bg-surface-800/20 transition-all duration-150"
                      >
                        <td className="py-3.5 px-4 text-surface-300 whitespace-nowrap">
                          {formatDate(tx.tanggal)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={tx.nama} size="sm" className="w-7.5 h-7.5 text-[10px]" />
                            <div className="min-w-0">
                              <p className="font-semibold text-surface-50 truncate max-w-[150px]">{tx.nama}</p>
                              <p className="text-[9px] text-surface-500 font-bold tracking-wider mt-0.5">{tx.anggota_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={
                            tx.tipe === 'PINJAM' ? 'danger' :
                            tx.tipe.startsWith('BAYAR') ? 'success' : 'warning'
                          }>
                            {formatTipeTransaksi(tx.tipe)}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-surface-400 max-w-[180px] truncate" title={tx.keterangan}>
                          {tx.keterangan || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-surface-500 font-medium">
                          {tx.created_by ? `@${tx.created_by}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-bold text-sm ${isAdd ? 'text-red-400' : 'text-green-400'}`}>
                            {isAdd ? '+' : '-'}{formatRupiah(tx.jumlah)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {paginatedTransactions.map((tx, i) => {
                const isAdd = tx.tipe === 'PINJAM' || tx.tipe === 'HUTANG_BUNGA';
                return (
                  <div 
                    key={tx.id || i}
                    className="p-3.5 rounded-lg border border-surface-700 bg-surface-800/10 hover:bg-surface-800/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={tx.nama} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-surface-50 truncate">{tx.nama}</p>
                          <p className="text-[10px] text-surface-500 font-bold tracking-wider">{tx.anggota_id}</p>
                        </div>
                      </div>
                      <Badge variant={
                        tx.tipe === 'PINJAM' ? 'danger' :
                        tx.tipe.startsWith('BAYAR') ? 'success' : 'warning'
                      }>
                        {formatTipeTransaksi(tx.tipe)}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs border-t border-surface-700 pt-2.5">
                      <div>
                        <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Tanggal</p>
                        <p className="mt-0.5 font-medium text-surface-300">{formatDate(tx.tanggal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Jumlah</p>
                        <p className={`font-bold text-sm mt-0.5 ${isAdd ? 'text-red-400' : 'text-green-400'}`}>
                          {isAdd ? '+' : '-'}{formatRupiah(tx.jumlah)}
                        </p>
                      </div>
                    </div>

                    {tx.keterangan && (
                      <div className="mt-2 text-[11px] text-surface-450 bg-surface-900/30 px-2.5 py-1.5 rounded-md border border-surface-700">
                        <span className="font-semibold text-surface-500">Ket:</span> {tx.keterangan}
                      </div>
                    )}
                    
                    {tx.created_by && (
                      <p className="text-[9px] text-surface-500 text-right mt-2 font-medium">
                        Pencatat: @{tx.created_by}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination Control Bar */}
            <div className="mt-4 pt-4 border-t border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-400">
              {/* Range Display */}
              <div className="font-medium">
                Menampilkan {startIndex + 1} sampai {Math.min(endIndex, totalItems)} dari {totalItems} transaksi
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-surface-500 font-medium">Tampilkan</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="bg-white dark:bg-surface-800 border border-surface-600 rounded px-2 py-1 text-xs text-surface-150 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-surface-500 font-medium">baris</span>
                </div>

                {/* Page Buttons */}
                <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-600 rounded-lg p-0.5 shadow-xs">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:hover:text-surface-400 transition-colors cursor-pointer"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:hover:text-surface-400 transition-colors cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 font-bold text-surface-200 whitespace-nowrap">
                    Halaman {currentPage} dari {totalPages || 1}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded-md text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:hover:text-surface-400 transition-colors cursor-pointer"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded-md text-surface-400 hover:text-surface-200 disabled:opacity-30 disabled:hover:text-surface-400 transition-colors cursor-pointer"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Catat Transaksi Baru" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchablePicker
            label="Anggota"
            options={anggotaOptions}
            value={formData.anggota_id}
            onChange={val => setFormData({ ...formData, anggota_id: val })}
            placeholder="Pilih Anggota..."
            required
          />
          <SearchablePicker
            label="Tipe Transaksi"
            options={tipeOptions}
            value={formData.tipe}
            onChange={val => setFormData({ ...formData, tipe: val })}
          />
          <Input
            label="Jumlah (Rp)"
            type="number"
            placeholder="0"
            value={formData.jumlah}
            onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
            required
            min="0"
          />
          <Input
            label="Tanggal"
            type="date"
            value={formData.tanggal}
            onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
          />
          <Input
            label="Keterangan"
            placeholder="Keterangan (opsional)"
            value={formData.keterangan}
            onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Batal</Button>
            <Button type="submit" loading={saving} icon={Plus}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

