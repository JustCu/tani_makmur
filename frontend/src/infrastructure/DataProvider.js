// ============================================================
// DataProvider — Abstraction over API/Mock/Offline data sources
// Implements the Repository pattern with offline fallback
// ============================================================

import { API_BASE_URL } from '../shared/constants';
import { apiClient } from './api/ApiClient';
import { offlineDB } from './OfflineDB';
import {
  mockAnggota, mockRekapNov2025, mockPeriodes,
  mockMonthlyTrend, mockRecentTransaksi, mockDashboardStats,
  mockConfig,
} from './mock/mockData';

const USE_MOCK = !API_BASE_URL;

// ============================================================
// Network Error Helper
// ============================================================

function isNetworkError(error) {
  return (
    error instanceof TypeError ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    !navigator.onLine
  );
}

// ============================================================
// Anggota Repository
// ============================================================

export async function fetchAnggota() {
  if (USE_MOCK) return mockAnggota.filter(a => a.status === 'aktif');
  
  try {
    const data = await apiClient.get('getActiveAnggota');
    // Save copy to local cache
    await offlineDB.clear('anggota');
    await offlineDB.bulkPut('anggota', data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data anggota lokal (Offline Mode)');
      const localData = await offlineDB.getAll('anggota');
      return localData.filter(a => a.status === 'aktif');
    }
    throw error;
  }
}

export async function fetchAnggotaById(id) {
  if (USE_MOCK) return mockAnggota.find(a => a.id === id) || null;
  
  try {
    const data = await apiClient.get('getAnggotaById', { id });
    await offlineDB.put('anggota', data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data detail anggota lokal (Offline Mode)');
      return await offlineDB.getById('anggota', id);
    }
    throw error;
  }
}

export async function fetchAnggotaDetail(id) {
  if (USE_MOCK) {
    const anggota = mockAnggota.find(a => a.id === id);
    const rekapItem = mockRekapNov2025.items.find(i => i.anggota_id === id);
    return {
      anggota,
      saldo: rekapItem ? {
        pokok: rekapItem.pokok,
        bunga: rekapItem.bunga,
        hutang_bunga: rekapItem.hutang_bunga_plus - rekapItem.hutang_bunga_minus,
        jumlah: rekapItem.jumlah,
      } : { pokok: 0, bunga: 0, hutang_bunga: 0, jumlah: 0 },
      transaksi: mockRecentTransaksi.filter(t => t.anggota_id === id),
      total_transaksi: 0,
    };
  }
  
  try {
    const data = await apiClient.get('getAnggotaDetail', { id });
    // Update local cache
    if (data.anggota) await offlineDB.put('anggota', data.anggota);
    if (data.saldo) await offlineDB.put('saldo', { ...data.saldo, anggota_id: id });
    if (data.transaksi) {
      await offlineDB.bulkPut('transaksi', data.transaksi);
    }
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Membangun detail anggota lokal (Offline Mode)');
      const anggota = await offlineDB.getById('anggota', id);
      const saldo = await offlineDB.getById('saldo', id) || { pokok: 0, bunga: 0, hutang_bunga: 0, jumlah: 0 };
      const allTx = await offlineDB.getAll('transaksi');
      const tx = allTx.filter(t => t.anggota_id === id);
      
      return {
        anggota,
        saldo,
        transaksi: tx,
        total_transaksi: tx.length,
      };
    }
    throw error;
  }
}

export async function createAnggota(data) {
  if (USE_MOCK) {
    const newAnggota = {
      id: `A${String(mockAnggota.length + 1).padStart(4, '0')}`,
      nama: data.nama,
      status: 'aktif',
      tanggal_daftar: new Date().toISOString().split('T')[0],
      catatan: data.catatan || '',
    };
    mockAnggota.push(newAnggota);
    return newAnggota;
  }
  
  try {
    const response = await apiClient.post('createAnggota', data);
    await offlineDB.put('anggota', response);
    return response;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menyimpan anggota baru ke antrean sinkronisasi offline');
      // Generate temporary ID
      const tempId = 'temp_A_' + Date.now();
      const newAnggota = {
        id: tempId,
        nama: data.nama.trim(),
        status: 'aktif',
        tanggal_daftar: data.tanggal_daftar || new Date().toISOString().split('T')[0],
        catatan: data.catatan || '',
      };
      
      // Save locally
      await offlineDB.put('anggota', newAnggota);
      await offlineDB.put('saldo', {
        anggota_id: tempId,
        nama: newAnggota.nama,
        pokok: 0,
        bunga: 0,
        hutang_bunga: 0,
        jumlah: 0,
      });

      // Queue action
      await offlineDB.enqueueSync('createAnggota', newAnggota);
      return newAnggota;
    }
    throw error;
  }
}

