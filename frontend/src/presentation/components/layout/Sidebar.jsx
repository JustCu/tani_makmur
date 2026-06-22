import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  FileText,
  Settings,
  Sprout,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  BookOpen
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../../shared/ThemeContext'
import { useAuth } from '../../../shared/AuthContext'
import { useOffline } from '../../../shared/OfflineContext'
import { Avatar } from '../ui'

const NAV_GROUPS = [
  {
    title: 'Utama',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true }
    ]
  },
  {
    title: 'Manajemen',
    items: [
      { to: '/anggota', icon: Users, label: 'Anggota' },
      { to: '/transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
      { to: '/laporan', icon: FileText, label: 'Laporan' }
    ]
  },
  {
    title: 'Sistem',
    items: [
      { to: '/sync', icon: RefreshCw, label: 'Sinkronisasi' },
      { to: '/settings', icon: Settings, label: 'Pengaturan' },
      { to: '/panduan', icon: BookOpen, label: 'Panduan' }
    ]
  }
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { pendingCount } = useOffline()

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 h-screen
          glass transition-all duration-300 ease-in-out no-print
          /* Responsive drawer slide */
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-sidebar
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[72px] border-b border-surface-600">
          <div className="w-10 h-10 rounded-lg bg-primary-600 dark:bg-primary-500 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-bold text-surface-50 tracking-tight leading-tight">Tani Makmur</h1>
            <p className="text-[10px] text-surface-400 font-medium">Simpan Pinjam</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4 px-3 mt-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="text-[9px] font-bold text-surface-500 uppercase tracking-widest px-4 select-none mb-1">
                {group.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center gap-3 px-4 py-2 rounded-lg
                      text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-surface-700 dark:bg-surface-700/40 text-primary-600 dark:text-primary-400 border border-surface-600'
                        : 'text-surface-300 hover:text-surface-50 hover:bg-surface-700/40 dark:hover:bg-surface-800/30'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
                    <span className="animate-fade-in flex-1">{item.label}</span>
                    {item.to === '/sync' && pendingCount > 0 && (
                      <span className="bg-amber-500 text-surface-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>




        {/* User Profile Widget */}
        <div className="absolute bottom-6 left-0 right-0 px-4 border-t border-surface-600 pt-4 flex items-center gap-3">
          <Avatar name={user?.nama || 'Pengguna'} size="sm" />
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-xs font-bold text-surface-100 truncate leading-tight">{user?.nama}</p>
            <p className="text-[10px] text-surface-400 uppercase font-semibold tracking-wider leading-none mt-1">
              {user?.role === 'admin' ? 'Admin' : 'Pengurus'}
            </p>
          </div>
          {/* Theme Toggle — icon only */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-50 hover:bg-surface-800/40 transition-all duration-200 shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
            title="Keluar dari Sistem"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}


