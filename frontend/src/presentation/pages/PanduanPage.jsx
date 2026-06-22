import { useState, useMemo } from 'react'
import { 
  BookOpen, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  BookOpenCheck,
  ChevronDown, 
  AlertTriangle,
  Lightbulb,
  ArrowRightLeft,
  Users,
  Wallet,
  FileText
} from 'lucide-react'
import { Card, Badge } from '../components/ui'

export default function PanduanPage() {
  const [activeTab, setActiveTab] = useState('operasional') // 'operasional' | 'offline' | 'glosarium'
  const [searchQuery, setSearchQuery] = useState('')
  const [openAccordions, setOpenAccordions] = useState({
    dash: true,
    anggota: false,
    transaksi: false,
    laporan: false
  })

  // Glossary Terms data
  const glossaryTerms = [
    {
      term: 'Outstanding Pokok',
      def: 'Sisa saldo pinjaman pokok awal anggota yang belum dilunasi. Dihitung sebagai total dana koperasi yang sedang bergulir di lapangan.',
      category: 'Keuangan'
    },
    {
      term: 'Bunga Berjalan',
      def: 'Estimasi bunga berjalan yang wajib dibayarkan anggota. Koperasi menerapkan aturan bunga flat 3% per bulan dari sisa pokok berjalan.',
      category: 'Keuangan'
    },
    {
      term: 'Tunggakan Bunga',
      def: 'Akumulasi nilai tagihan bunga periode-periode sebelumnya yang belum dibayarkan oleh anggota pada akhir bulan.',
      category: 'Keuangan'
    },
    {
      term: 'Kewajiban',
      def: 'Jumlah total dana yang harus diselesaikan anggota pada periode berjalan (jumlah dari Saldo Pokok + Tunggakan Bunga).',
      category: 'Keuangan'
    },
    {
      term: 'ID Sementara (temp_A_*)',
      def: 'Kode pengenal unik yang digenerate browser saat menambah anggota baru secara offline. ID ini otomatis digantikan dengan ID resmi berurutan saat sinkronisasi.',
      category: 'Sistem'
    },
    {
      term: 'IndexedDB',
      def: 'Database internal di dalam web browser tempat menyimpan salinan data pembukuan dan antrean transaksi secara offline.',
      category: 'Sistem'
    },
    {
      term: 'Push (Unggah)',
      def: 'Proses mengirimkan antrean transaksi dan anggota baru dari browser lokal ke server utama Google Spreadsheet.',
      category: 'Sistem'
    },
    {
      term: 'Pull (Unduh)',
      def: 'Proses mengambil data pembukuan terbaru dari Google Spreadsheet ke database lokal di browser Anda.',
      category: 'Sistem'
    },
    {
      term: 'Audit Trail (Pencatat)',
      def: 'Catatan log transaksi yang mencantumkan username pengurus (seperti @admin) untuk melacak akuntabilitas input data.',
      category: 'Sistem'
    }
  ]

  // Filtered glossary based on search
  const filteredGlossary = useMemo(() => {
    if (!searchQuery) return glossaryTerms
    const q = searchQuery.toLowerCase()
    return glossaryTerms.filter(
      item => item.term.toLowerCase().includes(q) || item.def.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Panduan & Bantuan</h1>
          <p className="text-sm text-surface-400 mt-1">Petunjuk pengoperasian sistem dan glosarium istilah Kelompok Tani Makmur</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-surface-900 p-0.5 rounded-lg border border-surface-600 max-w-md shadow-sm">
        <button
          onClick={() => setActiveTab('operasional')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'operasional'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Operasional
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'offline'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Offline & Sync
        </button>
        <button
          onClick={() => setActiveTab('glosarium')}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'glosarium'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          Glosarium
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in">
        {/* Active Tab: Operasional */}
        {activeTab === 'operasional' && (
          <div className="space-y-4">
            <Card className="border border-surface-600">
              <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-primary-500" />
                Panduan Operasional Pengurus
              </h2>
              
              <div className="space-y-3.5">
                {/* Accordion 1 */}
                <div className="border border-surface-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('dash')}
                    className="w-full px-4 py-3 bg-surface-900 flex items-center justify-between text-xs font-bold text-surface-100 hover:bg-surface-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      1. MEMAHAMI DASHBOARD UTAMA
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordions.dash ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordions.dash && (
                    <div className="p-4 bg-transparent text-xs text-surface-400 space-y-2 border-t border-surface-700 leading-relaxed">
                      <p>Dashboard dirancang sebagai ringkasan eksekutif cepat untuk memantau kas koperasi.</p>
                      <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><strong>Metrik Finansial:</strong> Menampilkan saldo pokok beredar, taksiran bunga berjalan (3%), akumulasi tunggakan bunga, dan jumlah anggota aktif.</li>
                        <li><strong>Grafik Tren Likuiditas:</strong> Merupakan stacked bar chart. Arahkan pointer mouse ke batang kolom untuk melihat tooltip detail rincian Pokok, Tunggakan, Kewajiban, dan jumlah peminjam pada bulan itu.</li>
                        <li><strong>Pemantauan Anggota:</strong> Gunakan panel kanan untuk melacak siapa saja anggota yang memiliki tunggakan bunga terbesar untuk memprioritaskan penagihan bulanan.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Accordion 2 */}
                <div className="border border-surface-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('anggota')}
                    className="w-full px-4 py-3 bg-surface-900 flex items-center justify-between text-xs font-bold text-surface-100 hover:bg-surface-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      2. MANAJEMEN DATA ANGGOTA
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordions.anggota ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordions.anggota && (
                    <div className="p-4 bg-transparent text-xs text-surface-400 space-y-2 border-t border-surface-700 leading-relaxed">
                      <p>Halaman Anggota menyimpan data biodata dan saldo simpan-pinjam per anggota.</p>
                      <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><strong>Layout Grid vs List:</strong> Pengurus dapat mengubah tampilan menjadi daftar baris (List) untuk pemantauan padat data, atau tampilan kartu (Tiles) untuk melihat visual tunggakan bunga yang mencolok di bagian bawah kartu.</li>
                        <li><strong>Filter Pencarian:</strong> Ketikkan nama atau ID anggota pada kolom pencarian untuk menyaring data secara real-time.</li>
                        <li><strong>Pendaftaran Baru:</strong> Tekan tombol *Tambah Anggota* untuk membuat profil anggota baru. Jika sedang offline, sistem akan membuat ID sementara dan menyimpannya di antrean sinkronisasi.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Accordion 3 */}
                <div className="border border-surface-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('transaksi')}
                    className="w-full px-4 py-3 bg-surface-900 flex items-center justify-between text-xs font-bold text-surface-100 hover:bg-surface-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                      3. PENCATATAN TRANSAKSI & PENOMORAN HALAMAN
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordions.transaksi ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordions.transaksi && (
                    <div className="p-4 bg-transparent text-xs text-surface-400 space-y-2 border-t border-surface-700 leading-relaxed">
                      <p>Pencatatan kas keluar masuk wajib dicatat di halaman Transaksi untuk validitas saldo.</p>
                      <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><strong>Pencatatan Baru:</strong> Pilih anggota, tipe transaksi (misal: Pinjam, Bayar Pokok, Bayar Hutang Bunga), jumlah nominal, dan keterangan.</li>
                        <li><strong>Navigasi Data (Paginasi):</strong> Gunakan kontrol halaman di bawah tabel untuk bernavigasi jika riwayat transaksi sudah berjumlah ratusan. Anda juga dapat menyaring jumlah baris yang tampil (10, 25, 50, 100 baris) untuk mempermudah audit data.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Accordion 4 */}
                <div className="border border-surface-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('laporan')}
                    className="w-full px-4 py-3 bg-surface-900 flex items-center justify-between text-xs font-bold text-surface-100 hover:bg-surface-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      4. CETAK LAPORAN REKAPITULASI BULANAN
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordions.laporan ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordions.laporan && (
                    <div className="p-4 bg-transparent text-xs text-surface-400 space-y-2 border-t border-surface-700 leading-relaxed">
                      <p>Digunakan untuk pelaporan bulanan pengurus koperasi ke rapat anggota.</p>
                      <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li>Pilih periode bulan berjalan di halaman Laporan, pastikan pratinjau data saldo debit sudah sesuai.</li>
                        <li>Klik tombol *Cetak Rekap Bulanan*. Jendela printer bawaan browser akan terbuka.</li>
                        <li><strong>Format Cetak:</strong> Menggunakan format surat resmi monokrom khusus (dilengkapi garis kop surat, tanda tangan Ketua dan Bendahara).</li>
                        <li>Pilih printer fisik untuk mencetak ke kertas, atau pilih *Save as PDF* untuk menyimpan versi file digital.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Active Tab: Offline & Sync */}
        {activeTab === 'offline' && (
          <div className="space-y-6">
            <Card className="border border-surface-600">
              <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <RefreshCw className="w-4.5 h-4.5 text-primary-500" />
                Cara Kerja Mode Offline & Antrean Sinkronisasi
              </h2>
              <p className="text-xs text-surface-400 leading-relaxed">
                Aplikasi ini mendukung operasional tanpa koneksi internet (offline). Seluruh data pembukuan di-cache secara aman di memori web browser Anda.
              </p>

              {/* Informative Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-3.5 rounded-lg bg-surface-900 border border-surface-700 text-xs">
                  <div className="w-7 h-7 rounded bg-amber-500/10 flex items-center justify-center mb-2.5 text-amber-500 font-bold">1</div>
                  <h3 className="font-bold text-surface-100 mb-1.5">Koneksi Terputus</h3>
                  <p className="text-surface-500 leading-relaxed">Sistem mendeteksi status offline, indikator di kanan atas berubah menjadi amber. Data baru yang diinput disimpan ke IndexedDB browser.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-900 border border-surface-700 text-xs">
                  <div className="w-7 h-7 rounded bg-blue-500/10 flex items-center justify-center mb-2.5 text-blue-500 font-bold">2</div>
                  <h3 className="font-bold text-surface-100 mb-1.5">ID Sementara</h3>
                  <p className="text-surface-500 leading-relaxed">Anggota baru dibuat dengan ID acak sementara `temp_A_*`. Transaksi yang memotong saldo anggota ini dikaitkan dengan ID sementara tersebut.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-900 border border-surface-700 text-xs">
                  <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center mb-2.5 text-emerald-500 font-bold">3</div>
                  <h3 className="font-bold text-surface-100 mb-1.5">Auto-Mapping Sync</h3>
                  <p className="text-surface-500 leading-relaxed">Saat online kembali, proses sinkronisasi mengunggah anggota ke server, menerima ID asli (misal `A0062`), lalu otomatis mengubah rujukan transaksi offline ke ID resmi tersebut.</p>
                </div>
              </div>

              {/* Alerts */}
              <div className="mt-6 space-y-3">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>PENTING:</strong> Tombol *Hapus Cache Lokal* di halaman Sinkronisasi hanya boleh digunakan jika database browser bermasalah. Sistem akan memblokir tindakan ini jika mendeteksi adanya antrean perubahan tunda agar data Anda tidak hilang permanen.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-600 text-primary-300 flex items-start gap-2.5 text-xs">
                  <Lightbulb className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>TIPS TRANSAKSI GAGAL:</strong> Jika sinkronisasi gagal karena jaringan tidak stabil di tengah jalan, Anda dapat menghapus baris transaksi bermasalah di tabel antrean dengan menekan ikon tempat sampah, lalu menginput ulang transaksi tersebut secara online.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Active Tab: Glosarium */}
        {activeTab === 'glosarium' && (
          <div className="space-y-4">
            <Card className="border border-surface-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h2 className="text-sm font-bold text-surface-50 uppercase tracking-wider flex items-center gap-2">
                  <BookOpenCheck className="w-4.5 h-4.5 text-primary-500" />
                  Glosarium Keuangan & Sistem
                </h2>
                
                {/* Search glossary */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="text"
                    placeholder="Cari definisi istilah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-lg text-xs bg-white dark:bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-700 text-surface-500 uppercase text-[9px] font-bold tracking-wider">
                      <th className="py-2.5 px-3 w-40">Istilah</th>
                      <th className="py-2.5 px-3 w-20">Kategori</th>
                      <th className="py-2.5 px-3">Definisi & Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGlossary.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-surface-500 font-semibold">
                          Tidak menemukan hasil untuk kata kunci "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredGlossary.map((item, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-surface-800 hover:bg-surface-700 transition-colors"
                        >
                          <td className="py-3 px-3 font-bold text-surface-100">{item.term}</td>
                          <td className="py-3 px-3">
                            <Badge 
                              variant={item.category === 'Keuangan' ? 'info' : 'success'}
                              className="text-[8px] py-0.5"
                            >
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-surface-400 leading-relaxed">{item.def}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
