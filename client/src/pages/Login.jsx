import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader2, Lock, Mail } from 'lucide-react'
import { apiEndpoints } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const res = await apiEndpoints.login({ email: form.email, password: form.password })
      // res is already unwrapped to res.data by the axios interceptor
      const { token, user } = res.data ?? res
      setAuth(token, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err?.message || 'Email atau password tidak valid.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="relative hidden flex-1 overflow-hidden md:flex">
        {/* Background photo */}
        <img
          src="/loginbg.jpg"
          alt="Oil palm plantation aerial view"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[20000ms] ease-linear hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(10,60,30,0.60)] via-[rgba(0,0,0,0.15)] to-[rgba(0,0,0,0.75)]" />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-900 to-primary-500 text-white shadow-lg">
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-widest text-white">NYAWIT</p>
              <p className="text-xs text-white/60">Oil Palm Intelligence</p>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <h1 className="font-display text-[clamp(1.9rem,3.2vw,2.8rem)] font-normal leading-[1.15] text-white drop-shadow-lg">
              Deteksi Cerdas.<br />
              Kebun Optimal.<br />
              Hasil Maksimal.
            </h1>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-white/70">
              Platform AI terpadu untuk pemantauan dan deteksi pohon sawit
              dari citra UAV secara real-time.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-md">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold text-white leading-none">98.4%</span>
              <span className="text-[0.68rem] text-white/60 whitespace-nowrap">Akurasi Deteksi</span>
            </div>
            <div className="h-9 w-px bg-white/20 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold text-white leading-none">12K+</span>
              <span className="text-[0.68rem] text-white/60 whitespace-nowrap">Pohon Terpantau</span>
            </div>
            <div className="h-9 w-px bg-white/20 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold text-white leading-none">5 Site</span>
              <span className="text-[0.68rem] text-white/60 whitespace-nowrap">Kebun Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className="flex w-full items-center justify-center px-6 py-10 md:w-[420px] md:shrink-0 md:px-10 lg:w-[460px] lg:px-12">
        <div className="w-full max-w-[380px] animate-loginFadeUp">

          {/* Header */}
          <div className="mb-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-900 to-primary-500 text-white shadow-[0_6px_20px_rgba(26,122,74,0.30)]">
              <Leaf size={22} />
            </div>
            <h2 className="text-[1.65rem] font-extrabold leading-tight text-slate-900">
              Selamat Datang Kembali
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Masuk ke dashboard NYAWIT untuk memulai analisis kebun Anda.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-[0.8rem] font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    error ? 'text-red-400' : 'text-slate-400 peer-focus:text-primary-900'
                  }`}
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`peer w-full rounded-[10px] border-[1.5px] bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all duration-150
                    ${error
                      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-primary-900 focus:bg-white focus:ring-4 focus:ring-primary-900/10'
                    }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-[0.8rem] font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full rounded-[10px] border-[1.5px] bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition-all duration-150
                    ${error
                      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-primary-900 focus:bg-white focus:ring-4 focus:ring-primary-900/10'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2 text-[0.8rem] text-slate-500">
                <input
                  id="login-remember"
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded accent-primary-900"
                />
                <span>Ingat saya</span>
              </label>
              <a
                href="#"
                className="text-[0.8rem] font-semibold text-primary-900 transition-colors hover:text-primary-500 hover:underline"
              >
                Lupa password?
              </a>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] text-red-600"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-primary-900 to-primary-500 py-3.5 text-[0.9rem] font-bold text-white shadow-[0_4px_16px_rgba(26,122,74,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,122,74,0.42)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Memverifikasi…
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-7 text-center text-[0.72rem] leading-relaxed text-slate-400">
            Sistem digunakan secara internal. Hubungi administrator<br />
            jika mengalami kendala akses.
          </p>
        </div>
      </div>
    </div>
  )
}
