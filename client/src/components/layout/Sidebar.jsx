import clsx from 'clsx'
import {
  BarChart3,
  Brain,
  Database,
  Gauge,
  Leaf,
  LogOut,
  Radar,
  Settings,
  UserCircle2,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/detection', label: 'Detection', icon: Radar },
  { to: '/monitoring', label: 'Monitoring', icon: Leaf },
  { to: '/datasets', label: 'Datasets', icon: Database },
  { to: '/models', label: 'Models', icon: Brain },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'sidebar fixed inset-y-0 left-0 z-40 flex w-60 flex-col px-3 py-4 transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 p-2 text-white shadow-sm">
            <Leaf size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">NYAWIT</p>
            <p className="text-xs text-slate-500">Oil Palm Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-button px-3 py-2.5 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900',
                    isActive && 'nav-item-active',
                  )
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: user info + logout */}
        <div className="mt-auto space-y-2">
          {/* Logged-in user */}
          {user && (
            <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
              <UserCircle2 size={28} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-[0.78rem] font-semibold text-slate-700">
                  {user.name || user.email}
                </p>
                <p className="truncate text-[0.68rem] capitalize text-slate-400">{user.role}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
