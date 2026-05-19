import { DownloadCloud, CheckCircle, XCircle, Clock } from 'lucide-react'
import DonutChart from '../charts/DonutChart'
import EmptyState from '../shared/EmptyState'
import Button from './Button'
import StatusBadge from './StatusBadge'
import Badge from './Badge'

const boxColor = {
  Healthy: 'border-emerald-500',
  Warning: 'border-amber-500',
  Critical: 'border-rose-500',
}

export default function DetectionResult({ result, onApprove, onReject, isReviewing, reviewDecision }) {
  if (!result) {
    return (
      <EmptyState
        title="Belum ada hasil deteksi"
        description="Jalankan deteksi untuk melihat bounding box, breakdown status, dan metrik hasil analisis."
      />
    )
  }

  const isPending = result.status === 'pending'
  const showReviewActions = Boolean(onApprove || onReject)
  const isApproved = reviewDecision === 'approved'

  const handleDownload = () => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Draw detections
      const colorMap = {
        Healthy: '#10b981',
        Warning: '#f59e0b',
        Critical: '#f43f5e',
      }
      const fallbackColor = '#06b6d4'
      
      result.detections.forEach((item) => {
        const x = (item.x / 100) * canvas.width
        const y = (item.y / 100) * canvas.height
        const w = (item.width / 100) * canvas.width
        const h = (item.height / 100) * canvas.height
        
        ctx.strokeStyle = colorMap[item.status] || fallbackColor
        ctx.lineWidth = Math.max(2, canvas.width * 0.003)
        ctx.strokeRect(x, y, w, h)
        
        const label = item.label || item.id
        if (label) {
          const fontSize = Math.max(14, canvas.width * 0.015)
          ctx.font = `600 ${fontSize}px sans-serif`
          ctx.textBaseline = 'top'
          
          const textStr = String(label)
          const textMetrics = ctx.measureText(textStr)
          const textWidth = textMetrics.width
          const padding = fontSize * 0.4
          
          const bgWidth = textWidth + padding * 2
          const bgHeight = fontSize + padding * 2
          const bgX = x
          const bgY = Math.max(0, y - bgHeight)
          
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
          
          ctx.fillStyle = '#ffffff'
          ctx.fillText(textStr, bgX + padding, bgY + padding)
        }
      })
      
      // Trigger download
      const link = document.createElement('a')
      link.download = `mopad-detection-result-${new Date().getTime()}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.click()
    }
    
    img.src = result.imageUrl
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-2xl text-slate-900">Detection Overlay</h3>
            {isPending && (
              <Badge color="yellow">
                <Clock size={12} />
                Pending Approval
              </Badge>
            )}
            {isApproved && (
              <Badge variant="success">
                <CheckCircle size={12} />
                Approved
              </Badge>
            )}
          </div>
          {!isPending && (
            <Button
              onClick={handleDownload}
              variant="secondary"
              size="sm"
            >
              <DownloadCloud size={14} />
              Download Result
            </Button>
          )}
        </div>

        {showReviewActions && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Review the detected trees after the boxes are shown.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Approve if the detection looks correct, or reject if there are missed or incorrect trees.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onApprove}
                disabled={isReviewing || isApproved}
              >
                <CheckCircle size={16} />
                {isReviewing ? 'Processing...' : isApproved ? 'Approved' : 'Approve Result'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={onReject}
                disabled={isReviewing || isApproved}
              >
                <XCircle size={16} />
                Reject Result
              </Button>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <img
            src={result.imageUrl}
            alt="Detection result"
            className="h-full w-full object-cover"
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
                {item.label || item.id}
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
          {result.prediction?.source ? (
            <p className="mt-1 text-xs text-slate-500">Inference source: {result.prediction.source}</p>
          ) : null}
        </div>

        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-800">Per-tree Status Breakdown</h4>
          <div className="mt-4 h-52">
            <DonutChart data={result.breakdown} />
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-scroll card space-y-3 p-5">
          <h4 className="text-sm font-semibold text-slate-800">Tree Status List</h4>
          {result.detections.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.label || item.id}</p>
                <p className="text-xs text-slate-500">{item.id}</p>
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
