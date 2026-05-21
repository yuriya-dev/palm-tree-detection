import { Download, LineChart as LineChartIcon, PlayCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
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
  artifactPath: model.artifact_path || model.artifactPath || '',
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
  const fileInputRef = useRef(null)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activatingID, setActivatingID] = useState('')
  const [creating, setCreating] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [metricsByModel, setMetricsByModel] = useState({})
  const [selectedModelId, setSelectedModelId] = useState('')
  const [newModel, setNewModel] = useState({
    name: '',
    site: 'Site 1',
    accuracy: '0',
    map: '0',
    status: 'Inactive',
    file: null,
  })

  const loadModels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiEndpoints.listModels()
      const payload = Array.isArray(response?.data) ? response.data : []
      const mappedModels = payload.map(mapModel)
      const activeModelId = mappedModels.find((model) => model.status?.toLowerCase() === 'active')?.id || ''

      setModels(mappedModels)
      setSelectedModelId((current) => {
        if (activeModelId) {
          return activeModelId
        }

        if (mappedModels.some((model) => model.id === current)) {
          return current
        }

        return mappedModels[0]?.id || ''
      })

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

  const pageHelmet = (
    <Helmet>
      <title>Models | Palm Tree Detection</title>
      <meta
        name="description"
        content="Kelola model, unggah file .pt, aktifkan model, dan lihat performa tiap model."
      />
    </Helmet>
  )

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

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || models[0] || null,
    [models, selectedModelId],
  )

  const selectedMetrics = selectedModel ? metricsByModel[selectedModel.id] : null

  const bestModel = useMemo(() => {
    if (models.length === 0) {
      return null
    }

    return [...models].sort((a, b) => b.map - a.map)[0]
  }, [models])

  const handleActivate = async (id) => {
    setActivatingID(id)
    setError(null)
    setSelectedModelId(id)

    try {
      await apiEndpoints.activateModel(id)
      await loadModels()
    } catch (activateError) {
      setError(activateError)
    } finally {
      setActivatingID('')
    }
  }

  const handleExport = async (id) => {
    setError(null)

    try {
      const response = await apiEndpoints.exportModel(id)
      const payload = response?.data || {}
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = `${id.toLowerCase() || 'model'}-export.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(exportError)
    }
  }

  const handleCreateModel = async (event) => {
    event.preventDefault()
    setCreating(true)
    setError(null)

    try {
      if (!newModel.file) {
        throw new Error('Silakan pilih file model .pt terlebih dahulu.')
      }

      const formData = new FormData()
      formData.append('file', newModel.file)
      formData.append('name', newModel.name)
      formData.append('site', newModel.site)
      formData.append('accuracy', String(newModel.accuracy || 0))
      formData.append('map', String(newModel.map || 0))
      formData.append('status', newModel.status)

      await apiEndpoints.createModel(formData)

      setNewModel({
        name: '',
        site: 'Site 1',
        accuracy: '0',
        map: '0',
        status: 'Inactive',
        file: null,
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setShowRegisterForm(false)
      await loadModels()
    } catch (createError) {
      setError(createError)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteModel = async (id) => {
    const confirmed = window.confirm('Hapus model ini dari daftar? File .pt tetap disimpan.')
    if (!confirmed) {
      return
    }

    setError(null)

    try {
      await apiEndpoints.deleteModel(id)
      await loadModels()
    } catch (deleteError) {
      setError(deleteError)
    }
  }

  if (loading) {
    return (
      <>
        {pageHelmet}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[620px]" />
          <Skeleton className="h-[620px]" />
        </div>
      </>
    )
  }

  if (error && models.length === 0) {
    return (
      <>
        {pageHelmet}
        <EmptyState
          title="Gagal memuat models"
          description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
          actionLabel="Muat Ulang"
          onAction={loadModels}
        />
      </>
    )
  }

  if (models.length === 0) {
    return (
      <>
        {pageHelmet}
        <EmptyState
          title="Belum ada model"
          description="Upload model .pt pertama Anda untuk mulai mengelola model yang aktif."
          actionLabel="Register Model"
          onAction={() => setShowRegisterForm(true)}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {pageHelmet}

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-6 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-slate-900">Register Model</h3>
              <p className="text-sm text-slate-500">
                Upload file .pt lalu isi metadata model untuk mendaftarkannya ke backend.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setShowRegisterForm((current) => !current)} type="button">
              {showRegisterForm ? 'Hide Form' : 'Register Model'}
            </Button>
          </div>

          {showRegisterForm && (
            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateModel}>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pt"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null
                  setNewModel((current) => ({ ...current, file: selectedFile }))
                }}
              />

              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Nama Model</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none transition focus:border-primary-500"
                  value={newModel.name}
                  onChange={(event) => setNewModel((current) => ({ ...current, name: event.target.value }))}
                  placeholder="PalmNet Site 4"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Site</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none transition focus:border-primary-500"
                  value={newModel.site}
                  onChange={(event) => setNewModel((current) => ({ ...current, site: event.target.value }))}
                  placeholder="Site 1"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Accuracy</span>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none transition focus:border-primary-500"
                  value={newModel.accuracy}
                  onChange={(event) => setNewModel((current) => ({ ...current, accuracy: event.target.value }))}
                  placeholder="95.2"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">mAP</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none transition focus:border-primary-500"
                  value={newModel.map}
                  onChange={(event) => setNewModel((current) => ({ ...current, map: event.target.value }))}
                  placeholder="0.78"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Status</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none transition focus:border-primary-500"
                  value={newModel.status}
                  onChange={(event) => setNewModel((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="Inactive">Inactive</option>
                  <option value="Training">Training</option>
                  <option value="Active">Active</option>
                </select>
              </label>

              <div className="md:col-span-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">File Model</p>
                    <p className="text-xs text-slate-500">
                      Pilih file .pt dari perangkat. Nama file akan disimpan sebagai artifact_path.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  {newModel.file ? newModel.file.name : 'Belum ada file dipilih.'}
                </p>
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Saving...' : 'Add Model'}
                </Button>
                <p className="text-xs text-slate-500">
                  Kosongkan nama jika ingin diambil dari nama file `.pt`.
                </p>
              </div>
            </form>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {models.map((model) => (
            <article key={model.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{model.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-800">{model.name}</h3>
                  <p className="text-sm text-slate-500">{model.site}</p>
                  {model.artifactPath && <p className="text-xs text-slate-400">{model.artifactPath}</p>}
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
                <Button variant="ghost" size="sm" onClick={() => handleExport(model.id)}>
                  <Download size={14} />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedModelId(model.id)}>
                  View Metrics
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteModel(model.id)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>

        {selectedModel && (
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model Detail</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-800">{selectedModel.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedModel.site} · {selectedModel.status}
                </p>
              </div>
              <StatusBadge status={selectedModel.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Accuracy</p>
                <p className="font-semibold text-slate-800">{formatPercent(selectedModel.accuracy)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">mAP</p>
                <p className="font-semibold text-slate-800">{formatMAP(selectedModel.map)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Backend Metrics</p>
                <p className="font-semibold text-slate-800">
                  {selectedMetrics ? `${selectedMetrics.precision.length} epochs` : 'Loading...'}
                </p>
              </div>
            </div>

            {selectedMetrics && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Precision</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedMetrics.precision.map((value) => value.toFixed(2)).join(' · ')}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recall</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedMetrics.recall.map((value) => value.toFixed(2)).join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Training History</h3>
          <div className="mt-4 space-y-4">
            {trainingHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-700" />
                  {index < trainingHistory.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
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
