// ============================================================
// Constants — Application-wide configuration
// ============================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const BUNGA_PERSEN = 3;

export const TIPE_TRANSAKSI = {
  PINJAM: 'PINJAM',
  BAYAR_POKOK: 'BAYAR_POKOK',
  BAYAR_BUNGA: 'BAYAR_BUNGA',
  HUTANG_BUNGA: 'HUTANG_BUNGA',
  BAYAR_HUTANG_BUNGA: 'BAYAR_HUTANG_BUNGA',
};

export const TIPE_TRANSAKSI_LABELS = {
  PINJAM: 'Pinjaman Baru',
  BAYAR_POKOK: 'Bayar Pokok',
  BAYAR_BUNGA: 'Bayar Bunga',
  HUTANG_BUNGA: 'Hutang Bunga',
  BAYAR_HUTANG_BUNGA: 'Bayar Hutang Bunga',
};

export const TIPE_TRANSAKSI_COLORS = {
  PINJAM: 'text-red-400',
  BAYAR_POKOK: 'text-green-400',
  BAYAR_BUNGA: 'text-green-400',
  HUTANG_BUNGA: 'text-amber-400',
  BAYAR_HUTANG_BUNGA: 'text-blue-400',
};

export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const STATUS_ANGGOTA = {
  AKTIF: 'aktif',
  NONAKTIF: 'nonaktif',
};

export const CONFIG_KEYS = {
  NAMA_KELOMPOK: 'nama_kelompok',
  ALAMAT: 'alamat',
  KETUA: 'ketua',
  TAHUN_BUKU: 'tahun_buku',
  BUNGA_PERSEN: 'bunga_persen',
};
