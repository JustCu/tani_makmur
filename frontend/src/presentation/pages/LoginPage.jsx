import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, LogIn, Eye, EyeOff, ShieldAlert, Lock, User } from 'lucide-react'
import { Card, Button, Input } from '../components/ui'
import { useAuth } from '../../shared/AuthContext'
import { login as apiLogin } from '../../infrastructure/DataProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Redirect target after login
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Username dan Password wajib diisi')
      }
      
      // Pass the API login function to the context login handler
      await login(username.trim(), password.trim(), apiLogin)
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Gagal masuk. Silakan periksa kembali username dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-950 transition-colors duration-300 relative overflow-hidden">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-scale-in">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 dark:bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-3 animate-pulse">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-surface-50 tracking-tight leading-tight">
            Tani Makmur
          </h1>
          <p className="text-sm text-surface-400 font-medium mt-1">
            Sistem Informasi Simpan Pinjam Kelompok Tani
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-surface-50">Selamat Datang</h2>
            <p className="text-xs text-surface-400 mt-1">Silakan masuk dengan akun pengurus Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="relative">
              <Input
                label="Username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="pl-2"
              />
              <User className="absolute right-3 bottom-[10px] w-4 h-4 text-surface-500" />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pl-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-[10px] text-surface-500 hover:text-surface-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Masuk ke Dashboard
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-surface-500 mt-8">
          &copy; {new Date().getFullYear()} Kelompok Tani Makmur. All rights reserved.
        </p>
      </div>
    </div>
  )
}
