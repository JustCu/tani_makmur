// ============================================================
// Reusable UI Components — Design System
// 4px Grid, Glassmorphism, Micro-animations
// ============================================================

import { X, Loader2, Search, ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// ---- StatCard ----
// ---- StatCard ----
export function StatCard({ icon: Icon, label, value, sub, color = 'primary', delay = 0 }) {
  const colors = {
    primary: {
      bg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
      border: 'border-surface-600 hover:border-primary-500',
    },
    accent: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      border: 'border-surface-600 hover:border-accent-500',
    },
    danger: {
      bg: 'bg-red-500/10 text-red-600 dark:text-red-400',
      border: 'border-surface-600 hover:border-red-500',
    },
    info: {
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      border: 'border-surface-600 hover:border-blue-500',
    },
  }
  
  const themeColors = colors[color] || colors.primary

  return (
    <div
      className={`
        animate-fade-in delay-${delay}
        rounded-xl p-4 border bg-surface-800 border-surface-600
        transition-all duration-200 hover:border-surface-500
        flex items-center gap-4
      `}
    >
      {/* Icon Box */}
      {Icon && (
        <div className={`w-12 h-12 rounded-lg ${themeColors.bg} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block mb-1">
          {label}
        </span>
        <p className="text-xl font-extrabold text-surface-50 leading-none mb-1">
          {value}
        </p>
        {sub && <p className="text-xs text-surface-500 truncate mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ---- Card ----
export function Card({ children, className = '', glass = true, ...props }) {
  return (
    <div
      className={`
        rounded-xl p-4 sm:p-6
        ${glass ? 'glass' : 'bg-surface-800 border border-surface-600'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// ---- Button ----
export function Button({
  children, variant = 'primary', size = 'md', loading = false,
  icon: Icon, className = '', ...props
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white cursor-pointer transition-colors',
    secondary: 'bg-white dark:bg-surface-800 hover:bg-surface-900 dark:hover:bg-surface-700 text-surface-100 dark:text-surface-100 border border-surface-600 dark:border-surface-600 cursor-pointer transition-colors',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 cursor-pointer transition-colors',
    ghost: 'hover:bg-surface-900 dark:hover:bg-surface-800/60 text-surface-300 dark:text-surface-400 hover:text-surface-100 cursor-pointer transition-colors',
  }
  const sizes = {
    sm: 'px-3 py-1 text-xs rounded-lg gap-1',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2',
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-205 active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// ---- Badge ----
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-700 text-surface-300',
    success: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ---- Modal ----
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${maxWidth} w-full glass rounded-xl p-6 animate-scale-in shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-surface-50">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-800/60 flex items-center justify-center text-surface-400 hover:text-surface-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---- Input ----
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-bold text-surface-400 mb-2 uppercase tracking-wider">{label}</label>}
      <input
        className={`
          w-full px-4 py-2 rounded-lg text-sm font-medium
          bg-white dark:bg-surface-900
          border text-surface-100 placeholder-surface-400
          transition-all duration-200
          focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-500' : 'border-surface-600'}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ---- Select ----
export function Select({ label, options = [], error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-bold text-surface-400 mb-2 uppercase tracking-wider">{label}</label>}
      <select
        className={`
          w-full px-4 py-2 rounded-lg text-sm font-medium
          bg-white dark:bg-surface-900
          border text-surface-100
          transition-all duration-200 appearance-none cursor-pointer
          focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-500' : 'border-surface-600'}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-surface-800 text-surface-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ---- Skeleton ----
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-surface-700 via-surface-600 to-surface-700 dark:from-surface-800 dark:via-surface-700 dark:to-surface-800 bg-[length:400%_100%] ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  )
}

// ---- EmptyState ----
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-surface-500 mb-4" />}
      <h3 className="text-lg font-semibold text-surface-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-400 max-w-sm">{description}</p>}
    </div>
  )
}

// ---- Avatar ----
export function Avatar({ name, size = 'md', className = '' }) {
  const initials = name
    ? name.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '??'

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  // Generate consistent colors for light and dark modes
  const colors = [
    'bg-primary-500/10 text-primary-600 dark:bg-primary-600/30 dark:text-primary-300',
    'bg-blue-500/10 text-blue-600 dark:bg-blue-600/30 dark:text-blue-300',
    'bg-purple-500/10 text-purple-600 dark:bg-purple-600/30 dark:text-purple-300',
    'bg-amber-500/10 text-amber-600 dark:bg-amber-600/30 dark:text-amber-300',
    'bg-rose-500/10 text-rose-600 dark:bg-rose-600/30 dark:text-rose-300',
    'bg-teal-500/10 text-teal-600 dark:bg-teal-600/30 dark:text-teal-300',
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div className={`${sizes[size]} ${colors[colorIndex]} rounded-xl flex items-center justify-center font-bold shrink-0 ${className}`}>
      {initials}
    </div>
  )
}

// ---- SearchablePicker ----
export function SearchablePicker({ label, options = [], value, onChange, placeholder = 'Pilih...', error, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search when dropdown closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-[10px] font-bold text-surface-400 mb-2 uppercase tracking-wider">{label}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2 rounded-lg text-sm font-medium text-left
          bg-surface-800 border text-surface-100 placeholder-surface-500
          transition-all duration-200 flex items-center justify-between cursor-pointer
          focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-500' : 'border-surface-600'}
        `}
      >
        <span className={selectedOption ? 'text-surface-100' : 'text-surface-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4.5 h-4.5 text-surface-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 glass rounded-xl shadow-2xl border border-surface-600 overflow-hidden animate-scale-in">
          {/* Search Box */}
          <div className="p-2 border-b border-surface-600 flex items-center gap-2 bg-surface-900">
            <Search className="w-4 h-4 text-surface-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-sm text-surface-100 focus:outline-none placeholder-surface-400"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.map(opt => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors cursor-pointer
                    ${isSelected 
                      ? 'bg-primary-500/10 text-primary-500 font-semibold' 
                      : 'text-surface-200 hover:bg-surface-700 hover:text-surface-50'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary-500 shrink-0" />}
                </button>
              )
            })}
            
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-surface-500 text-center">
                Tidak ada hasil pencarian
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
