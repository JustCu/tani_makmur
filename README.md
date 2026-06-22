# 🌾 Tani Makmur — Sistem Pembukuan Simpan Pinjam

Aplikasi pembukuan simpan pinjam digital untuk **Kelompok Tani Makmur**, Katemas.

## 🏗️ Arsitektur

```
┌─────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind) │
│  Deploy: GitHub Pages               │
└────────────┬────────────────────────┘
             │ fetch / POST
┌────────────▼────────────────────────┐
│  Backend (Google Apps Script)        │
│  Deploy: Web App                     │
└────────────┬────────────────────────┘
             │ read / write
┌────────────▼────────────────────────┐
│  Database (Google Spreadsheet)       │
│  Sheets: master_anggota, transaksi,  │
│          rekap_bulanan, config        │
└──────────────────────────────────────┘
```

## 🚀 Setup & Deployment

### Langkah 1: Setup Google Spreadsheet

1. Buat Google Spreadsheet baru di [Google Sheets](https://sheets.google.com)
2. Beri nama: **"Tani Makmur DB"**
3. Catat **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Langkah 2: Setup Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **New Project**
3. Copy-paste semua file `.gs` dari folder `apps-script/`:
   - `Utils.gs` — Utility functions
   - `AnggotaService.gs` — Member CRUD
   - `TransaksiService.gs` — Transaction recording
   - `PinjamanService.gs` — Loan calculations
   - `LaporanService.gs` — Reports & stats
   - `Code.gs` — API router
   - `Migration.gs` — Data migration
4. Di file `Utils.gs`, isi `SPREADSHEET_ID` dengan ID dari Langkah 1
5. **Deploy:**
   - Klik **Deploy** → **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy** → Copy URL

### Langkah 3: Migrasi Data

1. Di Google Apps Script editor, jalankan fungsi:
   ```
   setupSpreadsheet()    ← Buat semua sheet & config awal
   migrateAllData()      ← Import data anggota & saldo Nov 2025
   ```

### Langkah 4: Setup Frontend

```bash
cd frontend
npm install
```

Buat file `.env` di folder `frontend/`:
```env
VITE_API_URL=https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

Jalankan development server:
```bash
npm run dev
```

### Langkah 5: Deploy ke GitHub Pages

```bash
npm run build
```

Upload folder `dist/` ke GitHub repository, atau gunakan GitHub Actions.

## 📁 Struktur Project

```
tani_makmur/
├── apps-script/           # Google Apps Script backend
│   ├── Code.gs            # API router & HTTP handlers
│   ├── Utils.gs           # Utilities & constants
│   ├── AnggotaService.gs  # Member CRUD
│   ├── TransaksiService.gs # Transaction operations
│   ├── PinjamanService.gs # Loan calculations & rekap
│   ├── LaporanService.gs  # Reports & dashboard stats
│   └── Migration.gs       # Excel data migration
│
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── shared/        # Constants & formatters
│   │   ├── infrastructure/ # API client, mock data, DataProvider
│   │   └── presentation/  # Components, pages, layout
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── KELOMPOK TANI MAKMUR.xlsx  # Source data
```

## 🧮 Business Rules

- **Bunga**: 3% flat per bulan dari pokok pinjaman
- **Hutang Bunga**: Bunga yang tidak dibayar terakumulasi
- **Jumlah**: Pokok + Hutang Bunga terakumulasi
- **Carry-forward**: Saldo bulan ini menjadi basis bulan berikutnya

## 👤 Penggunaan

Aplikasi ini digunakan oleh **pengurus** (bendahara/ketua) kelompok tani untuk:
- Mencatat transaksi pinjaman & pembayaran
- Melihat saldo & hutang bunga tiap anggota
- Mencetak laporan rekap bulanan (dengan tanda tangan ketua)
- Monitor tren keuangan kelompok

## 📄 Lisensi

Private — Kelompok Tani Makmur, Katemas.