export async function updateAnggota(id, data) {
  if (USE_MOCK) {
    const idx = mockAnggota.findIndex(a => a.id === id);
    if (idx >= 0) {
      mockAnggota[idx] = { ...mockAnggota[idx], ...data };
      return mockAnggota[idx];
    }
    throw new Error('Anggota tidak ditemukan');
  }
  
  try {
    const response = await apiClient.post('updateAnggota', { id, ...data });
    await offlineDB.put('anggota', response);
    return response;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menyimpan perubahan anggota ke antrean sinkronisasi offline');
      const existing = await offlineDB.getById('anggota', id);
      if (!existing) throw new Error('Anggota tidak ditemukan di cache lokal');

      const updated = { ...existing, ...data };
      await offlineDB.put('anggota', updated);

      // Keep local name in saldo in sync
      const saldo = await offlineDB.getById('saldo', id);
      if (saldo) {
        saldo.nama = updated.nama;
        await offlineDB.put('saldo', saldo);
      }

      await offlineDB.enqueueSync('updateAnggota', { id, ...data });
      return updated;
    }
    throw error;
  }
}

export async function deleteAnggota(id) {
  if (USE_MOCK) {
    const idx = mockAnggota.findIndex(a => a.id === id);
    if (idx >= 0) mockAnggota[idx].status = 'nonaktif';
    return true;
  }
  
  try {
    const response = await apiClient.post('deleteAnggota', { id });
    await offlineDB.put('anggota', response);
    return true;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menyimpan penonaktifan anggota ke antrean sinkronisasi offline');
      const existing = await offlineDB.getById('anggota', id);
      if (!existing) throw new Error('Anggota tidak ditemukan di cache lokal');

      const updated = { ...existing, status: 'nonaktif' };
      await offlineDB.put('anggota', updated);

      await offlineDB.enqueueSync('deleteAnggota', { id });
      return true;
    }
    throw error;
  }
}

// ============================================================
// Transaksi Repository
// ============================================================

export async function fetchRecentTransaksi(limit = 10) {
  if (USE_MOCK) {
    return mockRecentTransaksi.slice(0, limit).map(t => ({
      ...t,
      nama: mockAnggota.find(a => a.id === t.anggota_id)?.nama || '-',
    }));
  }
  
  try {
    const data = await apiClient.get('getRecentTransaksi', { limit });
    await offlineDB.bulkPut('transaksi', data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data transaksi lokal (Offline Mode)');
      const allTx = await offlineDB.getAll('transaksi');
      // Sort desc by tanggal then ID
      return allTx
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id))
        .slice(0, limit);
    }
    throw error;
  }
}

export async function createTransaksi(data) {
  if (USE_MOCK) {
    const newTx = {
      id: `T${String(mockRecentTransaksi.length + 100).padStart(4, '0')}`,
      ...data,
      tanggal: data.tanggal || new Date().toISOString().split('T')[0],
    };
    mockRecentTransaksi.unshift(newTx);
    return newTx;
  }
  
  try {
    const response = await apiClient.post('createTransaksi', data);
    await offlineDB.put('transaksi', response);
    return response;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menyimpan transaksi ke antrean sinkronisasi offline');
      const tempId = 'temp_T_' + Date.now();
      const member = await offlineDB.getById('anggota', data.anggota_id);
      
      const newTx = {
        id: tempId,
        anggota_id: data.anggota_id,
        nama: member ? member.nama : 'Anggota',
        tanggal: data.tanggal || new Date().toISOString().split('T')[0],
        periode: data.tanggal ? data.tanggal.substring(0, 7) : new Date().toISOString().substring(0, 7),
        tipe: data.tipe,
        jumlah: parseFloat(data.jumlah),
        keterangan: data.keterangan || '',
        created_by: data.created_by || 'system',
        updated_by: data.updated_by || data.created_by || 'system',
      };

      // 1. Save locally
      await offlineDB.put('transaksi', newTx);

      // 2. Adjust local member saldo
      const saldo = await offlineDB.getById('saldo', data.anggota_id) || {
        anggota_id: data.anggota_id,
        nama: newTx.nama,
        pokok: 0,
        bunga: 0,
        hutang_bunga: 0,
        jumlah: 0,
      };

      const val = newTx.jumlah;
      switch (newTx.tipe) {
        case 'PINJAM':
          saldo.pokok += val;
          saldo.jumlah += val;
          break;
        case 'BAYAR_POKOK':
          saldo.pokok = Math.max(0, saldo.pokok - val);
          saldo.jumlah = Math.max(0, saldo.jumlah - val);
          break;
        case 'HUTANG_BUNGA':
          saldo.hutang_bunga += val;
          saldo.jumlah += val;
          break;
        case 'BAYAR_HUTANG_BUNGA':
          saldo.hutang_bunga = Math.max(0, saldo.hutang_bunga - val);
          saldo.jumlah = Math.max(0, saldo.jumlah - val);
          break;
        default:
          break;
      }
      saldo.bunga = saldo.pokok * 0.03; // recalculate bunga
      await offlineDB.put('saldo', saldo);

      // 3. Queue up for sync
      await offlineDB.enqueueSync('createTransaksi', newTx);
      return newTx;
    }
    throw error;
  }
}

