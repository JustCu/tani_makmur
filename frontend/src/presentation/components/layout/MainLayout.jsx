import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, Sprout } from 'lucide-react'
import { OfflineProvider } from '../../../shared/OfflineContext'
import OfflineIndicator from '../ui/OfflineIndicator'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <OfflineProvider>
      <div className="min-h-screen bg-surface-950 transition-colors duration-300 text-surface-100">
        {/* Mobile Top Bar */}
        <header className="flex md:hidden h-16 items-center justify-between px-4 bg-surface-800 border-b border-surface-600 sticky top-0 z-35 transition-colors duration-300 no-print shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-lg hover:bg-surface-900 dark:hover:bg-surface-800 flex items-center justify-center text-surface-300 hover:text-surface-50 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 dark:bg-primary-500 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-surface-50">Tani Makmur</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Sidebar Component */}
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Offline Warning Banner / Connection restored Toast */}
        <OfflineIndicator />

        {/* Main Content Area */}
        <main className="min-h-screen transition-all duration-300 ease-in-out ml-0 md:ml-sidebar">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </OfflineProvider>
  )
}

