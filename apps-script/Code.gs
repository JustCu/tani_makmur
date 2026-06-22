/**
 * Code.gs — Main entry point, HTTP router, and CORS handler
 * for Kelompok Tani Makmur Simpan Pinjam API.
 *
 * Deploy as: Web App → Execute as Me → Anyone can access
 */

// ============================================================
// HTTP Handlers
// ============================================================

/**
 * Handles GET requests.
 * @param {Object} e - Event object with parameter/parameters
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      // ---- Anggota ----
      case 'getAnggota':
        return successResponse(getAllAnggota());
      case 'getActiveAnggota':
        return successResponse(getActiveAnggota());
      case 'getAnggotaById':
        return successResponse(getAnggotaById(e.parameter.id));
      case 'searchAnggota':
        return successResponse(searchAnggota(e.parameter.q));
      case 'getAnggotaDetail':
        return successResponse(getAnggotaDetail(e.parameter.id));

      // ---- Transaksi ----
      case 'getTransaksi':
        return successResponse(getTransaksiFiltered({
          anggota_id: e.parameter.anggota_id,
          periode: e.parameter.periode,
          tipe: e.parameter.tipe,
        }));
      case 'getRecentTransaksi':
        return successResponse(getRecentTransaksi(parseInt(e.parameter.limit) || 10));

      // ---- Pinjaman / Saldo ----
      case 'getSaldo':
        return successResponse(getSaldoAnggota(e.parameter.anggota_id));
      case 'getAllSaldo':
        return successResponse(getAllSaldo());

      // ---- Rekap & Laporan ----
      case 'getRekapBulanan':
        const rekapBulanan = generateRekapBulanan(e.parameter.periode);
        saveRekapBulanan(rekapBulanan);
        return successResponse(rekapBulanan);
      case 'generateRekap':
        const rekap = generateRekapBulanan(e.parameter.periode);
        saveRekapBulanan(rekap);
        return successResponse(rekap);
      case 'getPeriodes':
        return successResponse(getAvailablePeriodes());
      case 'getMonthlyTrend':
        return successResponse(getMonthlyTrend());

      // ---- Dashboard ----
      case 'getDashboard':
        return successResponse({
          stats: getDashboardStats(),
          topBorrowers: getTopBorrowers(5),
          recentTransaksi: getRecentTransaksi(5),
        });

      // ---- Config ----
      case 'getConfig':
        return successResponse(getAllConfig());
      case 'cleanupPeriodes':
        return successResponse(cleanupSpreadsheetPeriodes());
      case 'clearAllTransaksi':
        return successResponse(clearAllTransaksi());

      // ---- User ----
      case 'getUsers':
        return successResponse(getAllUsers());

      default:
        return errorResponse(`Action tidak dikenal: ${action}`, 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

/**
 * Handles POST requests.
 * @param {Object} e - Event object with postData
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      // ---- Anggota ----
      case 'createAnggota':
        return successResponse(createAnggota(body.data), 'Anggota berhasil ditambahkan');
      case 'updateAnggota':
        return successResponse(updateAnggota(body.data.id, body.data), 'Anggota berhasil diupdate');
      case 'deleteAnggota':
        return successResponse(deleteAnggota(body.data.id), 'Anggota berhasil dinonaktifkan');

      // ---- Transaksi ----
      case 'createTransaksi':
        return successResponse(createTransaksi(body.data), 'Transaksi berhasil dicatat');
      case 'deleteTransaksi':
        return successResponse(deleteTransaksi(body.data.id), 'Transaksi berhasil dihapus');

      // ---- Batch Operations ----
      case 'batchCreateAnggota':
        const results = [];
        for (const item of body.data) {
          try {
            results.push({ success: true, data: createAnggota(item) });
          } catch (err) {
            results.push({ success: false, error: err.message, data: item });
          }
        }
        return successResponse(results, 'Batch create completed');

      case 'batchCreateTransaksi':
        const txResults = [];
        for (const item of body.data) {
          try {
            txResults.push({ success: true, data: createTransaksi(item) });
          } catch (err) {
            txResults.push({ success: false, error: err.message, data: item });
          }
        }
        return successResponse(txResults, 'Batch transaksi completed');

      // ---- Config ----
      case 'setConfig':
        setConfig(body.data.key, body.data.value);
        return successResponse(null, 'Config berhasil disimpan');

      // ---- User ----
      case 'loginUser':
        return successResponse(loginUser(body.data.username, body.data.password));
      case 'registerUser':
        return successResponse(registerUser(body.data), 'Pengguna berhasil didaftarkan');
      case 'deleteUser':
        return successResponse(deleteUser(body.data.id), 'Pengguna berhasil dihapus');

      // ---- Init ----
      case 'initSheets':
        initUserSheet();
        initAnggotaSheet();
        initTransaksiSheet();
        initRekapSheet();
        return successResponse(null, 'Semua sheet berhasil diinisialisasi');

      default:
        return errorResponse(`Action tidak dikenal: ${action}`, 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

// ============================================================
// Sheet Initialization (run once manually)
// ============================================================

/**
 * Run this function once to set up all required sheets and initial config.
 */
function setupSpreadsheet() {
  // Initialize all sheets
  initAnggotaSheet();
  initTransaksiSheet();
  initRekapSheet();

  // Set default config
  const configSheet = getSheet(SHEET_NAMES.CONFIG);
  const existingConfig = configSheet.getDataRange().getValues();

  const defaults = [
    ['bunga_persen', BUNGA_PERSEN],
    ['nama_kelompok', 'Kelompok Tani Makmur'],
    ['alamat', 'Katemas'],
    ['ketua', 'Amnan'],
    ['bendahara', 'Sri Mulyani'],
    ['tahun_buku', '2025-2026'],
  ];

  // Only add if config sheet is empty or has just headers
  if (existingConfig.length <= 1) {
    configSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

    for (const [key, value] of defaults) {
      configSheet.appendRow([key, value]);
    }
  }

  Logger.log('Setup complete! All sheets initialized.');
}
