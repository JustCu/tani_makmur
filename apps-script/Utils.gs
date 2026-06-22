/**
 * Utils.gs — Utility functions for Tani Makmur Simpan Pinjam
 * Provides ID generation, date formatting, validation, and response builders.
 */

// ============================================================
// Constants
// ============================================================

const SPREADSHEET_ID = ''; // <-- Isi dengan ID Google Spreadsheet Anda
const SHEET_NAMES = {
  ANGGOTA: 'master_anggota',
  TRANSAKSI: 'transaksi',
  REKAP: 'rekap_bulanan',
  CONFIG: 'config',
  USER: 'master_user',
};

const TIPE_TRANSAKSI = {
  PINJAM: 'PINJAM',
  BAYAR_POKOK: 'BAYAR_POKOK',
  BAYAR_BUNGA: 'BAYAR_BUNGA',
  HUTANG_BUNGA: 'HUTANG_BUNGA',
  BAYAR_HUTANG_BUNGA: 'BAYAR_HUTANG_BUNGA',
};

const BUNGA_PERSEN = 3; // 3% flat per bulan

// ============================================================
// Spreadsheet Access
// ============================================================

/**
 * Gets the main spreadsheet instance.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Gets a sheet by name, creating it if it doesn't exist.
 * @param {string} sheetName
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

// ============================================================
// ID Generation
// ============================================================

/**
 * Generates a unique ID with a prefix.
 * @param {string} prefix - e.g., 'A', 'T', 'R'
 * @returns {string} - e.g., 'A001', 'T00042'
 */
function generateId(prefix) {
  const sheet = getSheet(SHEET_NAMES.CONFIG);
  const counterKey = `counter_${prefix}`;

  const data = sheet.getDataRange().getValues();
  let currentCount = 0;
  let rowIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === counterKey) {
      currentCount = parseInt(data[i][1]) || 0;
      rowIndex = i + 1;
      break;
    }
  }

  currentCount++;

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 2).setValue(currentCount);
  } else {
    sheet.appendRow([counterKey, currentCount]);
  }

  return `${prefix}${String(currentCount).padStart(4, '0')}`;
}

// ============================================================
// Date Formatting
// ============================================================

/**
 * Formats a Date object to 'YYYY-MM-DD' string.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Gets the periode string 'YYYY-MM' from a Date.
 * @param {Date} date
 * @returns {string}
 */
function getPeriode(date) {
  if (!date) return '';
  if (!(date instanceof Date)) {
    // If it's already in YYYY-MM format, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}$/.test(date)) {
      return date;
    }
    date = new Date(date);
  }
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns current periode string.
 * @returns {string}
 */
function getCurrentPeriode() {
  return getPeriode(new Date());
}

// ============================================================
// Validation
// ============================================================

/**
 * Validates required fields in a data object.
 * @param {Object} data
 * @param {string[]} requiredFields
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateRequired(data, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates that a value is a positive number.
 * @param {*} value
 * @returns {boolean}
 */
function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

// ============================================================
// Response Builders
// ============================================================

/**
 * Creates a success JSON response.
 * @param {*} data
 * @param {string} [message]
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function successResponse(data, message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      data: data,
      message: message || 'OK',
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates an error JSON response.
 * @param {string} message
 * @param {number} [code]
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function errorResponse(message, code) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      error: message,
      code: code || 400,
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Data Helpers
// ============================================================

/**
 * Converts a 2D array (with header row) to an array of objects.
 * @param {Array[]} data - 2D array where first row is headers
 * @returns {Object[]}
 */
function arrayToObjects(data) {
  if (data.length < 2) return [];
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

/**
 * Finds a row index by matching a column value.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} colIndex - 0-based column index
 * @param {*} value
 * @returns {number} - 1-based row index, or -1 if not found
 */
function findRowByColumn(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) {
      return i + 1; // 1-based
    }
  }
  return -1;
}

/**
 * Utility function to clean up and normalize 'periode' column values in Google Spreadsheet sheets to simple YYYY-MM text format.
 * This prevents Google Sheets from parsing them into Date objects and creating date-time format inconsistencies.
 * @returns {Object}
 */
function cleanupSpreadsheetPeriodes() {
  const sheets = [SHEET_NAMES.TRANSAKSI, SHEET_NAMES.REKAP];
  let totalFixed = 0;
  
  for (const name of sheets) {
    const sheet = getSheet(name);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    
    // Find the 'periode' column index
    const headers = data[0];
    const colIndex = headers.indexOf('periode');
    if (colIndex === -1) continue;
    
    for (let i = 1; i < data.length; i++) {
      const val = data[i][colIndex];
      if (val) {
        const norm = getPeriode(val);
        if (norm && (typeof val !== 'string' || val !== norm)) {
          // Force string formatting in Google Sheets using a single quote prefix
          sheet.getRange(i + 1, colIndex + 1).setValue("'" + norm);
          totalFixed++;
        }
      }
    }
  }
  
  return { success: true, total_fixed: totalFixed };
}
