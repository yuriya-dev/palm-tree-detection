import { Download, FileSpreadsheet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { apiEndpoints } from '../services/api'

const intensityClass = (value) => {
  if (value <= 2) return 'bg-emerald-50'
  if (value <= 5) return 'bg-emerald-100'
  if (value <= 8) return 'bg-emerald-200'
  if (value <= 11) return 'bg-emerald-300'
  return 'bg-emerald-500'
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('2026-04-01')
  const [endDate, setEndDate] = useState('2026-04-19')
  const [overview, setOverview] = useState(null)
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [siteComparison, setSiteComparison] = useState([])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [overviewResponse, trendResponse, treesResponse] = await Promise.all([
        apiEndpoints.analyticsOverview({ startDate, endDate }),
        apiEndpoints.analyticsTrend({ period: 'weekly' }),
        apiEndpoints.listTrees({ page: 1, limit: 200 }),
      ])

      const trendPoints = Array.isArray(trendResponse?.data?.points)
        ? trendResponse.data.points
        : []

      setOverview(overviewResponse?.data || null)
      setWeeklyTrend(
        trendPoints.map((point) => ({
          week: point.label,
          detections: Number(point.value || 0),
        })),
      )

      const trees = Array.isArray(treesResponse?.data) ? treesResponse.data : []
      const siteMap = trees.reduce((acc, tree) => {
        const siteKey = tree.site || 'Unknown'
        acc[siteKey] = (acc[siteKey] || 0) + 1
        return acc
      }, {})

      setSiteComparison(
        Object.entries(siteMap).map(([site, treesCount]) => ({
          site,
          trees: treesCount,
        })),
      )
    } catch (fetchError) {
      setOverview(null)
      setWeeklyTrend([])
      setSiteComparison([])
      setError(fetchError)
    } finally {
      setLoading(false)
    }
  }, [endDate, startDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalytics()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchAnalytics])

  const heatmapActivity = useMemo(() => {
    if (weeklyTrend.length === 0) {
      return []
    }

    return Array.from({ length: 28 }, (_, index) => {
      const trendPoint = weeklyTrend[index % weeklyTrend.length]
      const scaledValue = Math.max(1, Math.round(Number(trendPoint?.detections || 0) / 24))

      return {
        day: index + 1,
        value: scaledValue,
      }
    })
  }, [weeklyTrend])

  const trendDelta = useMemo(() => {
    if (weeklyTrend.length < 2) {
      return 0
    }

    const first = Number(weeklyTrend[0]?.detections || 0)
    const last = Number(weeklyTrend[weeklyTrend.length - 1]?.detections || 0)
    if (first === 0) {
      return 0
    }

    return Math.round(((last - first) / first) * 100)
  }, [weeklyTrend])

  const analyticsKpis = useMemo(() => {
    const totalTrees = Number(overview?.total_trees_detected || 0)
    const healthyTrees = Number(overview?.healthy_trees || 0)
    const warningTrees = Number(overview?.trees_needing_attention || 0)
    const areaCoverage = Number(overview?.area_coverage_ha || 0)

    return [
      {
        key: 'total',
        title: 'Total Trees',
        value: totalTrees,
        trend: trendDelta,
        icon: 'trees',
      },
      {
        key: 'healthy',
        title: 'Healthy Trees',
        value: healthyTrees,
        trend: totalTrees ? Math.round((healthyTrees / totalTrees) * 100) : 0,
        icon: 'shield',
      },
      {
        key: 'attention',
        title: 'Need Attention',
        value: warningTrees,
        trend: totalTrees ? -Math.round((warningTrees / totalTrees) * 100) : 0,
        icon: 'alert',
      },
      {
        key: 'coverage',
        title: 'Area Coverage (ha)',
        value: areaCoverage.toFixed(1),
        trend: 0,
        icon: 'map',
      },
    ]
  }, [overview, trendDelta])

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

  if (error && weeklyTrend.length === 0) {
    return (
      <EmptyState
        title="Gagal memuat analytics"
        description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
        actionLabel="Muat Ulang"
        onAction={fetchAnalytics}
      />
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

        {error && <p className="mt-4 text-xs text-rose-600">{error.message || 'Sebagian data analytics gagal dimuat.'}</p>}
      </section>
    </div>
  )
}
