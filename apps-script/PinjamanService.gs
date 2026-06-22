/**
 * PinjamanService.gs — Loan calculation and balance management
 * Single Responsibility: Business logic for loan calculations
 */

// ============================================================
// Header definition for rekap_bulanan sheet
// ============================================================
const REKAP_HEADERS = [
  'anggota_id', 'nama', 'periode', 'pokok', 'bunga',
  'hutang_pokok_plus', 'hutang_pokok_minus',
  'hutang_bunga_plus', 'hutang_bunga_minus',
  'jumlah'
];

/**
 * Ensures the rekap sheet has proper headers.
 */
function initRekapSheet() {
  const sheet = getSheet(SHEET_NAMES.REKAP);
  const firstRow = sheet.getRange(1, 1, 1, REKAP_HEADERS.length).getValues()[0];
  if (firstRow[0] !== REKAP_HEADERS[0]) {
    sheet.getRange(1, 1, 1, REKAP_HEADERS.length).setValues([REKAP_HEADERS]);
    sheet.getRange(1, 1, 1, REKAP_HEADERS.length).setFontWeight('bold');
  }
}

/**
 * Calculates the current balance (saldo) for an anggota.
 * Follows the exact business rules from the Excel:
 * - Bunga = 3% x Pokok (flat rate)
 * - Hutang bunga accumulates if not paid
 * - Jumlah = Pokok + accumulated unpaid interest
 *
 * @param {string} anggotaId
 * @returns {Object} - { pokok, bunga, hutang_bunga, jumlah }
 */
function getSaldoAnggota(anggotaId, optionalTransaksiList) {
  const transaksi = optionalTransaksiList || getTransaksiByAnggota(anggotaId);

  let pokok = 0;
  let totalHutangBunga = 0;

  for (const t of transaksi) {
    const jumlah = parseFloat(t.jumlah) || 0;

    switch (t.tipe) {
      case TIPE_TRANSAKSI.PINJAM:
        pokok += jumlah;
        break;
      case TIPE_TRANSAKSI.BAYAR_POKOK:
        pokok -= jumlah;
        break;
      case TIPE_TRANSAKSI.HUTANG_BUNGA:
        totalHutangBunga += jumlah;
        break;
      case TIPE_TRANSAKSI.BAYAR_HUTANG_BUNGA:
        totalHutangBunga -= jumlah;
        break;
      // BAYAR_BUNGA doesn't affect saldo (paid on time)
    }
  }

  const bunga = pokok * (BUNGA_PERSEN / 100);
  const jumlah = pokok + totalHutangBunga;

  return {
    anggota_id: anggotaId,
    pokok: Math.max(0, pokok),
    bunga: Math.max(0, bunga),
    hutang_bunga: Math.max(0, totalHutangBunga),
    jumlah: Math.max(0, jumlah),
  };
}

/**
 * Gets saldo for all active anggota.
 * @returns {Object[]}
 */
function getAllSaldo() {
  const anggotaList = getActiveAnggota();
  const allTransaksi = getAllTransaksi();

  // Group by anggota_id
  const txByAnggota = {};
  for (const t of allTransaksi) {
    if (!txByAnggota[t.anggota_id]) {
      txByAnggota[t.anggota_id] = [];
    }
    txByAnggota[t.anggota_id].push(t);
  }

  return anggotaList.map(a => {
    const memberTx = txByAnggota[a.id] || [];
    const saldo = getSaldoAnggota(a.id, memberTx);
    return {
      ...saldo,
      nama: a.nama,
    };
  });
}

/**
 * Generates monthly recap for all anggota for a given periode.
 * This replicates the Excel DEBET format.
 *
 * @param {string} periode - 'YYYY-MM'
 * @returns {Object} - { periode, items[], totals }
 */
