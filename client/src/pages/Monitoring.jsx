import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import SiteMap from '../components/maps/SiteMap'
import EmptyState from '../components/shared/EmptyState'
import Skeleton, { TableSkeleton } from '../components/shared/Skeleton'
import TreeTable from '../components/ui/TreeTable'
import useTrees from '../hooks/useTrees'

const defaultFilters = {
  site: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
}

export default function Monitoring() {
  const [filters, setFilters] = useState(defaultFilters)
  const { trees, loading, error, isEmpty } = useTrees(filters)
  const [mapCenter, setMapCenter] = useState(null)
  const [mapZoom, setMapZoom] = useState(16)
  const [selectedTreeId, setSelectedTreeId] = useState(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  useEffect(() => {
    if (isMapFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMapFullscreen])

  const handleViewTree = (tree) => {
    setMapCenter([tree.lat, tree.lng])
    setMapZoom(18) // Zoom in closely when focusing on a tree
    setSelectedTreeId(tree.id)
  }

  const stats = useMemo(() => {
    const total = trees.length
    const healthy = trees.filter((t) => t.status === 'Healthy').length
    const warning = trees.filter((t) => t.status === 'Warning').length
    const critical = trees.filter((t) => t.status === 'Critical').length
    return { total, healthy, warning, critical }
  }, [trees])

  const pageHelmet = (
    <Helmet>
      <title>Monitoring | Palm Tree Detection</title>
      <meta
        name="description"
        content="Pantau pohon pada peta interaktif dan tabel status berdasarkan filter site dan tanggal."
      />
    </Helmet>
  )

  return (
    <div className="space-y-6">
      {pageHelmet}

      <section className="card grid gap-4 p-5 md:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Site</span>
          <select
            value={filters.site}
            onChange={(event) => setFilters((prev) => ({ ...prev, site: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">All Sites</option>
            <option value="Site 1">Site 1</option>
            <option value="Site 2">Site 2</option>
            <option value="Site 3">Site 3</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Date</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>
      </section>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[460px]" />
          <TableSkeleton rows={8} />
        </div>
      ) : error ? (
        <EmptyState
          title="Gagal mengambil data pohon"
          description={error?.message || 'Pastikan backend API sedang berjalan, lalu coba lagi.'}
        />
      ) : isEmpty ? (
        <EmptyState
          title="Data pohon tidak ditemukan"
          description="Coba ubah kombinasi filter site, status, atau rentang tanggal untuk melihat hasil lain."
        />
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            {/* Map Card */}
            <div className={`flex flex-col p-5 h-full min-h-[500px] ${isMapFullscreen ? 'no-transform' : 'card'}`}>
              <div className="mb-4">
                <h3 className="font-display text-2xl text-slate-900">Interactive Tree Map</h3>
                <p className="text-sm text-slate-500">Klik marker untuk melihat detail pohon. Klik ikon pojok kanan atas untuk memperbesar peta.</p>
              </div>
              <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-100 min-h-[380px]">
                <SiteMap 
                  markers={trees} 
                  height="100%" 
                  zoom={mapZoom} 
                  center={mapCenter} 
                  selectedTreeId={selectedTreeId}
                  onSelectTree={handleViewTree}
                  isFullscreen={isMapFullscreen}
                  onToggleFullscreen={() => setIsMapFullscreen(!isMapFullscreen)}
                  interactive 
                />
              </div>
            </div>

            {/* Quick Stats Sidebar Card */}
            <div className="flex flex-col gap-6">
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Health Distribution</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-100/60 p-4 text-center">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Healthy</p>
                    <p className="mt-2 text-3xl font-display text-emerald-900">{stats.healthy}</p>
                    <p className="text-[10px] text-emerald-500 mt-1">{(stats.healthy / (stats.total || 1) * 100).toFixed(0)}% of total</p>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 border border-amber-100/60 p-4 text-center">
                    <p className="text-xs font-semibold text-amber-600 uppercase">Warning</p>
                    <p className="mt-2 text-3xl font-display text-amber-900">{stats.warning}</p>
                    <p className="text-[10px] text-amber-500 mt-1">{(stats.warning / (stats.total || 1) * 100).toFixed(0)}% of total</p>
                  </div>
                  <div className="rounded-xl bg-rose-50/70 border border-rose-100/60 p-4 text-center">
                    <p className="text-xs font-semibold text-rose-600 uppercase">Critical</p>
                    <p className="mt-2 text-3xl font-display text-rose-900">{stats.critical}</p>
                    <p className="text-[10px] text-rose-500 mt-1">{(stats.critical / (stats.total || 1) * 100).toFixed(0)}% of total</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Total Trees</p>
                    <p className="mt-2 text-3xl font-display text-slate-900">{stats.total}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Registered</p>
                  </div>
                </div>
              </div>

              <div className="card flex-1 p-5 max-h-[300px] overflow-y-auto">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Critical Tree List</h4>
                {trees.filter(t => t.status === 'Critical').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No critical trees in this filtered view.</p>
                ) : (
                  <div className="space-y-2">
                    {trees.filter(t => t.status === 'Critical').slice(0, 5).map(tree => (
                      <button
                        key={tree.id}
                        onClick={() => handleViewTree(tree)}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg bg-rose-50/50 border border-rose-100/40 px-3 py-2 text-xs transition hover:bg-rose-100/45 hover:border-rose-200"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-rose-900">{tree.id}</p>
                          <p className="text-[10px] text-slate-500">{tree.lat.toFixed(5)}, {tree.lng.toFixed(5)}</p>
                        </div>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-800">
                          Critical
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <TreeTable trees={trees} pageSize={10} onViewTree={handleViewTree} />
          </section>
        </>
      )}
    </div>
  )
}
