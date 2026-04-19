import { Download, FileSpreadsheet } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import TrendLine from '../components/charts/TrendLine'
import EmptyState from '../components/shared/EmptyState'
import Skeleton, { StatGridSkeleton } from '../components/shared/Skeleton'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import {
  analyticsKpis,
  heatmapActivity,
  siteComparison,
  weeklyTrend,
} from '../utils/mockData'

const intensityClass = (value) => {
  if (value <= 2) return 'bg-emerald-50'
  if (value <= 5) return 'bg-emerald-100'
  if (value <= 8) return 'bg-emerald-200'
  if (value <= 11) return 'bg-emerald-300'
  return 'bg-emerald-500'
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('2026-04-01')
  const [endDate, setEndDate] = useState('2026-04-19')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 750)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <StatGridSkeleton />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (weeklyTrend.length === 0) {
    return (
      <EmptyState
        title="Belum ada data analytics"
        description="Aktivitas deteksi dan laporan periodik akan ditampilkan di halaman ini."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary">
            <Download size={15} />
            Export PDF
          </Button>
          <Button variant="ghost">
            <FileSpreadsheet size={15} />
            Export CSV
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsKpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Weekly Detection Trend</h3>
          <div className="mt-4 h-72">
            <TrendLine data={weeklyTrend} dataKey="detections" xKey="week" />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Site Comparison</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteComparison} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
                <XAxis dataKey="site" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
                  }}
                />
                <Bar dataKey="trees" fill="#1a7a4a" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl text-slate-900">Detection Activity Heatmap</h3>
        <p className="text-sm text-slate-500">Semakin gelap warna hijau, semakin tinggi aktivitas deteksi.</p>

        <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-14">
          {heatmapActivity.map((item) => (
            <div
              key={item.day}
              className={`h-8 rounded-md ${intensityClass(item.value)}`}
              title={`Day ${item.day}: ${item.value} detections`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
