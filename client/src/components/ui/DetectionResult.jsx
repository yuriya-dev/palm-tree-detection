import { DownloadCloud } from 'lucide-react'
import DonutChart from '../charts/DonutChart'
import EmptyState from '../shared/EmptyState'
import Button from './Button'
import StatusBadge from './StatusBadge'

const boxColor = {
  Healthy: 'border-emerald-500',
  Warning: 'border-amber-500',
  Critical: 'border-rose-500',
}

export default function DetectionResult({ result }) {
  if (!result) {
    return (
      <EmptyState
        title="Belum ada hasil deteksi"
        description="Jalankan deteksi untuk melihat bounding box, breakdown status, dan metrik hasil analisis."
      />
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl text-slate-900">Detection Overlay</h3>
          <Button
            as="a"
            href={result.imageUrl}
            download="mopad-detection-result.jpg"
            variant="secondary"
            size="sm"
          >
            <DownloadCloud size={14} />
            Download Result
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img
            src={result.imageUrl}
            alt="Detection result"
            className="h-[360px] w-full object-cover"
          />

          {result.detections.map((item) => (
            <div
              key={item.id}
              className={`absolute border-2 ${boxColor[item.status] || 'border-cyan-500'}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.width}%`,
                height: `${item.height}%`,
              }}
            >
              <span className="absolute -top-6 left-0 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {item.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detection Count</p>
          <p className="mt-2 font-display text-4xl text-primary-900">{result.count}</p>
          <p className="mt-1 text-xs text-slate-500">Model: {result.selectedModel}</p>
        </div>

        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-800">Per-tree Status Breakdown</h4>
          <div className="mt-4 h-52">
            <DonutChart data={result.breakdown} />
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h4 className="text-sm font-semibold text-slate-800">Tree Status List</h4>
          {result.detections.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.id}</p>
                <p className="text-xs text-slate-500">Confidence: {(item.confidence * 100).toFixed(1)}%</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
