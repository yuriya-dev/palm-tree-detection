import { Download, LineChart as LineChartIcon, PlayCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import EmptyState from '../components/shared/EmptyState'
import Skeleton from '../components/shared/Skeleton'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { apiEndpoints } from '../services/api'

const chartColors = ['#1a7a4a', '#0284c7', '#d97706']

const mapModel = (model) => ({
  id: model.id,
  name: model.name,
  site: model.site,
  accuracy: Number(model.accuracy || 0),
  map: Number(model.map || 0),
  status: model.status,
})

const formatPercent = (value) => {
  const normalized = Number(value || 0)
  if (normalized <= 1) {
    return `${(normalized * 100).toFixed(1)}%`
  }

  return `${normalized.toFixed(1)}%`
}

const formatMAP = (value) => Number(value || 0).toFixed(2)

export default function Models() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activatingID, setActivatingID] = useState('')
  const [metricsByModel, setMetricsByModel] = useState({})

  const loadModels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiEndpoints.listModels()
      const payload = Array.isArray(response?.data) ? response.data : []
      const mappedModels = payload.map(mapModel)

      setModels(mappedModels)

      const metricEntries = await Promise.all(
        mappedModels.map(async (model) => {
          try {
            const metricsResponse = await apiEndpoints.getModelMetrics(model.id)
            return [model.id, metricsResponse?.data || null]
          } catch {
            return [model.id, null]
          }
        }),
      )

      setMetricsByModel(Object.fromEntries(metricEntries))
    } catch (fetchError) {
      setModels([])
      setMetricsByModel({})
      setError(fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const modelSeries = useMemo(
    () =>
      models.slice(0, 3).map((model, index) => ({
        id: model.id,
        name: model.site || model.name,
        key: `model${index + 1}`,
        color: chartColors[index % chartColors.length],
      })),
    [models],
  )

  const modelPerformanceTrend = useMemo(() => {
    const maxEpoch = Math.max(
      1,
      ...modelSeries.map((series) => {
        const metrics = metricsByModel[series.id]
        return Array.isArray(metrics?.precision) ? metrics.precision.length : 0
      }),
    )

    return Array.from({ length: maxEpoch }, (_, epochIndex) => {
      const row = { epoch: `E${epochIndex + 1}` }

      modelSeries.forEach((series) => {
        const metrics = metricsByModel[series.id]
        const fallback = Number(models.find((item) => item.id === series.id)?.map || 0)
        const precision = Array.isArray(metrics?.precision) ? metrics.precision[epochIndex] : undefined
        row[series.key] = Number(precision ?? fallback)
      })

      return row
    })
  }, [metricsByModel, modelSeries, models])

  const trainingHistory = useMemo(
    () =>
      models.map((model) => ({
        id: model.id,
        title: `${model.name} (${model.site})`,
        time: model.status,
        detail: `Accuracy ${formatPercent(model.accuracy)} | mAP ${formatMAP(model.map)}`,
      })),
    [models],
  )

  const bestModel = useMemo(() => {
    if (models.length === 0) {
      return null
    }

    return [...models].sort((a, b) => b.map - a.map)[0]
  }, [models])

  const handleActivate = async (id) => {
    setActivatingID(id)
    setError(null)

    try {
      await apiEndpoints.activateModel(id)
      await loadModels()
    } catch (activateError) {
      setError(activateError)
    } finally {
      setActivatingID('')
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-[620px]" />
        <Skeleton className="h-[620px]" />
      </div>
    )
  }

  if (error && models.length === 0) {
    return (
      <EmptyState
        title="Gagal memuat model"
        description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
        actionLabel="Muat Ulang"
        onAction={loadModels}
      />
    )
  }

  if (models.length === 0) {
    return (
      <EmptyState
        title="Belum ada model"
        description="Model terlatih akan muncul di halaman ini setelah proses training selesai."
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {models.map((model) => (
            <article key={model.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{model.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-800">{model.name}</h3>
                  <p className="text-sm text-slate-500">{model.site}</p>
                </div>
                <StatusBadge status={model.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Accuracy</p>
                  <p className="font-semibold text-slate-800">{formatPercent(model.accuracy)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">mAP</p>
                  <p className="font-semibold text-slate-800">{formatMAP(model.map)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleActivate(model.id)}
                  disabled={model.status?.toLowerCase() === 'active' || activatingID === model.id}
                >
                  <PlayCircle size={14} />
                  {activatingID === model.id ? 'Updating...' : 'Set Active'}
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Download size={14} />
                  Download
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  View Metrics
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Training History</h3>
          <div className="mt-4 space-y-4">
            {trainingHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-700" />
                  {index < trainingHistory.length - 1 && (
                    <div className="mt-1 h-full w-px bg-slate-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                  <p className="text-xs text-slate-500">{entry.time}</p>
                  <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl text-slate-900">Performance Comparison</h3>
        <p className="text-sm text-slate-500">Kurva mAP antar model selama epoch training.</p>

        <div className="mt-4 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={modelPerformanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  boxShadow: '0 6px 20px rgba(2, 6, 23, 0.08)',
                }}
              />
              <Legend />
              {modelSeries.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <LineChartIcon size={16} className="text-primary-900" />
          {bestModel
            ? `${bestModel.site} saat ini memimpin performa dengan mAP ${formatMAP(bestModel.map)}.`
            : 'Belum ada data performa model.'}
        </div>

        {error && <p className="mt-3 text-xs text-rose-600">{error.message || 'Operasi model gagal diproses.'}</p>}
      </section>
    </div>
  )
}
