// ============================================================
// Formatters — Number, currency, date formatting utilities
// ============================================================

import { BULAN_NAMES, TIPE_TRANSAKSI_LABELS } from './constants';

/**
 * Formats a number as Indonesian Rupiah currency.
 * @param {number} amount
 * @returns {string} e.g., "Rp 13.500.000"
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  
  const formatted = Math.abs(amount).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Formats a number with thousand separators.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
}

/**
 * Formats a date string to Indonesian locale.
 * @param {string|Date} dateStr - 'YYYY-MM-DD' or Date object
 * @returns {string} e.g., "21 Juni 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  
  // If it's a Date object, convert to YYYY-MM-DD string first
  let targetStr = dateStr;
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const d = String(dateStr.getDate()).padStart(2, '0');
    targetStr = `${y}-${m}-${d}`;
  }
  
  if (typeof targetStr === 'string') {
    // Try parsing 'YYYY-MM-DD' literally to avoid timezone shifts
    const match = targetStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      const monthIndex = parseInt(month) - 1;
      const monthName = BULAN_NAMES[monthIndex] || '';
      return `${parseInt(day)} ${monthName} ${year}`;
    }
  }

  // Fallback to standard JS parsing
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const day = date.getDate();
  const month = BULAN_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a periode string to readable format.
 * @param {string|Date} periode - 'YYYY-MM' or Date object
 * @returns {string} e.g., "November 2025"
 */
export function formatPeriode(periode) {
  if (!periode) return '-';
  
  let targetPeriode = periode;
  if (periode instanceof Date) {
    const y = periode.getFullYear();
    const m = String(periode.getMonth() + 1).padStart(2, '0');
    targetPeriode = `${y}-${m}`;
  }
  
  if (typeof targetPeriode === 'string') {
    // Try split first if 'YYYY-MM'
    const parts = targetPeriode.split('-');
    if (parts.length >= 2) {
      const [year, month] = parts;
      const monthIndex = parseInt(month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${BULAN_NAMES[monthIndex]} ${year}`;
      }
    }
    
    // Check if it's a full Date string (e.g. Sat Nov 01...)
    const parsedDate = new Date(targetPeriode);
    if (!isNaN(parsedDate.getTime())) {
      const y = parsedDate.getTime() ? parsedDate.getFullYear() : '';
      const monthName = BULAN_NAMES[parsedDate.getMonth()] || '';
      return `${monthName} ${y}`.trim();
    }
  }
  
  return String(periode);
}

/**
 * Gets the transaction type label.
 * @param {string} tipe
 * @returns {string}
 */
export function formatTipeTransaksi(tipe) {
  return TIPE_TRANSAKSI_LABELS[tipe] || tipe;
}

/**
 * Formats a percentage.
 * @param {number} value
 * @returns {string}
 */
export function formatPersen(value) {
  return `${value}%`;
}

/**
 * Returns initials from a name (max 2 chars).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns current periode string 'YYYY-MM'.
 * @returns {string}
 */
export function getCurrentPeriode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Generates list of periodes from start to end.
 * @param {string} start - 'YYYY-MM'
 * @param {string} end - 'YYYY-MM'
 * @returns {string[]}
 */
export function generatePeriodes(start, end) {
  const periodes = [];
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    periodes.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  
  return periodes;
}
