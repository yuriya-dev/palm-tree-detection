import { useState } from 'react'
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

  return (
    <div className="space-y-6">
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
          <section className="card p-5">
            <div className="mb-4">
              <h3 className="font-display text-2xl text-slate-900">Interactive Tree Map</h3>
              <p className="text-sm text-slate-500">Klik marker untuk melihat detail pohon.</p>
            </div>
            <SiteMap markers={trees} height={460} zoom={12} interactive />
          </section>

          <section>
            <TreeTable trees={trees} pageSize={10} />
          </section>
        </>
      )}
    </div>
  )
}
