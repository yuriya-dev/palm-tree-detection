import { Download, Eye, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DonutChart from '../components/charts/DonutChart'
import EmptyState from '../components/shared/EmptyState'
import Skeleton from '../components/shared/Skeleton'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import { apiEndpoints } from '../services/api'

const mapDataset = (dataset) => ({
  id: dataset.id,
  name: dataset.name,
  site: dataset.site,
  images: Number(dataset.image_count || dataset.imageCount || 0),
  annotations: Number(dataset.annotations || 0),
  format: dataset.format || 'COCO',
  createdAt: dataset.created_at || dataset.createdAt || '',
})

export default function Datasets() {
  const fileInputRef = useRef(null)

  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const loadDatasets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiEndpoints.listDatasets({ page: 1, limit: 100 })
      const payload = Array.isArray(response?.data) ? response.data : []
      setDatasets(payload.map(mapDataset))
    } catch (fetchError) {
      setDatasets([])
      setError(fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  const datasetComposition = useMemo(() => {
    const totalImages = datasets.reduce((sum, item) => sum + item.images, 0)

    if (totalImages === 0) {
      return [
        { name: 'Train', value: 0 },
        { name: 'Validation', value: 0 },
        { name: 'Test', value: 0 },
      ]
    }

    return [
      { name: 'Train', value: Math.round(totalImages * 0.7) },
      { name: 'Validation', value: Math.round(totalImages * 0.2) },
      { name: 'Test', value: Math.max(0, totalImages - Math.round(totalImages * 0.7) - Math.round(totalImages * 0.2)) },
    ]
  }, [datasets])

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleUploadDataset = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', selectedFile.name)
      formData.append('site', 'Site 1')

      await apiEndpoints.uploadDataset(formData)
      await loadDatasets()
    } catch (uploadError) {
      setError(uploadError)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteDataset = async (datasetID) => {
    try {
      await apiEndpoints.deleteDataset(datasetID)
      await loadDatasets()
    } catch (deleteError) {
      setError(deleteError)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error && datasets.length === 0) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".zip,.json,.txt,.csv"
          onChange={handleUploadDataset}
        />
        <EmptyState
          title="Gagal memuat dataset"
          description={error?.message || 'Pastikan backend API sedang berjalan lalu coba lagi.'}
          actionLabel="Muat Ulang"
          onAction={loadDatasets}
        />
      </>
    )
  }

  if (datasets.length === 0) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".zip,.json,.txt,.csv"
          onChange={handleUploadDataset}
        />
        <EmptyState
          title="Belum ada dataset"
          description="Unggah dataset pertama Anda untuk memulai proses training dan evaluasi model."
          actionLabel="Upload Dataset"
          onAction={handleOpenFilePicker}
        />
      </>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".zip,.json,.txt,.csv"
        onChange={handleUploadDataset}
      />

      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {datasets.map((dataset) => (
            <article key={dataset.id} className="card flex h-full flex-col p-4">
              <div className="h-28 rounded-lg bg-gradient-to-br from-emerald-100 via-green-50 to-cyan-50 sm:h-32" />
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dataset.id}</p>
                <h3 className="font-semibold text-slate-800">{dataset.site}</h3>
                <p className="text-xs text-slate-500">{dataset.images} images</p>
                <p className="text-xs text-slate-500">{dataset.annotations} annotations</p>
              </div>

              <div className="mt-3">
                <StatusBadge status={dataset.format} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-auto sm:grid-cols-[1fr_1fr_auto]">
                <Button variant="secondary" size="sm" className="w-full min-w-0" disabled>
                  <Download size={14} />
                  Download
                </Button>
                <Button variant="ghost" size="sm" className="w-full min-w-0" disabled>
                  <Eye size={14} />
                  View
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto sm:px-3"
                  onClick={() => handleDeleteDataset(dataset.id)}
                >
                  <Trash2 size={14} />
                  <span className="sm:hidden">Delete</span>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-slate-900">Upload Dataset</h3>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center sm:p-8">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-white p-3 text-primary-900 shadow-sm">
              <UploadCloud size={20} />
            </div>
            <p className="text-sm text-slate-500">Drag and drop archive dataset (COCO) atau pilih file dari perangkat.</p>
            <Button className="mt-4" onClick={handleOpenFilePicker} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Select Dataset File'}
            </Button>
            {error && <p className="mt-3 text-xs text-rose-600">{error.message || 'Upload gagal. Coba lagi.'}</p>}
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
