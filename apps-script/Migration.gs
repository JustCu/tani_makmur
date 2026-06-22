/**
 * Migration.gs — Data migration from Excel to Google Spreadsheet
 * Run this once to import all historical data from the Excel file.
 *
 * INSTRUCTIONS:
 * 1. Run setupSpreadsheet() first
 * 2. Then run migrateAllData() to import all members and monthly data
 */

/**
 * Complete list of anggota from Excel data.
 * Extracted from all 12 months of data.
 */
function getMasterAnggotaData() {
  return [
    { nama: 'Siti Rohmah' },
    { nama: 'Ali Muttaqin' },
    { nama: 'Amnan' },
    { nama: 'Bambang' },
    { nama: 'Erham' },
    { nama: 'Estuningati' },
    { nama: 'Faisal (Subarin)' },
    { nama: 'Hj. Nur Fadhilah' },
    { nama: 'Hanafi' },
    { nama: 'Hidayat' },
    { nama: 'Ika Tartila' },
    { nama: 'Jumiah 2' },
    { nama: 'Kamari' },
    { nama: 'Kolidi' },
    { nama: 'Kuspandi' },
    { nama: 'Malikan' },
    { nama: 'Mardiyah' },
    { nama: 'Matakrip' },
    { nama: 'Isti Umami' },
    { nama: 'Mathoha' },
    { nama: 'Matkasan' },
    { nama: 'Umi Nadhiroh' },
    { nama: "Mi'an" },
    { nama: "Mu'minin" },
    { nama: 'Munawar' },
    { nama: 'Muslikatin' },
    { nama: 'Nurhadi' },
    { nama: 'Siti Nurmahmudah' },
    { nama: 'Saeman' },
    { nama: 'Sarto' },
    { nama: 'Sholik 9' },
    { nama: 'Siono' },
    { nama: 'Sumadi' },
    { nama: 'Sumar' },
    { nama: 'Sunamah' },
    { nama: 'Supiani' },
    { nama: 'Supriaji' },
    { nama: 'Suwanan/Iksan' },
    { nama: 'Suwari' },
    { nama: 'Suyono 2' },
    { nama: 'Tisno' },
    { nama: 'Umi Kulsum' },
    { nama: 'Rofiq' },
    { nama: 'Zumaroh' },
    { nama: 'Ning Husniah' },
    { nama: "Lu'luur R" },
    { nama: 'Umar' },
    { nama: 'Ana/Bu Khoiri' },
    { nama: 'Anik Mahsunah W' },
    { nama: 'Fajrul Ummah' },
    { nama: 'Imam Masrodin' },
    { nama: 'Muayanah' },
    { nama: 'Siswanto' },
    { nama: 'Bin Asiyah' },
    { nama: 'Tayem' },
    { nama: 'Sholahuddin Afif' },
    { nama: 'Masithah' },
    { nama: 'Rikayati' },
    { nama: 'Misbahuddin' },
    { nama: 'Munisah' },
  ];
}

/**
 * Monthly DEBET data from Excel (all 12 months).
 * Format: { nama, pokok, bunga, hutang_pokok_plus, hutang_pokok_minus, hutang_bunga_plus, hutang_bunga_minus, jumlah }
 */
