import { Download, Eye, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import DonutChart from '../components/charts/DonutChart'
import EmptyState from '../components/shared/EmptyState'
import Skeleton from '../components/shared/Skeleton'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { datasetComposition, datasets } from '../utils/mockData'

export default function Datasets() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <EmptyState
        title="Belum ada dataset"
        description="Unggah dataset pertama Anda untuk memulai proses training dan evaluasi model."
        actionLabel="Upload Dataset"
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datasets.map((dataset) => (
            <article key={dataset.id} className="card p-4">
              <div className="h-32 rounded-lg bg-gradient-to-br from-emerald-100 via-green-50 to-cyan-50" />
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dataset.id}</p>
                <h3 className="font-semibold text-slate-800">{dataset.site}</h3>
                <p className="text-xs text-slate-500">{dataset.images} images</p>
                <p className="text-xs text-slate-500">{dataset.annotations} annotations</p>
              </div>

              <div className="mt-3">
                <StatusBadge status={dataset.format} />
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Download size={14} />
                  Download
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Eye size={14} />
                  View
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Upload Dataset</h3>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-white p-3 text-primary-900 shadow-sm">
              <UploadCloud size={20} />
            </div>
            <p className="text-sm text-slate-500">Drag and drop archive dataset (COCO) atau pilih file dari perangkat.</p>
            <Button className="mt-4">Select Dataset File</Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Dataset Statistics</h3>
          <p className="text-sm text-slate-500">Komposisi train, validation, dan test.</p>
          <div className="mt-4 h-64">
            <DonutChart data={datasetComposition} />
          </div>
        </div>

        <div className="card space-y-2 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Quick summary</p>
          <p>Total datasets: {datasets.length}</p>
          <p>Total images: {datasets.reduce((sum, item) => sum + item.images, 0)}</p>
          <p>Total annotations: {datasets.reduce((sum, item) => sum + item.annotations, 0)}</p>
        </div>
      </section>
    </div>
  )
}
