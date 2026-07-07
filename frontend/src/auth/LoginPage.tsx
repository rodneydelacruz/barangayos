import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, Eye, EyeOff, User } from 'lucide-react'
import { login } from './session'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang Umaga'
  if (hour < 18) return 'Magandang Hapon'
  return 'Magandang Gabi'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [greeting] = useState(getGreeting)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left: Illustration panel ── */}
      <div className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-gradient-to-br from-barangay via-[#152F3D] to-[#0D1F2D] lg:min-h-screen lg:w-1/2">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-40"
          style={{ background: 'radial-gradient(ellipse at 40% 20%, color-mix(in srgb, var(--gold) 30%, transparent) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Brand mark on mobile — overlaid on illustration */}
        <div className="absolute left-6 top-6 z-20 flex items-center gap-3 lg:hidden">
          <img src="/logo.png" alt="" className="size-10 object-contain" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">BarangayOS</span>
        </div>

        {/* Illustration — fills the entire panel */}
        <img
          src="https://cdn.dribbble.com/userupload/42085661/file/original-7086befc217a7928cfaa501e785be39b.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />

        {/* Bottom accent line */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex h-[3px]" aria-hidden="true">
          <div className="h-full w-[34%] bg-red-pinoy/60" />
          <div className="h-full w-[32%] bg-gold/60" />
          <div className="h-full w-[34%] bg-barangay/60" />
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex flex-1 items-center justify-center bg-white px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-sm motion-fade-in motion-slide-up">
          {/* Branding */}
          <div className="text-center">
            <img
              src="/logo.png"
              alt="BarangayOS"
              className="mx-auto size-48 object-contain"
            />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-narra">
              {greeting}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-barangay">
              BarangayOS
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Barangay Records Management System
            </p>
          </div>

          {/* Form */}
          <div className="mt-10">
            

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email field */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full rounded-xl bg-gray-100 px-4 py-3.5 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-barangay/25"
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="size-4" />
                </div>
              </div>

              {/* Password field */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-gray-100 px-4 py-3.5 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-barangay/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-pinoy/20 bg-red-pinoy/5 px-4 py-3 text-sm text-red-pinoy motion-scale-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-barangay to-[#0D1F2D] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-[#0D1F2D] hover:to-barangay hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-barangay/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-400">
            Made with ❤️ by <a href="https://github.com/rodneydelacruz" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-500 underline transition-colors hover:text-gray-600">Rodney</a> for all Barangays.
          </p>
        </div>
      </div>
    </div>
  )
}
