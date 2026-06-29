import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Cpu,
  Download,
  FileCode,
  LineChart as LineChartIcon,
  MapPin,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
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
import { toast } from '../components/shared/ToastProvider'
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
    accuracy: '',
    map: '',
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
      toast.success('Model berhasil diaktifkan.')
      await loadModels()
    } catch (activateError) {
      setError(activateError)
      toast.error('Gagal mengaktifkan model.')
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
      toast.success('File konfigurasi model berhasil diekspor.')
    } catch (exportError) {
      setError(exportError)
      toast.error('Gagal mengekspor model.')
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
      toast.success('Model baru berhasil terdaftar!')

      setNewModel({
        name: '',
        site: 'Site 1',
        accuracy: '',
        map: '',
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
      toast.error(createError.message || 'Gagal mendaftarkan model baru.')
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
      toast.success('Model berhasil dihapus.')
      await loadModels()
    } catch (deleteError) {
      setError(deleteError)
      toast.error('Gagal menghapus model.')
    }
  }

  if (loading) {
    return (
      <>
        {pageHelmet}
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 sm:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
          </div>
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

  const activeModel = models.find((m) => m.status?.toLowerCase() === 'active')

  return (
    <div className="space-y-6">
      {pageHelmet}

      {/* Header Banner & Controls */}
      <section className="flex flex-wrap items-center justify-between gap-4 card p-5 bg-gradient-to-r from-primary-900 to-primary-500 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-white">Model Management</h2>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Kelola bobot AI PyTorch (`.pt`), pantau performa akurasi, dan aktifkan model terbaik untuk proses deteksi.
          </p>
        </div>
        <Button
          variant={showRegisterForm ? 'secondary' : 'primary'}
          onClick={() => setShowRegisterForm((current) => !current)}
          type="button"
          className="shadow-sm"
        >
          {showRegisterForm ? <X size={16} /> : <Plus size={16} />}
          {showRegisterForm ? 'Tutup Form' : 'Register Model Baru'}
        </Button>
      </section>

      {/* Hero Quick Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-primary-50 p-3.5 text-primary-700">
            <Cpu size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Model</p>
            <p className="text-2xl font-bold text-slate-900">{models.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-emerald-50 p-3.5 text-emerald-700">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model Aktif</p>
            <p className="text-base font-bold text-slate-900 truncate max-w-[150px]">
              {activeModel ? activeModel.name : 'Belum Ada'}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-amber-50 p-3.5 text-amber-700">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">mAP Tertinggi</p>
            <p className="text-2xl font-bold text-slate-900">{bestModel ? formatMAP(bestModel.map) : '0.00'}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-sky-50 p-3.5 text-sky-700">
            <LineChartIcon size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Akurasi Terbaik</p>
            <p className="text-2xl font-bold text-slate-900">{bestModel ? formatPercent(bestModel.accuracy) : '0%'}</p>
          </div>
        </div>
      </section>

      {/* Redesigned Register Model Form Drawer / Container */}
      {showRegisterForm && (
        <section className="card p-6 border-2 border-primary-100 bg-white shadow-lg transition-all duration-300 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-xl text-slate-900 flex items-center gap-2">
                <Plus className="text-primary-700" size={20} />
                Register Model AI Baru
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Mendaftarkan bobot model PyTorch (`.pt`) beserta metadata dan tolok ukur performa awal.
              </p>
            </div>
            <button
              onClick={() => setShowRegisterForm(false)}
              className="text-slate-400 hover:text-slate-600 transition p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]" onSubmit={handleCreateModel}>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pt"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null
                setNewModel((current) => ({
                  ...current,
                  file: selectedFile,
                  name: current.name || selectedFile?.name.replace('.pt', '') || '',
                }))
              }}
            />

            {/* Left Column: Input Fields */}
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Cpu size={14} className="text-slate-400" />
                    Nama Model
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    value={newModel.name}
                    onChange={(event) => setNewModel((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Contoh: PalmNet YOLOv8-Site4"
                  />
                </label>

                <label className="space-y-1.5 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    Lokasi / Site
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    value={newModel.site}
                    onChange={(event) => setNewModel((current) => ({ ...current, site: event.target.value }))}
                    placeholder="Contoh: Site 1"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1.5 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Accuracy (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    value={newModel.accuracy}
                    onChange={(event) => setNewModel((current) => ({ ...current, accuracy: event.target.value }))}
                    placeholder="misal: 95.2"
                  />
                </label>

                <label className="space-y-1.5 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">mAP Score</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    value={newModel.map}
                    onChange={(event) => setNewModel((current) => ({ ...current, map: event.target.value }))}
                    placeholder="misal: 0.78"
                  />
                </label>

                <label className="space-y-1.5 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Status Awal</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                    value={newModel.status}
                    onChange={(event) => setNewModel((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="Inactive">Inactive</option>
                    <option value="Training">Training</option>
                    <option value="Active">Active</option>
                  </select>
                </label>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 text-sm block">File Bobot Model (`.pt`)</span>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
                    newModel.file
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-300 bg-slate-50/60 hover:border-primary-400 hover:bg-primary-50/20'
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-primary-700">
                    {newModel.file ? <FileCode size={24} className="text-emerald-600" /> : <UploadCloud size={24} />}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {newModel.file ? newModel.file.name : 'Klik untuk memilih file .pt'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {newModel.file
                      ? `Ukuran berkas: ${(newModel.file.size / (1024 * 1024)).toFixed(2)} MB`
                      : 'Format PyTorch (.pt) hingga 500MB'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={creating} className="px-6 py-2.5">
                  {creating ? 'Mendaftarkan Model...' : 'Simpan & Daftar Model'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowRegisterForm(false)}>
                  Batal
                </Button>
              </div>
            </div>

            {/* Right Column: Live Card Preview & Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pratinjau Kartu Model</span>
                  <StatusBadge status={newModel.status} />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      {newModel.name || 'Nama Model (Draft)'}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-slate-400" />
                      {newModel.site || 'Site 1'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white p-3 border border-slate-200/60">
                      <span className="text-slate-400 block text-[11px]">Accuracy</span>
                      <span className="font-semibold text-slate-800 text-sm">{formatPercent(newModel.accuracy)}</span>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-slate-200/60">
                      <span className="text-slate-400 block text-[11px]">mAP Score</span>
                      <span className="font-semibold text-slate-800 text-sm">{formatMAP(newModel.map)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-white p-3 border border-slate-200/60 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <AlertCircle size={14} className="text-primary-700" />
                  Catatan Registrasi
                </div>
                <p>
                  Nama berkas `.pt` akan otomatis disimpan ke dalam atribut `artifact_path` backend untuk keperluan inferensi AI.
                </p>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Main Content Layout: Models Grid & Model Detail/Timeline */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Registered Models Grid & Performance Chart */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-slate-900">Daftar Model Terdaftar</h3>
                <p className="text-xs text-slate-500">Pilih model untuk melihat detail metrics atau ubah status aktif.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {models.length} Model
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {models.map((model) => {
                const isActive = model.status?.toLowerCase() === 'active'
                const isSelected = model.id === selectedModelId

                return (
                  <article
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className={`card p-4 cursor-pointer transition-all duration-200 relative ${
                      isSelected ? 'ring-2 ring-primary-500 border-transparent shadow-md' : 'hover:border-slate-300'
                    } ${isActive ? 'bg-gradient-to-br from-white to-emerald-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{model.id}</p>
                        <h4 className="mt-0.5 text-base font-bold text-slate-800 line-clamp-1">{model.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {model.site}
                        </p>
                      </div>
                      <StatusBadge status={model.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Accuracy</span>
                        <span className="font-bold text-slate-800">{formatPercent(model.accuracy)}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">mAP Score</span>
                        <span className="font-bold text-slate-800">{formatMAP(model.map)}</span>
                      </div>
                    </div>

                    {model.artifactPath && (
                      <p className="mt-2 text-[11px] text-slate-400 truncate font-mono bg-slate-50 px-2 py-1 rounded">
                        {model.artifactPath}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant={isActive ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => handleActivate(model.id)}
                        disabled={isActive || activatingID === model.id}
                        className="text-xs"
                      >
                        <PlayCircle size={13} />
                        {activatingID === model.id ? 'Updating...' : isActive ? 'Aktif' : 'Set Active'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExport(model.id)} className="text-xs">
                        <Download size={13} />
                        Export
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteModel(model.id)} className="text-xs ml-auto">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          {/* Performance Comparison Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl text-slate-900">Perbandingan Performa Model</h3>
                <p className="text-xs text-slate-500">Kurva mAP antar model selama epoch training.</p>
              </div>
            </div>

            <div className="mt-4 h-[320px]">
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

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/60 p-3 text-xs text-emerald-900 border border-emerald-100">
              <Sparkles size={16} className="text-primary-700 flex-shrink-0" />
              {bestModel
                ? `Model ${bestModel.name} (${bestModel.site}) saat ini memimpin performa dengan mAP ${formatMAP(bestModel.map)}.`
                : 'Belum ada data performa model.'}
            </div>

            {error && <p className="mt-3 text-xs text-rose-600">{error.message || 'Operasi model gagal diproses.'}</p>}
          </div>
        </div>

        {/* Right Column: Model Detail Metrics & Timeline */}
        <div className="space-y-6">
          {selectedModel && (
            <div className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                    Terpilih
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-slate-800">{selectedModel.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {selectedModel.site}
                  </p>
                </div>
                <StatusBadge status={selectedModel.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Accuracy</span>
                  <span className="font-bold text-slate-800 text-sm">{formatPercent(selectedModel.accuracy)}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">mAP</span>
                  <span className="font-bold text-slate-800 text-sm">{formatMAP(selectedModel.map)}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Epochs</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedMetrics ? `${selectedMetrics.precision.length}` : '-'}
                  </span>
                </div>
              </div>

              {selectedMetrics && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1">
                        <BarChart2 size={13} className="text-primary-700" /> Precision Epochs
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedMetrics.precision.map((value, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 font-mono">
                          {value.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1">
                        <BarChart2 size={13} className="text-sky-700" /> Recall Epochs
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedMetrics.recall.map((value, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 font-mono">
                          {value.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Training History */}
          <div className="card p-5">
            <h3 className="font-display text-xl text-slate-900">Riwayat & Status Training</h3>
            <p className="text-xs text-slate-500 mb-4">Aktivitas pendaftaran model dalam sistem.</p>
            <div className="space-y-4">
              {trainingHistory.map((entry, index) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-700 ring-4 ring-primary-50" />
                    {index < trainingHistory.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-bold text-slate-800">{entry.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={entry.time} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{entry.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