// ============================================================
// Laporan / Rekap Repository
// ============================================================

export async function fetchDashboard() {
  if (USE_MOCK) {
    const topBorrowers = mockRekapNov2025.items
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);
    
    const recentTx = mockRecentTransaksi.slice(0, 5).map(t => ({
      ...t,
      nama: mockAnggota.find(a => a.id === t.anggota_id)?.nama || '-',
    }));

    return {
      stats: mockDashboardStats,
      topBorrowers,
      recentTransaksi: recentTx,
    };
  }
  
  try {
    const data = await apiClient.get('getDashboard');
    await offlineDB.put('meta', { key: 'dashboard', value: data });
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data dashboard lokal (Offline Mode)');
      const cached = await offlineDB.getById('meta', 'dashboard');
      if (cached && cached.value) return cached.value;
      
      // Build placeholder/empty dashboard structure if cache missing
      return {
        stats: { total_anggota: 0, total_pinjaman: 0, total_bunga: 0, kas_operasional: 0 },
        topBorrowers: [],
        recentTransaksi: [],
      };
    }
    throw error;
  }
}

export async function fetchPeriodes() {
  if (USE_MOCK) return mockPeriodes;
  
  try {
    const data = await apiClient.get('getPeriodes');
    await offlineDB.put('meta', { key: 'periodes', value: data });
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data periode lokal (Offline Mode)');
      const cached = await offlineDB.getById('meta', 'periodes');
      return cached ? cached.value : [];
    }
    throw error;
  }
}

export async function fetchRekapBulanan(periode) {
  if (USE_MOCK) {
    if (periode === '2025-11') return mockRekapNov2025;
    const multiplier = 1 + (mockPeriodes.indexOf(periode) * 0.03);
    return {
      periode,
      items: mockRekapNov2025.items.map(item => ({
        ...item,
        pokok: Math.round(item.pokok * multiplier),
        bunga: Math.round(item.pokok * multiplier * 0.03),
        jumlah: Math.round(item.jumlah * multiplier),
      })),
      totals: {
        ...mockRekapNov2025.totals,
        pokok: Math.round(mockRekapNov2025.totals.pokok * multiplier),
        jumlah: Math.round(mockRekapNov2025.totals.jumlah * multiplier),
      },
    };
  }
  
  try {
    const data = await apiClient.get('getRekapBulanan', { periode });
    await offlineDB.put('rekapBulanan', data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data rekap bulanan lokal (Offline Mode)');
      const cached = await offlineDB.getById('rekapBulanan', periode);
      if (cached) return cached;
      throw new Error(`Laporan untuk periode ${periode} tidak ditemukan di cache offline.`);
    }
    throw error;
  }
}

export async function fetchMonthlyTrend() {
  if (USE_MOCK) return mockMonthlyTrend;
  
  try {
    const data = await apiClient.get('getMonthlyTrend');
    await offlineDB.put('meta', { key: 'monthlyTrend', value: data });
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data tren bulanan lokal (Offline Mode)');
      const cached = await offlineDB.getById('meta', 'monthlyTrend');
      return cached ? cached.value : [];
    }
    throw error;
  }
}

export async function fetchConfig() {
  if (USE_MOCK) return mockConfig;
  
  try {
    const data = await apiClient.get('getConfig');
    await offlineDB.put('meta', { key: 'config', value: data });
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan konfigurasi lokal (Offline Mode)');
      const cached = await offlineDB.getById('meta', 'config');
      return cached ? cached.value : {};
    }
    throw error;
  }
}

