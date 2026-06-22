import { useState, useEffect } from 'react'
import { Printer, FileText } from 'lucide-react'
import { Card, Button, Select, Skeleton, EmptyState } from '../components/ui'
import { formatRupiah, formatPeriode } from '../../shared/formatters'
import { fetchPeriodes, fetchRekapBulanan, fetchConfig } from '../../infrastructure/DataProvider'

export default function LaporanPage() {
  const [periodes, setPeriodes] = useState([])
  const [selectedPeriode, setSelectedPeriode] = useState('')
  const [rekap, setRekap] = useState(null)
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingRekap, setLoadingRekap] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [periodesData, configData] = await Promise.all([
          fetchPeriodes(),
          fetchConfig(),
        ])
        setPeriodes(periodesData)
        setConfig(configData)
        if (periodesData.length > 0) {
          const latest = periodesData[periodesData.length - 1]
          setSelectedPeriode(latest)
          await loadRekap(latest)
        }
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadRekap(periode) {
    setLoadingRekap(true)
    try {
      const data = await fetchRekapBulanan(periode)
      setRekap(data)
    } catch (err) {
      console.error('Failed to load rekap:', err)
    } finally {
      setLoadingRekap(false)
    }
  }

  function handlePeriodeChange(e) {
    const periode = e.target.value
    setSelectedPeriode(periode)
    loadRekap(periode)
  }

  function handlePrint() {
    if (!rekap || rekap.items.length === 0) return

    const totalRows    = rekap.items.length
    const periodeLabel = formatPeriode(selectedPeriode).toUpperCase()
    const namaKelompok = (config.nama_kelompok || 'KELOMPOK TANI MAKMUR').toUpperCase()
    const alamat       = config.alamat    || 'Katemas, Kec. Kudu, Kab. Jombang'
    const ketua        = (config.ketua    || '______________________').toUpperCase()
    const bendahara    = (config.bendahara || '______________________').toUpperCase()
    const tahunBuku    = config.tahun_buku || '2025/2026'
    const today        = new Date()
    const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember']
    const tglCetak = `${today.getDate()} ${BULAN[today.getMonth()]} ${today.getFullYear()}`
    const tglTanda = `${alamat.split(',')[0]}, ${tglCetak}`

    const fmt = (n) => n ? Number(n).toLocaleString('id-ID') : '-'
    const fmtTotal = (n) => Number(n || 0).toLocaleString('id-ID')

    const rowsHtml = rekap.items.map((item, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="l">${item.nama || ''}</td>
        <td class="r">${fmt(item.pokok)}</td>
        <td class="r">${fmt(item.bunga)}</td>
        <td class="r">${fmt(item.hutang_pokok_plus)}</td>
        <td class="r">${fmt(item.hutang_pokok_minus)}</td>
        <td class="r">${fmt(item.hutang_bunga_plus)}</td>
        <td class="r">${fmt(item.hutang_bunga_minus)}</td>
        <td class="r fw7">${fmt(item.jumlah)}</td>
      </tr>`).join('')

    const t = rekap.totals
    const totalHtml = `
      <tr class="tr-total">
        <td colspan="2" class="l fw7">JUMLAH</td>
        <td class="r fw7">${fmtTotal(t.pokok)}</td>
        <td class="r fw7">${fmtTotal(t.bunga)}</td>
        <td class="r fw7">${fmtTotal(t.hutang_pokok_plus)}</td>
        <td class="r fw7">${fmtTotal(t.hutang_pokok_minus)}</td>
        <td class="r fw7">${fmtTotal(t.hutang_bunga_plus)}</td>
        <td class="r fw7">${fmtTotal(t.hutang_bunga_minus)}</td>
        <td class="r fw7">${fmtTotal(t.jumlah)}</td>
      </tr>`

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Rekapitulasi Debet — ${periodeLabel}</title>
<style>
/* ─── Reset & Page ─────────────────────────────────── */
@page { size: A4 portrait; margin: 18mm 15mm 22mm 15mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 10pt;
  color: #000;
  background: #fff;
  line-height: 1.5;
}

/* ─── Kop Surat ─────────────────────────────────────── */
.kop {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 9px;
}
.kop-lambang {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border: 2.5px solid #1a5c3a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  line-height: 1;
}
.kop-isi { flex:1; text-align:center; }
.kop-nama {
  font-size: 15pt;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
  line-height: 1.1;
}
.kop-tipe {
  font-size: 10pt;
  margin-top: 2px;
}
.kop-alamat {
  font-size: 8.5pt;
  color: #333;
  margin-top: 3px;
}
.garis-tebal { border:none; border-top: 3px solid #000; margin:0; }
.garis-tipis { border:none; border-top: 1.5px solid #000; margin-top:2px; margin-bottom:0; }

/* ─── Judul Dokumen ─────────────────────────────────── */
.judul-blok {
  text-align: center;
  padding: 8px 0 6px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 8px;
}
.judul-utama {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.judul-periode {
  font-size: 10pt;
  margin-top: 3px;
}

/* ─── Info Dokumen ──────────────────────────────────── */
.info-blok {
  display: flex;
  justify-content: space-between;
  font-size: 8.5pt;
  margin-bottom: 9px;
  padding: 5px 8px;
  border: 1px solid #ccc;
  background: #fafafa;
}
.info-kiri, .info-kanan { line-height: 1.8; }
.info-kanan { text-align: right; }
.info-label { color: #444; }
.info-sep   { margin: 0 4px; }
.info-val   { font-weight: bold; color: #000; }

/* ─── Tabel Data ────────────────────────────────────── */
table.t {
  width: 100%;
  border-collapse: collapse;
  font-size: 7.5pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }
tfoot { display: table-footer-group; }

/* header baris 1 */
table.t thead tr.h1 th {
  background: #1a5c3a;
  color: #fff;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-size: 7pt;
  padding: 5px 3px;
  border: 1px solid #0f3d27;
  text-align: center;
  line-height: 1.3;
  vertical-align: middle;
}
table.t thead tr.h1 th.tl { text-align: left; padding-left: 6px; }

/* header baris 2 (sub-group) */
table.t thead tr.h2 th {
  background: #2d7a4f;
  color: #fff;
  font-weight: bold;
  font-size: 6.5pt;
  padding: 3.5px 3px;
  border: 1px solid #0f3d27;
  text-align: center;
  letter-spacing: 0;
}

/* sel data */
table.t td {
  padding: 3.5px 4px;
  border: 1px solid #c0c0c0;
  vertical-align: middle;
  color: #000;
  font-size: 7.5pt;
}
table.t tbody tr:nth-child(odd)  td { background: #fff; }
table.t tbody tr:nth-child(even) td { background: #f4f4f4; }

/* alignment helpers */
.c   { text-align: center; }
.l   { text-align: left;  padding-left: 6px; }
.r   { text-align: right; font-family: 'Courier New', Courier, monospace; font-size: 7pt; padding-right: 5px; }
.fw7 { font-weight: bold; }

/* baris total */
table.t .tr-total td {
  background: #1a5c3a !important;
  color: #fff !important;
  font-weight: bold;
  font-size: 7.5pt;
  border: 1px solid #0f3d27;
  padding: 5px 4px;
}
table.t .tr-total .l { padding-left: 6px; }

/* ─── Catatan ───────────────────────────────────────── */
.catatan {
  font-size: 7pt;
  color: #555;
  margin-top: 5px;
  font-style: italic;
}

/* ─── Tanda Tangan ──────────────────────────────────── */
.ttd { margin-top: 22px; page-break-inside: avoid; }
.ttd-baris {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}
.ttd-kotak {
  width: 155px;
  text-align: center;
  font-size: 9pt;
}
.ttd-kota    { font-size: 8.5pt; margin-bottom: 1px; }
.ttd-jabatan { font-size: 8.5pt; margin-bottom: 46px; color: #222; }
.ttd-nama    { font-size: 9pt; font-weight: bold; text-decoration: underline;
               text-transform: uppercase; margin-bottom: 2px; }
.ttd-role    { font-size: 7.5pt; color: #444; }

/* ─── Footer ────────────────────────────────────────── */
.footer {
  position: fixed;
  bottom: -15mm;
  left: 0; right: 0;
  border-top: 1px solid #999;
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 6.5pt;
  color: #666;
  font-family: Arial, sans-serif;
}
</style>
</head>
<body>

<!-- KOP SURAT -->
<div class="kop">
  <div class="kop-lambang">🌾</div>
  <div class="kop-isi">
    <div class="kop-nama">${namaKelompok}</div>
    <div class="kop-tipe">Sistem Simpan Pinjam Kelompok Tani</div>
    <div class="kop-alamat">${alamat}</div>
  </div>
</div>
<hr class="garis-tebal">
<hr class="garis-tipis">

<!-- JUDUL -->
<div class="judul-blok">
  <div class="judul-utama">Laporan Rekapitulasi Bulanan Debet</div>
  <div class="judul-periode">Periode&ensp;:&ensp;${periodeLabel}&emsp;&emsp;Tahun Buku&ensp;:&ensp;${tahunBuku}</div>
</div>

<!-- INFO -->
<div class="info-blok">
  <div class="info-kiri">
    <span class="info-label">Jenis Laporan</span><span class="info-sep">:</span><span class="info-val">Buku Rekapitulasi Debet Anggota</span><br>
    <span class="info-label">Satuan Nilai</span><span class="info-sep">:</span><span class="info-val">Rupiah (IDR)</span>
  </div>
  <div class="info-kanan">
    <span class="info-label">Jumlah Anggota</span><span class="info-sep">:</span><span class="info-val">${totalRows} orang</span><br>
    <span class="info-label">Tanggal Cetak</span><span class="info-sep">:</span><span class="info-val">${tglCetak}</span>
  </div>
</div>

<!-- TABEL -->
<table class="t">
  <thead>
    <tr class="h1">
      <th rowspan="2" style="width:4%">No.</th>
      <th rowspan="2" class="tl" style="width:22%">Nama Anggota</th>
      <th rowspan="2" style="width:10%">Pokok</th>
      <th rowspan="2" style="width:9%">Bunga</th>
      <th colspan="2" style="width:22%;background:#2d7a4f;border-color:#0f3d27">Hutang Pokok</th>
      <th colspan="2" style="width:22%;background:#2d7a4f;border-color:#0f3d27">Hutang Bunga</th>
      <th rowspan="2" style="width:11%">Jumlah</th>
    </tr>
    <tr class="h2">
      <th style="width:11%">(+) Tambah</th>
      <th style="width:11%">(−) Kurang</th>
      <th style="width:11%">(+) Tambah</th>
      <th style="width:11%">(−) Kurang</th>
    </tr>
  </thead>
  <tbody>${rowsHtml}</tbody>
  <tfoot>${totalHtml}</tfoot>
</table>

<p class="catatan">Keterangan: Semua nilai dalam satuan Rupiah (IDR). Tanda (+) = penambahan hutang, (−) = pembayaran/pengurangan hutang. Dokumen dicetak otomatis oleh sistem.</p>

<!-- TANDA TANGAN -->
<div class="ttd">
  <div class="ttd-baris">
    <div class="ttd-kotak">
      <div class="ttd-jabatan">Dibuat Oleh,</div>
      <div class="ttd-nama">${bendahara}</div>
      <div class="ttd-role">Bendahara / Pengurus</div>
    </div>
    <div class="ttd-kotak">
      <div class="ttd-kota">${tglTanda}</div>
      <div class="ttd-jabatan">Mengetahui,</div>
      <div class="ttd-nama">${ketua}</div>
      <div class="ttd-role">Ketua Kelompok Tani</div>
    </div>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <span>${namaKelompok} &mdash; Laporan Debet ${periodeLabel}</span>
  <span>Dicetak: ${tglCetak}</span>
</div>

</body>
</html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 600)
  }

  const periodeOptions = periodes.map(p => ({
    value: p,
    label: formatPeriode(p),
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Laporan Rekap Bulanan</h1>
          <p className="text-sm text-surface-400 mt-1">Format DEBET — Sesuai buku besar</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={periodeOptions}
            value={selectedPeriode}
            onChange={handlePeriodeChange}
            className="w-48"
          />
          <Button icon={Printer} onClick={handlePrint} variant="secondary">
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Rekap Table (Screen Version) */}
      {loadingRekap ? (
        <Skeleton className="h-[500px]" />
      ) : !rekap || rekap.items.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="Tidak ada data" description="Pilih periode yang tersedia" />
        </Card>
      ) : (
        <Card className="animate-fade-in overflow-x-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-surface-50 text-center">
              DEBET {(config.nama_kelompok || 'KELOMPOK TANI MAKMUR').toUpperCase()}
            </h2>
            <p className="text-sm text-surface-400 text-center mt-1">
              BULAN {formatPeriode(selectedPeriode).toUpperCase()}
            </p>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-surface-600">
                <th className="py-2 px-3 text-center text-xs font-bold text-surface-400 uppercase tracking-wider w-12">No.</th>
                <th className="py-2 px-3 text-left text-xs font-bold text-surface-400 uppercase tracking-wider min-w-[160px]">Nama</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Pokok</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Bunga</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ht. Pokok (+)</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ht. Pokok (-)</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ht. Bunga (+)</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-surface-400 uppercase tracking-wider">Ht. Bunga (-)</th>
                <th className="py-2 px-3 text-right text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rekap.items.map((item, i) => (
                <tr
                  key={item.anggota_id || i}
                  className="border-b border-surface-600 hover:bg-surface-700 transition-colors"
                >
                  <td className="py-2 px-3 text-center text-surface-500 text-xs">{i + 1}</td>
                  <td className="py-2 px-3 text-surface-100 font-medium text-sm">{item.nama}</td>
                  <td className="py-2 px-3 text-right text-surface-300 font-mono text-xs">{formatRupiah(item.pokok)}</td>
                  <td className="py-2 px-3 text-right text-surface-400 font-mono text-xs">{formatRupiah(item.bunga)}</td>
                  <td className="py-2 px-3 text-right text-surface-400 font-mono text-xs">{item.hutang_pokok_plus ? formatRupiah(item.hutang_pokok_plus) : '-'}</td>
                  <td className="py-2 px-3 text-right text-surface-400 font-mono text-xs">{item.hutang_pokok_minus ? formatRupiah(item.hutang_pokok_minus) : '-'}</td>
                  <td className="py-2 px-3 text-right font-mono text-xs">
                    <span className={item.hutang_bunga_plus > 0 ? 'text-amber-400 font-semibold' : 'text-surface-500'}>
                      {item.hutang_bunga_plus ? formatRupiah(item.hutang_bunga_plus) : '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs">
                    <span className={item.hutang_bunga_minus > 0 ? 'text-green-400 font-semibold' : 'text-surface-500'}>
                      {item.hutang_bunga_minus ? formatRupiah(item.hutang_bunga_minus) : '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-primary-300 font-bold font-mono text-xs">{formatRupiah(item.jumlah)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary-600 bg-surface-900">
                <td className="py-3 px-3" colSpan={2}>
                  <span className="text-sm font-bold text-surface-50">JUMLAH</span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-surface-50 font-mono text-sm">{formatRupiah(rekap.totals.pokok)}</td>
                <td className="py-3 px-3 text-right font-bold text-surface-200 font-mono text-xs">{formatRupiah(rekap.totals.bunga)}</td>
                <td className="py-3 px-3 text-right font-bold text-surface-200 font-mono text-xs">{formatRupiah(rekap.totals.hutang_pokok_plus)}</td>
                <td className="py-3 px-3 text-right font-bold text-surface-200 font-mono text-xs">{formatRupiah(rekap.totals.hutang_pokok_minus)}</td>
                <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400 font-mono text-xs">{formatRupiah(rekap.totals.hutang_bunga_plus)}</td>
                <td className="py-3 px-3 text-right font-bold text-green-650 dark:text-green-450 font-mono text-xs">{formatRupiah(rekap.totals.hutang_bunga_minus)}</td>
                <td className="py-3 px-3 text-right font-bold text-primary-600 dark:text-primary-300 font-mono text-sm">{formatRupiah(rekap.totals.jumlah)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  )
}
