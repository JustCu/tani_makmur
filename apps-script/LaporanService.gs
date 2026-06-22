/**
 * LaporanService.gs — Report generation and summary statistics
 * Single Responsibility: Aggregate data for dashboard and reports
 */

/**
 * Gets dashboard summary statistics.
 * @returns {Object}
 */
function getDashboardStats() {
  const anggotaList = getActiveAnggota();
  const allSaldo = getAllSaldo();

  const totalPinjaman = allSaldo.reduce((sum, s) => sum + s.pokok, 0);
  const totalHutangBunga = allSaldo.reduce((sum, s) => sum + s.hutang_bunga, 0);
  const totalBunga = allSaldo.reduce((sum, s) => sum + s.bunga, 0);
  const totalJumlah = allSaldo.reduce((sum, s) => sum + s.jumlah, 0);

  return {
    total_anggota: anggotaList.length,
    total_pinjaman: totalPinjaman,
    total_hutang_bunga: totalHutangBunga,
    total_bunga_bulan_ini: totalBunga,
    total_jumlah: totalJumlah,
  };
}

/**
 * Gets top N borrowers by loan amount.
 * @param {number} limit
 * @returns {Object[]}
 */
function getTopBorrowers(limit) {
  const allSaldo = getAllSaldo();
  return allSaldo
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, limit || 5);
}

/**
 * Gets monthly trend data across all available periodes.
 * @returns {Object[]} - [{ periode, total_pokok, total_jumlah }]
 */
function getMonthlyTrend() {
  const periodes = getAvailablePeriodes();
  const trend = [];

  for (const periode of periodes) {
    const rekap = getSavedRekap(periode);
    trend.push({
      periode: periode,
      total_pokok: rekap.totals.pokok,
      total_bunga: rekap.totals.bunga,
      total_hutang_bunga_plus: rekap.totals.hutang_bunga_plus,
      total_jumlah: rekap.totals.jumlah,
      jumlah_anggota: rekap.items.filter(i => i.pokok > 0).length,
    });
  }

  return trend;
}

/**
 * Gets anggota detail with full transaction history and current balance.
 * @param {string} anggotaId
 * @returns {Object}
 */
function getAnggotaDetail(anggotaId) {
  const anggota = getAnggotaById(anggotaId);
  if (!anggota) {
    throw new Error(`Anggota dengan ID "${anggotaId}" tidak ditemukan`);
  }

  const rawTransaksi = getTransaksiByAnggota(anggotaId);
  const transaksi = rawTransaksi.map(t => ({
    ...t,
    nama: anggota.nama,
    created_by: t.created_by || 'migrasi',
    updated_by: t.updated_by || t.created_by || 'migrasi'
  }));
  const saldo = getSaldoAnggota(anggotaId);

  // Group transactions by periode
  const transaksiByPeriode = {};
  for (const t of transaksi) {
    if (!transaksiByPeriode[t.periode]) {
      transaksiByPeriode[t.periode] = [];
    }
    transaksiByPeriode[t.periode].push(t);
  }

  return {
    anggota: anggota,
    saldo: saldo,
    transaksi: transaksi,
    transaksi_by_periode: transaksiByPeriode,
    total_transaksi: transaksi.length,
  };
}

/**
 * Gets yearly summary.
 * @param {string} tahun - 'YYYY'
 * @returns {Object}
 */
function getRingkasanTahunan(tahun) {
  const periodes = getAvailablePeriodes()
    .filter(p => p.startsWith(tahun));

  const monthly = [];
  for (const periode of periodes) {
    const rekap = getSavedRekap(periode);
    monthly.push({
      periode: periode,
      ...rekap.totals,
      jumlah_peminjam: rekap.items.filter(i => i.pokok > 0).length,
    });
  }

  return {
    tahun: tahun,
    periodes: periodes,
    monthly: monthly,
  };
}

/**
 * Gets the config value.
 * @param {string} key
 * @returns {*}
 */
function getConfig(key) {
  const sheet = getSheet(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (const row of data) {
    if (row[0] === key) return row[1];
  }
  return null;
}

/**
 * Sets a config value.
 * @param {string} key
 * @param {*} value
 */
function setConfig(key, value) {
  const sheet = getSheet(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

/**
 * Gets all config values.
 * @returns {Object}
 */
function getAllConfig() {
  const sheet = getSheet(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (const row of data) {
    if (row[0] && !String(row[0]).startsWith('counter_')) {
      config[row[0]] = row[1];
    }
  }
  return config;
}