function generateRekapBulanan(periode) {
  const anggotaList = getActiveAnggota();
  const allTransaksi = getAllTransaksi();

  // Group by anggota_id
  const txByAnggota = {};
  for (const t of allTransaksi) {
    if (!txByAnggota[t.anggota_id]) {
      txByAnggota[t.anggota_id] = [];
    }
    txByAnggota[t.anggota_id].push(t);
  }

  const items = [];
  let totalPokok = 0;
  let totalBunga = 0;
  let totalHutangPokokPlus = 0;
  let totalHutangPokokMinus = 0;
  let totalHutangBungaPlus = 0;
  let totalHutangBungaMinus = 0;
  let totalJumlah = 0;

  for (const anggota of anggotaList) {
    const memberTx = txByAnggota[anggota.id] || [];
    const txBeforeMonth = memberTx.filter(t => getPeriode(t.periode) < periode);
    const txInMonth = memberTx.filter(t => getPeriode(t.periode) === periode);

    // Calculate starting pokok
    let startingPokok = 0;
    if (periode === '2025-11') {
      // November 2025 starting balance
      const startingTx = txInMonth.filter(t => t.keterangan && t.keterangan.toLowerCase().indexOf('saldo awal') !== -1);
      for (const t of startingTx) {
        if (t.tipe === TIPE_TRANSAKSI.PINJAM) {
          startingPokok += parseFloat(t.jumlah) || 0;
        }
      }
    } else {
      // Ending balance of the previous month
      for (const t of txBeforeMonth) {
        const jumlah = parseFloat(t.jumlah) || 0;
        switch (t.tipe) {
          case TIPE_TRANSAKSI.PINJAM:
          case TIPE_TRANSAKSI.HUTANG_BUNGA:
            startingPokok += jumlah;
            break;
          case TIPE_TRANSAKSI.BAYAR_POKOK:
          case TIPE_TRANSAKSI.BAYAR_HUTANG_BUNGA:
            startingPokok -= jumlah;
            break;
        }
      }
    }

    // Calculate this month's transactions
    let hutangPokokPlus = 0;
    let hutangPokokMinus = 0;
    let hutangBungaPlus = 0;
    let hutangBungaMinus = 0;

    for (const t of txInMonth) {
      // Exclude starting balance transactions from active columns
      if (t.keterangan && t.keterangan.toLowerCase().indexOf('saldo awal') !== -1) {
        continue;
      }
      const jumlah = parseFloat(t.jumlah) || 0;
      switch (t.tipe) {
        case TIPE_TRANSAKSI.PINJAM:
          hutangPokokPlus += jumlah;
          break;
        case TIPE_TRANSAKSI.BAYAR_POKOK:
          hutangPokokMinus += jumlah;
          break;
        case TIPE_TRANSAKSI.HUTANG_BUNGA:
          hutangBungaPlus += jumlah;
          break;
        case TIPE_TRANSAKSI.BAYAR_HUTANG_BUNGA:
          hutangBungaMinus += jumlah;
          break;
      }
    }

    const bunga = startingPokok * (BUNGA_PERSEN / 100);
    const jumlah = startingPokok + hutangPokokPlus - hutangPokokMinus + hutangBungaPlus - hutangBungaMinus;

    const item = {
      anggota_id: anggota.id,
      nama: anggota.nama,
      pokok: Math.max(0, startingPokok),
      bunga: Math.max(0, bunga),
      hutang_pokok_plus: hutangPokokPlus,
      hutang_pokok_minus: hutangPokokMinus,
      hutang_bunga_plus: hutangBungaPlus,
      hutang_bunga_minus: hutangBungaMinus,
      jumlah: Math.max(0, jumlah),
    };

    items.push(item);

    // Accumulate totals
    totalPokok += item.pokok;
    totalBunga += item.bunga;
    totalHutangPokokPlus += item.hutang_pokok_plus;
    totalHutangPokokMinus += item.hutang_pokok_minus;
    totalHutangBungaPlus += item.hutang_bunga_plus;
    totalHutangBungaMinus += item.hutang_bunga_minus;
    totalJumlah += item.jumlah;
  }

  return {
    periode: periode,
    items: items,
    totals: {
      pokok: totalPokok,
      bunga: totalBunga,
      hutang_pokok_plus: totalHutangPokokPlus,
      hutang_pokok_minus: totalHutangPokokMinus,
      hutang_bunga_plus: totalHutangBungaPlus,
      hutang_bunga_minus: totalHutangBungaMinus,
      jumlah: totalJumlah,
    },
  };
}

