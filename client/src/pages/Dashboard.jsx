import { useEffect, useState } from 'react'
import DetectionChart from '../components/charts/DetectionChart'
import SiteMap from '../components/maps/SiteMap'
import EmptyState from '../components/shared/EmptyState'
import Skeleton, { StatGridSkeleton, TableSkeleton } from '../components/shared/Skeleton'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import {
  dashboardStats,
  monthlyDetectionData,
  recentDetections,
  sitePreviewMarkers,
} from '../utils/mockData'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

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
      </section>
    </div>
  )
}
