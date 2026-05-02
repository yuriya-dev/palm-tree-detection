import clsx from 'clsx'
import {
  BarChart3,
  Brain,
  Database,
  Gauge,
  Leaf,
  Radar,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

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
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 p-2 text-white shadow-sm">
            <Leaf size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">NYAWIT</p>
            <p className="text-xs text-slate-500">Oil Palm Intelligence</p>
          </div>
        </div>

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

        <div className="mt-auto rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System Health</p>
          <p className="mt-1 text-sm font-medium text-emerald-700">All services operational</p>
        </div>
      </aside>
    </>
  )
}
