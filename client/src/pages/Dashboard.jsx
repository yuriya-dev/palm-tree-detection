import { useCallback, useEffect, useState } from 'react'
import DetectionChart from '../components/charts/DetectionChart'
import SiteMap from '../components/maps/SiteMap'
import EmptyState from '../components/shared/EmptyState'
import Skeleton, { StatGridSkeleton, TableSkeleton } from '../components/shared/Skeleton'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import { apiEndpoints } from '../services/api'

const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }

  return date.toLocaleDateString('id-ID')
}

const mapDetection = (item) => ({
  id: item.id,
  treeId: item.tree_id || item.treeId,
  site: item.site,
  status: item.status,
  confidence: Number(item.confidence || 0),
  detectedAt: formatDate(item.created_at || item.createdAt),
})

const mapTree = (item) => ({
  id: item.id,
  site: item.site,
  lat: Number(item.lat),
  lng: Number(item.lng),
  status: item.status,
  confidence: Number(item.confidence || 0),
})

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState([])
  const [monthlyDetectionData, setMonthlyDetectionData] = useState([])
  const [recentDetections, setRecentDetections] = useState([])
  const [sitePreviewMarkers, setSitePreviewMarkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [
        treeStatsResponse,
        overviewResponse,
        trendResponse,
        detectionsResponse,
        treesResponse,
      ] = await Promise.all([
        apiEndpoints.getTreeStats(),
        apiEndpoints.analyticsOverview(),
        apiEndpoints.analyticsTrend({ period: 'weekly' }),
        apiEndpoints.listDetections({ page: 1, limit: 5 }),
        apiEndpoints.listTrees({ page: 1, limit: 20 }),
      ])

      const treeStats = treeStatsResponse?.data || {}
      const overview = overviewResponse?.data || {}
      const trendPoints = Array.isArray(trendResponse?.data?.points)
        ? trendResponse.data.points
        : []

      const trendDelta =
        trendPoints.length >= 2 && Number(trendPoints[0]?.value || 0) !== 0
          ? Math.round(
              ((Number(trendPoints[trendPoints.length - 1]?.value || 0) - Number(trendPoints[0]?.value || 0)) /
                Number(trendPoints[0]?.value || 0)) *
                100,
            )
          : 0

      setDashboardStats([
        {
          key: 'total',
          title: 'Total Trees',
          value: Number(treeStats.total || 0),
          trend: trendDelta,
          icon: 'trees',
        },
        {
          key: 'healthy',
          title: 'Healthy Trees',
          value: Number(treeStats.healthy || 0),
          trend: Number(treeStats.total || 0)
            ? Math.round((Number(treeStats.healthy || 0) / Number(treeStats.total || 0)) * 100)
            : 0,
          icon: 'shield',
        },
        {
          key: 'attention',
          title: 'Need Attention',
          value: Number(treeStats.warning || 0) + Number(treeStats.critical || 0),
          trend: Number(treeStats.total || 0)
            ? -Math.round(
                ((Number(treeStats.warning || 0) + Number(treeStats.critical || 0)) /
                  Number(treeStats.total || 0)) *
                  100,
              )
            : 0,
          icon: 'alert',
        },
        {
          key: 'coverage',
          title: 'Area Coverage (ha)',
          value: Number(overview.area_coverage_ha || 0).toFixed(1),
          trend: 0,
          icon: 'map',
        },
      ])

      setMonthlyDetectionData(
        trendPoints.map((point) => ({
          month: point.label,
          trees: Number(point.value || 0),
        })),
      )

      setRecentDetections(
        (Array.isArray(detectionsResponse?.data) ? detectionsResponse.data : []).map(mapDetection),
      )

      setSitePreviewMarkers(
        (Array.isArray(treesResponse?.data) ? treesResponse.data : []).map(mapTree),
      )
    } catch (fetchError) {
      setDashboardStats([])
      setMonthlyDetectionData([])
      setRecentDetections([])
      setSitePreviewMarkers([])
      setError(fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <StatGridSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  if (error && dashboardStats.length === 0) {
    return (
      <EmptyState
        title="Gagal memuat dashboard"
        description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
        actionLabel="Muat Ulang"
        onAction={loadDashboard}
      />
    )
  }

  if (dashboardStats.length === 0) {
    return (
      <EmptyState
        title="Belum ada data dashboard"
        description="Data overview akan muncul setelah pipeline deteksi pertama selesai diproses."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display text-2xl text-slate-900">Detection Overview</h3>
            <p className="text-sm text-slate-500">Tren jumlah pohon terdeteksi per bulan.</p>
          </div>
          <div className="h-72">
            <DetectionChart data={monthlyDetectionData} />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-display text-2xl text-slate-900">Site Map Preview</h3>
            <p className="text-sm text-slate-500">Minimap lokasi pengamatan dan status site.</p>
          </div>
          <SiteMap markers={sitePreviewMarkers} height={288} zoom={12} interactive={false} />
        </div>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-display text-2xl text-slate-900">Recent Detections</h3>
          <p className="text-sm text-slate-500">5 hasil deteksi terbaru dari seluruh site.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Detection ID</th>
                <th className="px-5 py-3">Tree ID</th>
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {recentDetections.map((row) => (
                <tr key={row.id} className="transition-colors duration-200 hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.id}</td>
                  <td className="px-5 py-3">{row.treeId}</td>
                  <td className="px-5 py-3">{row.site}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3">{(row.confidence * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3">{row.detectedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="px-5 py-3 text-xs text-rose-600">{error.message || 'Sebagian data dashboard gagal dimuat.'}</p>}
      </section>
    </div>
  )
}
