/**
 * AnggotaService.gs — CRUD operations for member (anggota) management
 * Single Responsibility: Only handles member data operations
 */

// ============================================================
// Header definition for master_anggota sheet
// ============================================================
const ANGGOTA_HEADERS = ['id', 'nama', 'status', 'tanggal_daftar', 'catatan'];

/**
 * Ensures the anggota sheet has proper headers.
 */
function initAnggotaSheet() {
  const sheet = getSheet(SHEET_NAMES.ANGGOTA);
  const firstRow = sheet.getRange(1, 1, 1, ANGGOTA_HEADERS.length).getValues()[0];
  if (firstRow[0] !== ANGGOTA_HEADERS[0]) {
    sheet.getRange(1, 1, 1, ANGGOTA_HEADERS.length).setValues([ANGGOTA_HEADERS]);
    sheet.getRange(1, 1, 1, ANGGOTA_HEADERS.length).setFontWeight('bold');
  }
}

/**
 * Gets all anggota records.
 * @returns {Object[]}
 */
function getAllAnggota() {
  initAnggotaSheet();
  const sheet = getSheet(SHEET_NAMES.ANGGOTA);
  const data = sheet.getDataRange().getValues();
  return arrayToObjects(data).filter(a => a.id !== '');
}

/**
 * Gets active anggota only (status = 'aktif').
 * @returns {Object[]}
 */
function getActiveAnggota() {
  return getAllAnggota().filter(a => a.status === 'aktif');
}

/**
 * Gets a single anggota by ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getAnggotaById(id) {
  const all = getAllAnggota();
  return all.find(a => a.id === id) || null;
}

/**
 * Creates a new anggota record.
 * @param {Object} data - { nama, catatan? }
 * @returns {Object} - The created anggota
 */
function createAnggota(data) {
  const validation = validateRequired(data, ['nama']);
  if (!validation.valid) {
    throw new Error(`Field wajib belum diisi: ${validation.missing.join(', ')}`);
  }

  // Check duplicate nama
  const existing = getAllAnggota();
  if (existing.some(a => a.nama.toLowerCase() === data.nama.toLowerCase() && a.status === 'aktif')) {
    throw new Error(`Anggota dengan nama "${data.nama}" sudah terdaftar`);
  }

  initAnggotaSheet();
  const sheet = getSheet(SHEET_NAMES.ANGGOTA);
  const id = generateId('A');
  const now = formatDate(new Date());

  const newAnggota = {
    id: id,
    nama: data.nama.trim(),
    status: 'aktif',
    tanggal_daftar: data.tanggal_daftar || now,
    catatan: data.catatan || '',
  };

  sheet.appendRow([
    newAnggota.id,
    newAnggota.nama,
    newAnggota.status,
    newAnggota.tanggal_daftar,
    newAnggota.catatan,
  ]);

  return newAnggota;
}

/**
 * Updates an existing anggota record.
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Object} - The updated anggota
 */
function updateAnggota(id, data) {
  const sheet = getSheet(SHEET_NAMES.ANGGOTA);
  const rowIndex = findRowByColumn(sheet, 0, id);

  if (rowIndex === -1) {
    throw new Error(`Anggota dengan ID "${id}" tidak ditemukan`);
  }

  const row = sheet.getRange(rowIndex, 1, 1, ANGGOTA_HEADERS.length).getValues()[0];

  // Update only provided fields
  const updated = {
    id: row[0],
    nama: data.nama !== undefined ? data.nama.trim() : row[1],
    status: data.status !== undefined ? data.status : row[2],
    tanggal_daftar: row[3],
    catatan: data.catatan !== undefined ? data.catatan : row[4],
  };

  sheet.getRange(rowIndex, 1, 1, ANGGOTA_HEADERS.length).setValues([
    [updated.id, updated.nama, updated.status, updated.tanggal_daftar, updated.catatan],
  ]);

  return updated;
}

/**
 * Soft-deletes an anggota (sets status to 'nonaktif').
 * @param {string} id
 * @returns {Object}
 */
function deleteAnggota(id) {
  return updateAnggota(id, { status: 'nonaktif' });
}

/**
 * Searches anggota by name (partial match).
 * @param {string} query
 * @returns {Object[]}
 */
function searchAnggota(query) {
  const all = getAllAnggota();
  const q = query.toLowerCase();
  return all.filter(a => a.nama.toLowerCase().includes(q));
}
