import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in via localStorage
    const savedUser = localStorage.getItem('tani_makmur_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user:', e)
        localStorage.removeItem('tani_makmur_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password, loginFn) => {
    try {
      // loginFn is passed from DataProvider to decouple Context from DataProvider imports directly
      const userData = await loginFn(username, password)
      setUser(userData)
      localStorage.setItem('tani_makmur_user', JSON.stringify(userData))
      return userData;
    } catch (error) {
      console.error('Login failed in AuthContext:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tani_makmur_user')
  }

  const register = async (userData, registerFn) => {
    try {
      return await registerFn(userData)
    } catch (error) {
      console.error('Registration failed in AuthContext:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
