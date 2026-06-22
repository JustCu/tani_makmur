import { Navigate, useLocation, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../../shared/AuthContext'
import { Card, Button } from '../ui'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-sm font-semibold text-surface-400">Memuat sesi...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    // Authenticated but does not have the admin role
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center animate-scale-in shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-surface-50 mb-2">Akses Terbatas</h1>
          <p className="text-sm text-surface-450 mb-6 leading-relaxed">
            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini dikonfigurasi khusus untuk tingkat akses **Administrator**.
          </p>
          <div className="flex justify-center">
            <Link to="/">
              <Button icon={ArrowLeft} variant="secondary">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return children
}