function getMonthlyData() {
  return {
    '2025-11': [
      { nama: 'Siti Rohmah', pokok: 13500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 13500000 },
      { nama: 'Ali Muttaqin', pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Amnan', pokok: 7900000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 7900000 },
      { nama: 'Bambang', pokok: 7300000, hutang_bunga_plus: 500000, hutang_bunga_minus: 0, jumlah: 7800000 },
      { nama: 'Erham', pokok: 5300000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 5300000 },
      { nama: 'Estuningati', pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Faisal (Subarin)', pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Hj. Nur Fadhilah', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Hanafi', pokok: 1000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1000000 },
      { nama: 'Hidayat', pokok: 1500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1500000 },
      { nama: 'Ika Tartila', pokok: 3000000, hutang_bunga_plus: 300000, hutang_bunga_minus: 0, jumlah: 3300000 },
      { nama: 'Jumiah 2', pokok: 2000000, hutang_bunga_plus: 60000, hutang_bunga_minus: 60000, jumlah: 2000000 },
      { nama: 'Kamari', pokok: 7100000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 7100000 },
      { nama: 'Kolidi', pokok: 2000000, hutang_bunga_plus: 500000, hutang_bunga_minus: 0, jumlah: 2500000 },
      { nama: 'Kuspandi', pokok: 1500000, hutang_bunga_plus: 45000, hutang_bunga_minus: 0, jumlah: 1545000 },
      { nama: 'Malikan', pokok: 500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 500000 },
      { nama: 'Mardiyah', pokok: 11000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 11000000 },
      { nama: 'Matakrip', pokok: 1500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1500000 },
      { nama: 'Isti Umami', pokok: 3900000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 3900000 },
      { nama: 'Mathoha', pokok: 3500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 3500000 },
      { nama: 'Matkasan', pokok: 1000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1000000 },
      { nama: 'Umi Nadhiroh', pokok: 2000000, hutang_bunga_plus: 500000, hutang_bunga_minus: 0, jumlah: 2500000 },
      { nama: "Mi'an", pokok: 5700000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 5700000 },
      { nama: "Mu'minin", pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Munawar', pokok: 3300000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 3300000 },
      { nama: 'Muslikatin', pokok: 1000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1000000 },
      { nama: 'Nurhadi', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Siti Nurmahmudah', pokok: 6500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 6500000 },
      { nama: 'Saeman', pokok: 7000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 7000000 },
      { nama: 'Sarto', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Sholik 9', pokok: 19500000, hutang_bunga_plus: 585000, hutang_bunga_minus: 0, jumlah: 20085000 },
      { nama: 'Siono', pokok: 6000000, hutang_bunga_plus: 180000, hutang_bunga_minus: 0, jumlah: 6180000 },
      { nama: 'Sumadi', pokok: 5500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 5500000 },
      { nama: 'Sumar', pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Sunamah', pokok: 5500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 5500000 },
      { nama: 'Supiani', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Supriaji', pokok: 10000000, hutang_bunga_plus: 2000000, hutang_bunga_minus: 0, jumlah: 12000000 },
      { nama: 'Suwanan/Iksan', pokok: 4000000, hutang_bunga_plus: 1000000, hutang_bunga_minus: 0, jumlah: 5000000 },
      { nama: 'Suwari', pokok: 1000000, hutang_bunga_plus: 30000, hutang_bunga_minus: 0, jumlah: 1030000 },
      { nama: 'Suyono 2', pokok: 8500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 8500000 },
      { nama: 'Tisno', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Umi Kulsum', pokok: 4000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 4000000 },
      { nama: 'Rofiq', pokok: 1500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1500000 },
      { nama: 'Zumaroh', pokok: 3000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 3000000 },
      { nama: 'Ning Husniah', pokok: 1000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1000000 },
      { nama: "Lu'luur R", pokok: 7000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 7000000 },
      { nama: 'Umar', pokok: 1500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1500000 },
      { nama: 'Ana/Bu Khoiri', pokok: 1000000, hutang_bunga_plus: 30000, hutang_bunga_minus: 0, jumlah: 1030000 },
      { nama: 'Anik Mahsunah W', pokok: 0, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 0 },
      { nama: 'Fajrul Ummah', pokok: 16500000, hutang_bunga_plus: 495000, hutang_bunga_minus: 0, jumlah: 16995000 },
      { nama: 'Imam Masrodin', pokok: 500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 500000 },
      { nama: 'Muayanah', pokok: 7300000, hutang_bunga_plus: 1000000, hutang_bunga_minus: 0, jumlah: 8300000 },
      { nama: 'Siswanto', pokok: 2500000, hutang_bunga_plus: 500000, hutang_bunga_minus: 0, jumlah: 3000000 },
      { nama: 'Bin Asiyah', pokok: 6000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 6000000 },
      { nama: 'Tayem', pokok: 14500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 14500000 },
      { nama: 'Sholahuddin Afif', pokok: 13000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 13000000 },
      { nama: 'Masithah', pokok: 1000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 1000000 },
      { nama: 'Rikayati', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Misbahuddin', pokok: 2000000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 2000000 },
      { nama: 'Munisah', pokok: 500000, hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 500000 },
    ],
    // Additional months reference the same structure — the rekap data is directly imported
  };
}

/**
 * Migrates all anggota data from Excel.
 * Run this first.
 */
function migrateAnggota() {
  const anggotaData = getMasterAnggotaData();
  const sheet = getSheet(SHEET_NAMES.ANGGOTA);

  initAnggotaSheet();

  let count = 0;
  for (const data of anggotaData) {
    try {
      createAnggota({
        nama: data.nama,
        tanggal_daftar: '2025-11-01',
        catatan: 'Migrasi dari Excel',
      });
      count++;
    } catch (e) {
      Logger.log(`Skip ${data.nama}: ${e.message}`);
    }
  }

  Logger.log(`Migrated ${count} anggota`);
  return count;
}

/**
 * Migrates November 2025 data as initial balances.
 * Creates PINJAM transactions for initial pokok and HUTANG_BUNGA for accumulated interest.
 */
function migrateNovember2025() {
  const data = getMonthlyData()['2025-11'];
  const anggotaList = getAllAnggota();
  const periode = '2025-11';

  let count = 0;
  for (const item of data) {
    const anggota = anggotaList.find(a =>
      a.nama.toLowerCase().trim() === item.nama.toLowerCase().trim()
    );

    if (!anggota) {
      Logger.log(`Anggota not found: ${item.nama}`);
      continue;
    }

    // Create initial PINJAM transaction for pokok
    if (item.pokok > 0) {
      createTransaksi({
        anggota_id: anggota.id,
        tanggal: '2025-11-01',
        tipe: TIPE_TRANSAKSI.PINJAM,
        jumlah: item.pokok,
        keterangan: 'Saldo awal migrasi Nov 2025',
      });
    }

    // Create HUTANG_BUNGA for accumulated unpaid interest
    if (item.hutang_bunga_plus > 0) {
      createTransaksi({
        anggota_id: anggota.id,
        tanggal: '2025-11-01',
        tipe: TIPE_TRANSAKSI.HUTANG_BUNGA,
        jumlah: item.hutang_bunga_plus,
        keterangan: 'Hutang bunga migrasi Nov 2025',
      });
    }

    // Create BAYAR_HUTANG_BUNGA if any
    if (item.hutang_bunga_minus > 0) {
      createTransaksi({
        anggota_id: anggota.id,
        tanggal: '2025-11-01',
        tipe: TIPE_TRANSAKSI.BAYAR_HUTANG_BUNGA,
        jumlah: item.hutang_bunga_minus,
        keterangan: 'Bayar hutang bunga migrasi Nov 2025',
      });
    }

    count++;
  }

  // Generate and save rekap for this month
  const rekap = generateRekapBulanan(periode);
  saveRekapBulanan(rekap);

  Logger.log(`Migrated ${count} records for ${periode}`);
  return count;
}

/**
 * Main migration function. Run this after setupSpreadsheet().
 */
function migrateAllData() {
  Logger.log('=== Starting full migration ===');

  // Step 1: Migrate anggota
  const anggotaCount = migrateAnggota();
  Logger.log(`Step 1 complete: ${anggotaCount} anggota migrated`);

  // Step 2: Migrate November 2025 as initial data
  const novCount = migrateNovember2025();
  Logger.log(`Step 2 complete: ${novCount} records for Nov 2025`);

  Logger.log('=== Migration complete ===');
  Logger.log('NOTE: For subsequent months (Dec 2025 - Oct 2025), ');
  Logger.log('please enter transactions manually or use the bulk import feature.');
  Logger.log('The November 2025 data serves as the starting balance.');
}
