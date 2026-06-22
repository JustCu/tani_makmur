import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Search, ChevronRight, Users, LayoutGrid, List } from 'lucide-react'
import { Card, Button, Input, Modal, Avatar, Badge, Skeleton, EmptyState } from '../components/ui'
import { formatRupiah, formatDate } from '../../shared/formatters'
import { fetchAnggota, fetchAllSaldo, createAnggota } from '../../infrastructure/DataProvider'

export default function AnggotaPage() {
  const [anggotaList, setAnggotaList] = useState([])
  const [saldoList, setSaldoList] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ nama: '', catatan: '' })
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('anggota_view_mode') || 'tiles'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [anggota, saldo] = await Promise.all([fetchAnggota(), fetchAllSaldo()])
      setAnggotaList(anggota)
      setSaldoList(saldo)
    } catch (err) {
      console.error('Failed to load anggota:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    localStorage.setItem('anggota_view_mode', mode)
  }

  const enrichedList = useMemo(() => {
    return anggotaList.map(a => {
      const saldo = saldoList.find(s => s.anggota_id === a.id) || {}
      return { ...a, ...saldo }
    })
  }, [anggotaList, saldoList])

  const filteredList = useMemo(() => {
    if (!search) return enrichedList
    const q = search.toLowerCase()
    return enrichedList.filter(a =>
      a.nama.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    )
  }, [enrichedList, search])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.nama.trim()) return
    setSaving(true)
    try {
      await createAnggota(formData)
      setShowForm(false)
      setFormData({ nama: '', catatan: '' })
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Anggota</h1>
          <p className="text-sm text-surface-400 mt-1">
            {filteredList.length} anggota {search ? 'ditemukan' : 'terdaftar'}
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowForm(true)}>
          Tambah Anggota
        </Button>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Cari anggota berdasarkan nama atau ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 rounded-lg text-sm bg-white dark:bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-600 rounded-lg p-0.5 shrink-0 shadow-sm">
          <button
            onClick={() => handleViewModeChange('tiles')}
            className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === 'tiles' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}
            title="Tampilan Grid (Tiles)"
          >
            <LayoutGrid className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}
            title="Tampilan Daftar (List)"
          >
            <List className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Member content (Grid or List) */}
      {loading ? (
        viewMode === 'tiles' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[140px]" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[64px]" />)}
          </div>
        )
      ) : filteredList.length === 0 ? (
        <EmptyState icon={Users} title="Tidak ada anggota" description={search ? 'Coba kata kunci lain' : 'Belum ada anggota terdaftar'} />
      ) : viewMode === 'tiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((member, i) => (
            <Link
              key={member.id}
              to={`/anggota/${member.id}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
            >
              <Card className="hover:border-primary-500 transition-all duration-200 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3">
                    <Avatar name={member.nama} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-350 transition-colors">
                          {member.nama}
                        </h3>
                        <ChevronRight className="w-4.5 h-4.5 text-surface-500 group-hover:text-primary-400 transition-all group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5 font-medium">{member.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-600">
                    <div>
                      <p className="text-[9px] text-surface-400 uppercase tracking-wider font-bold">Pokok</p>
                      <p className="text-sm font-bold text-surface-150 mt-0.5">{formatRupiah(member.pokok || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-surface-400 uppercase tracking-wider font-bold">Total</p>
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-0.5">{formatRupiah(member.jumlah || 0)}</p>
                    </div>
                  </div>
                </div>

                {member.hutang_bunga > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-surface-600 flex items-center justify-between text-[11px] text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/10">
                    <span className="font-semibold">Hutang Bunga:</span>
                    <span className="font-extrabold">{formatRupiah(member.hutang_bunga)}</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* List View Mode */
        <div className="space-y-3">
          {filteredList.map((member, i) => (
            <Link
              key={member.id}
              to={`/anggota/${member.id}`}
              className="group animate-fade-in block"
              style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
            >
              <Card className="hover:border-primary-500 transition-all duration-200 py-3.5 px-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left block: Avatar and info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar name={member.nama} size="sm" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-350 transition-colors truncate">
                        {member.nama}
                      </h3>
                      <p className="text-[10px] text-surface-500 font-bold tracking-wider">{member.id}</p>
                    </div>
                  </div>
                  
                  {/* Right block: Balances & Chevron */}
                  <div className="flex items-center gap-6 text-xs justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Pokok</p>
                      <p className="font-semibold text-surface-150 mt-0.5">{formatRupiah(member.pokok || 0)}</p>
                    </div>
                    
                    <div className="text-left sm:text-right min-w-[120px]">
                      <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Hutang Bunga</p>
                      {member.hutang_bunga > 0 ? (
                        <span className="inline-block mt-0.5 text-[10px] py-0.5 px-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold rounded-md">
                          {formatRupiah(member.hutang_bunga)}
                        </span>
                      ) : (
                        <p className="text-surface-500 mt-0.5 font-semibold">-</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[9px] text-surface-500 uppercase tracking-wider font-bold">Total</p>
                      <p className="font-extrabold text-primary-600 dark:text-primary-400 mt-0.5">{formatRupiah(member.jumlah || 0)}</p>
                    </div>

                    <div className="hidden sm:block">
                      <ChevronRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-all group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}


      {/* Add Member Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Anggota Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama anggota"
            value={formData.nama}
            onChange={e => setFormData({ ...formData, nama: e.target.value })}
            required
          />
          <Input
            label="Catatan"
            placeholder="Catatan (opsional)"
            value={formData.catatan}
            onChange={e => setFormData({ ...formData, catatan: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Batal</Button>
            <Button type="submit" loading={saving} icon={UserPlus}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
