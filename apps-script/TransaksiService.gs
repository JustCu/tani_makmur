/**
 * TransaksiService.gs — Transaction recording and retrieval
 * Single Responsibility: Only handles transaction data operations
 */

// ============================================================
// Header definition for transaksi sheet
// ============================================================
const TRANSAKSI_HEADERS = ['id', 'anggota_id', 'tanggal', 'periode', 'tipe', 'jumlah', 'keterangan', 'created_by', 'updated_by'];

/**
 * Ensures the transaksi sheet has proper headers.
 */
function initTransaksiSheet() {
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const lastCol = sheet.getLastColumn();
  
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, TRANSAKSI_HEADERS.length).setValues([TRANSAKSI_HEADERS]);
    sheet.getRange(1, 1, 1, TRANSAKSI_HEADERS.length).setFontWeight('bold');
    return;
  }
  
  const firstRow = sheet.getRange(1, 1, 1, Math.max(lastCol, TRANSAKSI_HEADERS.length)).getValues()[0];
  if (firstRow[0] !== TRANSAKSI_HEADERS[0] || lastCol < TRANSAKSI_HEADERS.length) {
    sheet.getRange(1, 1, 1, TRANSAKSI_HEADERS.length).setValues([TRANSAKSI_HEADERS]);
    sheet.getRange(1, 1, 1, TRANSAKSI_HEADERS.length).setFontWeight('bold');
  }
}

/**
 * Creates a new transaction.
 * @param {Object} data - { anggota_id, tanggal?, tipe, jumlah, keterangan? }
 * @returns {Object} - The created transaction
 */
function createTransaksi(data) {
  const validation = validateRequired(data, ['anggota_id', 'tipe', 'jumlah']);
  if (!validation.valid) {
    throw new Error(`Field wajib belum diisi: ${validation.missing.join(', ')}`);
  }

  // Validate tipe
  const validTypes = Object.values(TIPE_TRANSAKSI);
  if (!validTypes.includes(data.tipe)) {
    throw new Error(`Tipe transaksi tidak valid: ${data.tipe}. Gunakan: ${validTypes.join(', ')}`);
  }

  // Validate jumlah
  if (!isPositiveNumber(data.jumlah)) {
    throw new Error('Jumlah harus berupa angka positif');
  }

  // Validate anggota exists
  const anggota = getAnggotaById(data.anggota_id);
  if (!anggota) {
    throw new Error(`Anggota dengan ID "${data.anggota_id}" tidak ditemukan`);
  }

  initTransaksiSheet();
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const id = generateId('T');
  const tanggal = data.tanggal || formatDate(new Date());
  const periode = getPeriode(new Date(tanggal));

  const newTransaksi = {
    id: id,
    anggota_id: data.anggota_id,
    tanggal: tanggal,
    periode: periode,
    tipe: data.tipe,
    jumlah: parseFloat(data.jumlah),
    keterangan: data.keterangan || '',
    created_by: data.created_by || 'system',
    updated_by: data.updated_by || data.created_by || 'system',
  };

  sheet.appendRow([
    newTransaksi.id,
    newTransaksi.anggota_id,
    newTransaksi.tanggal,
    "'" + newTransaksi.periode,
    newTransaksi.tipe,
    newTransaksi.jumlah,
    newTransaksi.keterangan,
    newTransaksi.created_by,
    newTransaksi.updated_by,
  ]);

  return newTransaksi;
}

/**
 * Gets all transactions.
 * @returns {Object[]}
 */
function getAllTransaksi() {
  initTransaksiSheet();
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const data = sheet.getDataRange().getValues();
  return arrayToObjects(data).filter(t => t.id !== '');
}

/**
 * Gets transactions by anggota ID.
 * @param {string} anggotaId
 * @returns {Object[]}
 */
function getTransaksiByAnggota(anggotaId) {
  return getAllTransaksi().filter(t => t.anggota_id === anggotaId);
}

/**
 * Gets transactions by periode (YYYY-MM).
 * @param {string} periode
 * @returns {Object[]}
 */
function getTransaksiByPeriode(periode) {
  return getAllTransaksi().filter(t => t.periode === periode);
}

/**
 * Gets transactions by type.
 * @param {string} tipe
 * @returns {Object[]}
 */
function getTransaksiByTipe(tipe) {
  return getAllTransaksi().filter(t => t.tipe === tipe);
}

/**
 * Gets transactions filtered by multiple criteria.
 * @param {Object} filters - { anggota_id?, periode?, tipe? }
 * @returns {Object[]}
 */
function getTransaksiFiltered(filters) {
  let result = getAllTransaksi();

  if (filters.anggota_id) {
    result = result.filter(t => t.anggota_id === filters.anggota_id);
  }
  if (filters.periode) {
    result = result.filter(t => t.periode === filters.periode);
  }
  if (filters.tipe) {
    result = result.filter(t => t.tipe === filters.tipe);
  }

  const anggotaMap = getAnggotaMap();
  return result.map(t => enrichTransaksi(t, anggotaMap));
}

/**
 * Gets recent transactions (latest N).
 * @param {number} limit
 * @returns {Object[]}
 */
function getRecentTransaksi(limit) {
  const all = getAllTransaksi();
  const recent = all.slice(-limit).reverse();
  const anggotaMap = getAnggotaMap();
  return recent.map(t => enrichTransaksi(t, anggotaMap));
}

/**
 * Helper to map anggota IDs to their object records for quick lookups.
 * @returns {Object}
 */
function getAnggotaMap() {
  const anggotaList = getAllAnggota();
  const map = {};
  for (const a of anggotaList) {
    map[a.id] = a;
  }
  return map;
}

/**
 * Enriches a raw transaction object with the member's name and audit trail fields.
 * @param {Object} tx
 * @param {Object} anggotaMap
 * @returns {Object}
 */
function enrichTransaksi(tx, anggotaMap) {
  const anggota = anggotaMap[tx.anggota_id] || {};
  return {
    ...tx,
    nama: anggota.nama || 'Anggota Tidak Dikenal',
    created_by: tx.created_by || 'migrasi',
    updated_by: tx.updated_by || tx.created_by || 'migrasi'
  };
}

/**
 * Deletes a transaction by ID.
 * @param {string} id
 * @returns {boolean}
 */
function deleteTransaksi(id) {
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const rowIndex = findRowByColumn(sheet, 0, id);
  if (rowIndex === -1) {
    throw new Error(`Transaksi dengan ID "${id}" tidak ditemukan`);
  }
  sheet.deleteRow(rowIndex);
  return true;
}

/**
 * Clears all transactions from the transaksi sheet, leaving only the header row.
 * @returns {Object}
 */
function clearAllTransaksi() {
  initTransaksiSheet();
  const sheet = getSheet(SHEET_NAMES.TRANSAKSI);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return { success: true };
}