/**
 * Saves a generated rekap to the rekap_bulanan sheet.
 * @param {Object} rekap - Result from generateRekapBulanan
 */
function saveRekapBulanan(rekap) {
  initRekapSheet();
  const sheet = getSheet(SHEET_NAMES.REKAP);

  // Remove existing entries for this periode
  const data = sheet.getDataRange().getValues();
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (getPeriode(data[i][2]) === rekap.periode) {
      rowsToDelete.push(i + 1);
    }
  }
  // Delete from bottom to top to preserve row indices
  for (const row of rowsToDelete) {
    sheet.deleteRow(row);
  }

  // Append new entries
  for (const item of rekap.items) {
    sheet.appendRow([
      item.anggota_id,
      item.nama,
      "'" + rekap.periode,
      item.pokok,
      item.bunga,
      item.hutang_pokok_plus,
      item.hutang_pokok_minus,
      item.hutang_bunga_plus,
      item.hutang_bunga_minus,
      item.jumlah,
    ]);
  }
}

/**
 * Gets the list of available periodes that have rekap data.
 * @returns {string[]}
 */
function getAvailablePeriodes() {
  const allTransaksi = getAllTransaksi();
  const periodes = new Set();

  for (const t of allTransaksi) {
    if (t.periode) {
      periodes.add(getPeriode(t.periode));
    }
  }

  // Fallback to current month if no transactions exist yet
  if (periodes.size === 0) {
    periodes.add(getPeriode(new Date()));
  }

  return Array.from(periodes).sort();
}

/**
 * Gets saved rekap for a specific periode.
 * @param {string} periode
 * @returns {Object} - { periode, items[], totals }
 */
function getSavedRekap(periode) {
  initRekapSheet();
  const sheet = getSheet(SHEET_NAMES.REKAP);
  const data = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    if (getPeriode(data[i][2]) === periode) {
      items.push({
        anggota_id: data[i][0],
        nama: data[i][1],
        pokok: parseFloat(data[i][3]) || 0,
        bunga: parseFloat(data[i][4]) || 0,
        hutang_pokok_plus: parseFloat(data[i][5]) || 0,
        hutang_pokok_minus: parseFloat(data[i][6]) || 0,
        hutang_bunga_plus: parseFloat(data[i][7]) || 0,
        hutang_bunga_minus: parseFloat(data[i][8]) || 0,
        jumlah: parseFloat(data[i][9]) || 0,
      });
    }
  }

  // Calculate totals
  const totals = items.reduce((acc, item) => ({
    pokok: acc.pokok + item.pokok,
    bunga: acc.bunga + item.bunga,
    hutang_pokok_plus: acc.hutang_pokok_plus + item.hutang_pokok_plus,
    hutang_pokok_minus: acc.hutang_pokok_minus + item.hutang_pokok_minus,
    hutang_bunga_plus: acc.hutang_bunga_plus + item.hutang_bunga_plus,
    hutang_bunga_minus: acc.hutang_bunga_minus + item.hutang_bunga_minus,
    jumlah: acc.jumlah + item.jumlah,
  }), {
    pokok: 0, bunga: 0, hutang_pokok_plus: 0, hutang_pokok_minus: 0,
    hutang_bunga_plus: 0, hutang_bunga_minus: 0, jumlah: 0,
  });

  return { periode, items, totals };
}
