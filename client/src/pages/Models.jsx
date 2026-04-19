import { Download, LineChart as LineChartIcon, PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import EmptyState from '../components/shared/EmptyState'
import Skeleton from '../components/shared/Skeleton'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import {
  modelPerformanceTrend,
  models,
  trainingHistory,
} from '../utils/mockData'

export default function Models() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-[620px]" />
        <Skeleton className="h-[620px]" />
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <EmptyState
        title="Belum ada model"
        description="Model terlatih akan muncul di halaman ini setelah proses training selesai."
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {models.map((model) => (
            <article key={model.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{model.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-800">{model.name}</h3>
                  <p className="text-sm text-slate-500">{model.site}</p>
                </div>
                <StatusBadge status={model.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Accuracy</p>
                  <p className="font-semibold text-slate-800">{model.accuracy}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">mAP</p>
                  <p className="font-semibold text-slate-800">{model.map}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">
                  <PlayCircle size={14} />
                  Set Active
                </Button>
                <Button variant="ghost" size="sm">
                  <Download size={14} />
                  Download
                </Button>
                <Button variant="ghost" size="sm">
                  View Metrics
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Training History</h3>
          <div className="mt-4 space-y-4">
            {trainingHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-700" />
                  {index < trainingHistory.length - 1 && (
                    <div className="mt-1 h-full w-px bg-slate-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                  <p className="text-xs text-slate-500">{entry.time}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl text-slate-900">Performance Comparison</h3>
        <p className="text-sm text-slate-500">Kurva mAP antar model selama epoch training.</p>

        <div className="mt-4 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={modelPerformanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="site1" name="Site 1" stroke="#1a7a4a" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="site2" name="Site 2" stroke="#0284c7" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="global" name="Global" stroke="#d97706" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <LineChartIcon size={16} className="text-primary-900" />
          Site 1 saat ini memimpin performa dengan mAP 0.78.
        </div>
      </section>
    </div>
  )
}
