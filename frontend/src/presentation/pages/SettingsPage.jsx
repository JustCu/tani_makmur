import { useState, useEffect } from 'react'
import { Save, ShieldAlert, User, Settings, Users, UserPlus, Trash2, Calendar, Phone, Award } from 'lucide-react'
import { Card, Button, Input, Select, Skeleton, Modal } from '../components/ui'
import { fetchConfig, saveConfig, fetchUsers, register as apiRegister, deleteUser } from '../../infrastructure/DataProvider'
import { useAuth } from '../../shared/AuthContext'

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Tab System Config State
  const [config, setConfig] = useState({
    nama_kelompok: '',
    alamat: '',
    ketua: '',
    bendahara: '',
    tahun_buku: '',
    bunga_persen: '',
  })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSuccess, setConfigSuccess] = useState('')
  const [configError, setConfigError] = useState('')

  // Tab User Management State
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    nama: '',
    whatsapp: '',
    password: '',
    role: 'pengurus',
  })
  const [registeringUser, setRegisteringUser] = useState(false)
  const [userError, setUserError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')

  // Tabs list configuration
  const tabs = [
    { id: 'profile', label: 'Profil Saya', icon: User },
    ...(isAdmin ? [
      { id: 'system', label: 'Pengaturan Sistem', icon: Settings },
      { id: 'users', label: 'Manajemen Pengguna', icon: Users }
    ] : [])
  ]

  // Load config when system tab is opened
  useEffect(() => {
    if (activeTab === 'system' && isAdmin) {
      async function loadSystemConfig() {
        setLoadingConfig(true)
        setConfigError('')
        try {
          const data = await fetchConfig()
          setConfig({
            nama_kelompok: data.nama_kelompok || '',
            alamat: data.alamat || '',
            ketua: data.ketua || '',
            bendahara: data.bendahara || '',
            tahun_buku: data.tahun_buku || '',
            bunga_persen: data.bunga_persen !== undefined ? String(data.bunga_persen) : '3',
          })
        } catch (err) {
          console.error('Failed to load config:', err)
          setConfigError('Gagal memuat konfigurasi sistem.')
        } finally {
          setLoadingConfig(false)
        }
      }
      loadSystemConfig()
    }
  }, [activeTab, isAdmin])

  // Load users when users tab is opened
  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers()
    }
  }, [activeTab, isAdmin])

  async function loadUsers() {
    setLoadingUsers(true)
    setUserError('')
    try {
      const data = await fetchUsers()
      setUsersList(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUserError('Gagal memuat daftar pengguna.')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Handle system config submission
  async function handleConfigSubmit(e) {
    e.preventDefault()
    setSavingConfig(true)
    setConfigSuccess('')
    setConfigError('')
    try {
      const rate = parseFloat(config.bunga_persen)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new Error('Persentase bunga harus berupa angka antara 0 dan 100.')
      }

      await Promise.all([
        saveConfig('nama_kelompok', config.nama_kelompok.trim()),
        saveConfig('alamat', config.alamat.trim()),
        saveConfig('ketua', config.ketua.trim()),
        saveConfig('bendahara', config.bendahara.trim()),
        saveConfig('tahun_buku', config.tahun_buku.trim()),
        saveConfig('bunga_persen', rate),
      ])

      setConfigSuccess('Pengaturan sistem berhasil disimpan.')
      setTimeout(() => setConfigSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to save config:', err)
      setConfigError(err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSavingConfig(false)
    }
  }

  // Handle new user registration submission
  async function handleAddUser(e) {
    e.preventDefault()
    setRegisteringUser(true)
    setUserError('')
    setUserSuccess('')

    try {
      // Basic validations
      if (!newUser.username.trim() || !newUser.nama.trim() || !newUser.whatsapp.trim() || !newUser.password.trim()) {
        throw new Error('Semua data wajib diisi.')
      }
      if (newUser.username.length < 3) {
        throw new Error('Username minimal terdiri dari 3 karakter.')
      }
      if (newUser.password.length < 6) {
        throw new Error('Password minimal terdiri dari 6 karakter.')
      }
      if (!/^\d+$/.test(newUser.whatsapp)) {
        throw new Error('Nomor WhatsApp hanya boleh berisi angka.')
      }

      const registered = await apiRegister({
        username: newUser.username.trim().toLowerCase(),
        nama: newUser.nama.trim(),
        whatsapp: newUser.whatsapp.trim(),
        password: newUser.password,
        role: newUser.role,
      })

      setUserSuccess(`Pengguna @${registered.username} berhasil ditambahkan.`)
      setIsAddUserModalOpen(false)
      // Reset form
      setNewUser({
        username: '',
        nama: '',
        whatsapp: '',
        password: '',
        role: 'pengurus',
      })
      // Reload users table
      loadUsers()
      setTimeout(() => setUserSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to register user:', err)
      setUserError(err.message || 'Gagal menambahkan pengguna baru.')
    } finally {
      setRegisteringUser(false)
    }
  }

  // Handle user delete
  async function handleDeleteUser(userId, username) {
    if (userId === user.id) {
      setUserError('Anda tidak dapat menghapus akun Anda sendiri.')
      setTimeout(() => setUserError(''), 3000)
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun @${username}?`)) {
      return
    }

    setUserError('')
    setUserSuccess('')
    try {
      await deleteUser(userId)
      setUserSuccess(`Akun @${username} berhasil dihapus.`)
      // Refresh list
      setUsersList(prev => prev.filter(u => u.id !== userId))
      setTimeout(() => setUserSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to delete user:', err)
      setUserError(err.message || 'Gagal menghapus pengguna.')
      setTimeout(() => setUserError(''), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-surface-50 font-display">Pengaturan</h1>
        <p className="text-sm text-surface-400 mt-1">Ubah profil Anda dan kelola konfigurasi aplikasi</p>
      </div>

      {/* Tabs Switcher */}
      {isAdmin && (
        <div className="flex border-b border-surface-600 pb-px gap-2 animate-fade-in">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all duration-200 border-b-2 cursor-pointer
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-500 bg-primary-500/5'
                  : 'border-transparent text-surface-400 hover:text-surface-100 hover:bg-surface-900 dark:hover:bg-surface-800'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Profile Tab Panel */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl animate-fade-in">
          <Card className="flex flex-col sm:flex-row gap-6 items-center sm:items-start p-6 sm:p-8">
            {/* Left Column Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-blue-500/20 flex items-center justify-center border border-surface-500 shadow-inner shrink-0">
              <span className="text-3xl font-extrabold text-primary-500 font-display">
                {user?.nama?.substring(0, 2).toUpperCase() || '??'}
              </span>
            </div>
            
            {/* Right Column Details */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <h2 className="text-xl font-bold text-surface-50 font-display text-center sm:text-left">{user?.nama}</h2>
                <p className="text-sm text-surface-400 mt-1 text-center sm:text-left">@{user?.username}</p>
              </div>

              <hr className="border-surface-600" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider block">Level Akses</span>
                    <span className="text-sm text-surface-150 font-semibold uppercase">{user?.role === 'admin' ? 'Administrator' : 'Pengurus'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider block">Nomor WhatsApp</span>
                    <a href={`https://wa.me/${user?.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline font-semibold">
                      {user?.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider block">Tanggal Terdaftar</span>
                    <span className="text-sm text-surface-150 font-semibold">{user?.tanggal}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Settings Tab Panel */}
      {activeTab === 'system' && isAdmin && (
        <div className="space-y-6 max-w-2xl animate-fade-in">
          {loadingConfig ? (
            <Card>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <Input
                  label="Nama Kelompok Tani"
                  placeholder="Masukkan nama kelompok"
                  value={config.nama_kelompok}
                  onChange={e => setConfig({ ...config, nama_kelompok: e.target.value })}
                  required
                />

                <Input
                  label="Alamat / Lokasi"
                  placeholder="Masukkan alamat kelompok"
                  value={config.alamat}
                  onChange={e => setConfig({ ...config, alamat: e.target.value })}
                  required
                />

                <Input
                  label="Nama Ketua"
                  placeholder="Masukkan nama ketua"
                  value={config.ketua}
                  onChange={e => setConfig({ ...config, ketua: e.target.value })}
                  required
                />

                <Input
                  label="Nama Bendahara"
                  placeholder="Masukkan nama bendahara"
                  value={config.bendahara}
                  onChange={e => setConfig({ ...config, bendahara: e.target.value })}
                  required
                />

                <Input
                  label="Tahun Buku"
                  placeholder="Contoh: 2025-2026"
                  value={config.tahun_buku}
                  onChange={e => setConfig({ ...config, tahun_buku: e.target.value })}
                  required
                />

                <Input
                  label="Bunga Bulanan (%)"
                  type="number"
                  step="0.01"
                  placeholder="3"
                  value={config.bunga_persen}
                  onChange={e => setConfig({ ...config, bunga_persen: e.target.value })}
                  required
                />

                {configSuccess && (
                  <div className="p-3 bg-primary-500/10 border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-semibold animate-scale-in">
                    {configSuccess}
                  </div>
                )}

                {configError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold flex items-center gap-2 animate-scale-in">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{configError}</span>
                  </div>
                )}

                <div className="flex justify-start pt-2">
                  <Button
                    type="submit"
                    loading={savingConfig}
                    icon={Save}
                    className="w-full sm:w-auto"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* User Management Tab Panel */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Header bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-surface-50 font-display">Daftar Pengurus</h2>
              <p className="text-xs text-surface-400 mt-1">Daftar akun pengurus kelompok tani yang berhak mengakses sistem ini</p>
            </div>
            <Button
              icon={UserPlus}
              onClick={() => setIsAddUserModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Tambah Pengurus
            </Button>
          </div>

          {/* Messages */}
          {userSuccess && (
            <div className="p-3 bg-primary-500/10 border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-semibold animate-scale-in">
              {userSuccess}
            </div>
          )}
          {userError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold flex items-center gap-2 animate-scale-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          {/* Table Container */}
          {loadingUsers ? (
            <Card>
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border border-surface-600">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-900 dark:bg-surface-900 border-b border-surface-600">
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400">Username</th>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400">Nama Lengkap</th>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400">WhatsApp</th>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400">Role</th>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400">Tanggal Daftar</th>
                      <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-surface-400 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-600">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-surface-900 dark:hover:bg-surface-800 transition-colors">
                        <td className="px-5 py-3 text-sm font-bold text-surface-200">@{usr.username}</td>
                        <td className="px-5 py-3 text-sm font-medium text-surface-100">{usr.nama}</td>
                        <td className="px-5 py-3 text-sm font-medium text-primary-500 font-mono">
                          <a href={`https://wa.me/${usr.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {usr.whatsapp}
                          </a>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            usr.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-surface-400 font-mono">{usr.tanggal}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.username)}
                            className="p-1.5 rounded-lg border border-surface-600 text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Hapus Akun"
                            disabled={usr.id === user.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-sm text-surface-400">Tidak ada data pengguna</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Add User Modal */}
          <Modal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            title="Tambah Akun Pengurus Baru"
          >
            <form onSubmit={handleAddUser} className="space-y-4">
              <Input
                label="Username"
                placeholder="Contoh: amnan_sp"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                required
              />

              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={newUser.nama}
                onChange={e => setNewUser({ ...newUser, nama: e.target.value })}
                required
              />

              <Input
                label="Nomor WhatsApp"
                placeholder="Contoh: 081999386550"
                value={newUser.whatsapp}
                onChange={e => setNewUser({ ...newUser, whatsapp: e.target.value })}
                required
              />

              <Input
                label="Password (min. 6 karakter)"
                type="password"
                placeholder="Masukkan password pengurus"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                required
              />

              <Select
                label="Peran (Role)"
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                options={[
                  { value: 'pengurus', label: 'Pengurus (Akses Pencatatan)' },
                  { value: 'admin', label: 'Admin (Akses Penuh + Manajemen User)' },
                ]}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-600">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddUserModalOpen(false)}
                  disabled={registeringUser}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={registeringUser}
                  icon={UserPlus}
                >
                  Tambah Pengguna
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  )
}
