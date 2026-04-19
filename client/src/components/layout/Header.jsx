import { CalendarDays, Menu, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Header({ title, subtitle, onOpenSidebar }) {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onOpenSidebar}
          >
            <Menu size={16} />
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Selamat datang kembali
            </p>
            <h1 className="font-display text-2xl text-slate-900 sm:text-3xl">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
            <CalendarDays size={14} />
            {dateLabel}
          </div>

          <Button as={Link} to="/detection">
            <Upload size={15} />
            Upload Image
          </Button>
        </div>
      </div>
    </header>
  )
}