export async function saveConfig(key, value) {
  if (USE_MOCK) {
    mockConfig[key] = value;
    return { success: true };
  }
  
  try {
    const response = await apiClient.post('setConfig', { key, value });
    const cachedConfigDoc = await offlineDB.getById('meta', 'config') || { key: 'config', value: {} };
    cachedConfigDoc.value[key] = value;
    await offlineDB.put('meta', cachedConfigDoc);
    return { success: true };
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menyimpan konfigurasi ke antrean offline');
      const cachedConfigDoc = await offlineDB.getById('meta', 'config') || { key: 'config', value: {} };
      cachedConfigDoc.value[key] = value;
      await offlineDB.put('meta', cachedConfigDoc);
      
      await offlineDB.enqueueSync('setConfig', { key, value });
      return { success: true };
    }
    throw error;
  }
}

export async function fetchAllSaldo() {
  if (USE_MOCK) {
    return mockRekapNov2025.items.map(item => ({
      anggota_id: item.anggota_id,
      nama: item.nama,
      pokok: item.pokok,
      bunga: item.bunga,
      hutang_bunga: item.hutang_bunga_plus - item.hutang_bunga_minus,
      jumlah: item.jumlah,
    }));
  }
  
  try {
    const data = await apiClient.get('getAllSaldo');
    await offlineDB.clear('saldo');
    await offlineDB.bulkPut('saldo', data);
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Menggunakan data ringkasan saldo lokal (Offline Mode)');
      return await offlineDB.getAll('saldo');
    }
    throw error;
  }
}

// ============================================================
// User / Auth Repository
// ============================================================

function getMockUsers() {
  const stored = localStorage.getItem('tani_makmur_mock_users');
  if (stored) return JSON.parse(stored);
  
  const defaultUsers = [
    { id: 'U0001', username: 'admin', nama: 'Administrator', whatsapp: '081999386550', password: 'admin', role: 'admin', tanggal: '2026-06-21' },
    { id: 'U0002', username: 'pengurus', nama: 'Pengurus Tani', whatsapp: '089876543210', password: 'pengurus', role: 'pengurus', tanggal: '2026-06-21' }
  ];
  localStorage.setItem('tani_makmur_mock_users', JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveMockUsers(users) {
  localStorage.setItem('tani_makmur_mock_users', JSON.stringify(users));
}

export async function login(username, password) {
  if (USE_MOCK) {
    const users = getMockUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Username atau Password salah');
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  
  try {
    return await apiClient.post('loginUser', { username, password });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Koneksi internet diperlukan untuk masuk ke sistem.');
    }
    throw error;
  }
}

export async function register(userData) {
  if (USE_MOCK) {
    const users = getMockUsers();
    const username = userData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === username)) {
      throw new Error(`Username "${userData.username}" sudah digunakan`);
    }
    const newId = `U${String(users.length + 1).padStart(4, '0')}`;
    const newUser = {
      id: newId,
      username,
      nama: userData.nama.trim(),
      whatsapp: userData.whatsapp.trim(),
      password: userData.password,
      role: userData.role,
      tanggal: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    saveMockUsers(users);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }
  
  try {
    return await apiClient.post('registerUser', userData);
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Koneksi internet diperlukan untuk mendaftarkan akun baru.');
    }
    throw error;
  }
}

export async function fetchUsers() {
  if (USE_MOCK) {
    const users = getMockUsers();
    return users.map(({ password, ...u }) => u);
  }
  
  try {
    return await apiClient.get('getUsers');
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Gagal memuat pengguna dari server. Mengambil dari cache lokal.');
      const cached = await offlineDB.getById('meta', 'users');
      return cached ? cached.value : [];
    }
    throw error;
  }
}

export async function deleteUser(id) {
  if (USE_MOCK) {
    let users = getMockUsers();
    const target = users.find(u => u.id === id);
    if (!target) throw new Error('Pengguna tidak ditemukan');
    if (target.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Tidak dapat menghapus satu-satunya administrator sistem');
      }
    }
    users = users.filter(u => u.id !== id);
    saveMockUsers(users);
    return true;
  }
  
  try {
    return await apiClient.post('deleteUser', { id });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Koneksi internet diperlukan untuk menghapus pengguna.');
    }
    throw error;
  }
}
