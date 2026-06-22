import { Routes, Route } from 'react-router-dom'
import MainLayout from './presentation/components/layout/MainLayout'
import Dashboard from './presentation/pages/Dashboard'
import AnggotaPage from './presentation/pages/AnggotaPage'
import TransaksiPage from './presentation/pages/TransaksiPage'
import LaporanPage from './presentation/pages/LaporanPage'
import DetailAnggotaPage from './presentation/pages/DetailAnggotaPage'
import SettingsPage from './presentation/pages/SettingsPage'
import SyncPage from './presentation/pages/SyncPage'
import LoginPage from './presentation/pages/LoginPage'
import PanduanPage from './presentation/pages/PanduanPage'
import ProtectedRoute from './presentation/components/layout/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="anggota" element={<AnggotaPage />} />
        <Route path="anggota/:id" element={<DetailAnggotaPage />} />
        <Route path="transaksi" element={<TransaksiPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="panduan" element={<PanduanPage />} />
      </Route>
    </Routes>
  )
}

