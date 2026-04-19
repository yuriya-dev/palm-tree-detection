import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  Clock3,
  Map,
  Radar,
  ShieldCheck,
  Trees,
} from 'lucide-react'
import Card from './Card'

const iconMap = {
  trees: Trees,
  shield: ShieldCheck,
  alert: AlertTriangle,
  map: Map,
  scan: Radar,
  building: Building2,
  clock: Clock3,
  bell: Bell,
}

export default function StatCard({ title, value, trend = 0, icon = 'trees' }) {
  const Icon = iconMap[icon] || Trees
  const isPositive = trend >= 0

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-primary-100/60 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 font-display text-3xl leading-none text-slate-900">{value}</p>
          <p
            className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </p>
        </div>

        <div className="rounded-xl bg-primary-50 p-2.5 text-primary-900">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}
