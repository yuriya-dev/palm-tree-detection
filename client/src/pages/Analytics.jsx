import { Download, FileSpreadsheet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
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
import { toast } from '../components/shared/ToastProvider'
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

  const pageHelmet = (
    <Helmet>
      <title>Analytics | Palm Tree Detection</title>
      <meta
        name="description"
        content="Analisis tren deteksi, distribusi site, dan ringkasan performa periode tertentu."
      />
    </Helmet>
  )

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
        trend: null,
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

  const handleExportCSV = useCallback(() => {
    try {
      const rows = [
        ['Palm Tree Detection Analytics Report'],
        ['Periode', `${startDate} s/d ${endDate}`],
        ['Tanggal Dibuat', new Date().toLocaleString('id-ID')],
        [],
        ['Ringkasan KPI'],
        ['Metric', 'Nilai'],
        ...analyticsKpis.map((kpi) => [kpi.title, kpi.value]),
        [],
        ['Weekly Detection Trend'],
        ['Minggu', 'Jumlah Deteksi'],
        ...weeklyTrend.map((t) => [t.week, t.detections]),
        [],
        ['Site Comparison'],
        ['Site', 'Jumlah Pohon'],
        ...siteComparison.map((s) => [s.site, s.trees]),
      ]

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n')

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `analytics-report-${startDate}-to-${endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Laporan CSV berhasil diunduh.')
    } catch (err) {
      toast.error('Gagal mengekspor data CSV.')
    }
  }, [analyticsKpis, weeklyTrend, siteComparison, startDate, endDate])

  const handleExportPDF = useCallback(() => {
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Pop-up terblokir oleh browser. Izinkan pop-up untuk mengekspor PDF.')
        return
      }

      const kpiRows = analyticsKpis
        .map(
          (kpi) => `
            <div style="flex: 1; min-width: 140px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
              <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">${kpi.title}</div>
              <div style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px;">${kpi.value}</div>
            </div>
          `,
        )
        .join('')

      const trendRows = weeklyTrend
        .map(
          (t) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${t.week}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${t.detections}</td>
            </tr>
          `,
        )
        .join('')

      const siteRows = siteComparison
        .map(
          (s) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${s.site}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${s.trees}</td>
            </tr>
          `,
        )
        .join('')

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Analytics Report - ${startDate} s/d ${endDate}</title>
            <style>
              body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; padding: 24px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a7a4a; margin-bottom: 4px; font-size: 24px; }
              .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
              .section-title { font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; color: #1e293b; border-bottom: 2px solid #1a7a4a; padding-bottom: 4px; }
              .kpi-container { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
              th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }
              th.right, td.right { text-align: right; }
              .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Palm Tree Detection - Laporan Analisis</h1>
            <div class="subtitle">Periode: <strong>${startDate}</strong> sampai <strong>${endDate}</strong> | Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>

            <div class="section-title">Ringkasan Performa (KPI)</div>
            <div class="kpi-container">
              ${kpiRows}
            </div>

            <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-top: 20px;">
              <div style="flex: 1; min-width: 300px;">
                <div class="section-title">Tren Deteksi Mingguan</div>
                <table>
                  <thead>
                    <tr>
                      <th>Minggu</th>
                      <th class="right">Total Deteksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${trendRows}
                  </tbody>
                </table>
              </div>
              <div style="flex: 1; min-width: 300px;">
                <div class="section-title">Perbandingan per Lokasi (Site)</div>
                <table>
                  <thead>
                    <tr>
                      <th>Lokasi (Site)</th>
                      <th class="right">Jumlah Pohon</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${siteRows}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="footer">
              Laporan otomatis didapatkan dari Sistem Monitoring & Deteksi Kelapa Sawit.
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      toast.success('Window cetak / simpan PDF telah dibuka.')
    } catch (err) {
      toast.error('Gagal menyiapkan cetak PDF.')
    }
  }, [analyticsKpis, weeklyTrend, siteComparison, startDate, endDate])

  if (loading) {
    return (
      <div className="space-y-6">
        {pageHelmet}
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
      <>
        {pageHelmet}
        <EmptyState
          title="Gagal memuat analytics"
          description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
          actionLabel="Muat Ulang"
          onAction={fetchAnalytics}
        />
      </>
    )
  }

  if (weeklyTrend.length === 0) {
    return (
      <>
        {pageHelmet}
        <EmptyState
          title="Belum ada data analytics"
          description="Aktivitas deteksi dan laporan periodik akan ditampilkan di halaman ini."
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {pageHelmet}

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
          <Button variant="secondary" onClick={handleExportPDF}>
            <Download size={15} />
            Export PDF
          </Button>
          <Button variant="ghost" onClick={handleExportCSV}>
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
