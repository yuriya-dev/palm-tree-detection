import { SlidersHorizontal, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import useDetection from '../hooks/useDetection'
import useUpload from '../hooks/useUpload'
import { apiEndpoints } from '../services/api'
import Skeleton from '../components/shared/Skeleton'
import DetectionResult from '../components/ui/DetectionResult'
import UploadZone from '../components/ui/UploadZone'
import Button from '../components/ui/Button'
import { toast } from '../components/shared/ToastProvider.jsx'

const mapModelOption = (model) => ({
  id: model.id,
  name: model.name || model.id,
  site: model.site || '',
  label: `${model.name || model.id}${model.site ? ` · ${model.site}` : ''}`,
  status: model.status,
})

export default function Detection() {
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewDecision, setReviewDecision] = useState(null)
  const [activeModelOptions, setActiveModelOptions] = useState([])

  const {
    file,
    previewUrl,
    progress,
    isUploading,
    onInputChange,
    onDrop,
    onDragOver,
    startUploadSimulation,
    resetUpload,
  } = useUpload()

  const {
    confidenceThreshold,
    isRunning,
    result,
    setConfidenceThreshold,
    runDetection,
    clearResult,
  } = useDetection()

  useEffect(() => {
    let isMounted = true

    const loadModelOptions = async () => {
      try {
        const response = await apiEndpoints.listModels()
        const payload = Array.isArray(response?.data) ? response.data : []
        const options = payload
          .map(mapModelOption)
          .filter((model) => model.status?.toLowerCase() === 'active')

        if (!isMounted) {
          return
        }

        setActiveModelOptions(options)
      } catch (error) {
        console.error('Failed to load models for detection settings:', error)
        if (isMounted) {
          setActiveModelOptions([])
        }
      }
    }

    loadModelOptions()

    return () => {
      isMounted = false
    }
  }, [])

  const primaryActiveModel = activeModelOptions[0] || null
  const activeModelCount = activeModelOptions.length

  const confidenceLabel = useMemo(
    () => `${Math.round(confidenceThreshold * 100)}%`,
    [confidenceThreshold],
  )

  const handleRunDetection = async () => {
    if (!previewUrl || !file || isRunning || !primaryActiveModel) {
      return
    }

    setReviewDecision(null)
    await startUploadSimulation()
    try {
      await runDetection({
        file,
        imageUrl: previewUrl,
        skipApproval: true,
        modelMeta: primaryActiveModel,
      })
      toast.success('Deteksi selesai. Silakan review hasilnya.')
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Detection request failed')
    }
  }

  const handleApprove = async () => {
    if (!result) return

    setIsReviewing(true)
    try {
      toast.success('Hasil deteksi disetujui')
      handleReset()
    } catch (error) {
      console.error('Failed to approve detection:', error)
      toast.error(error.message || 'Failed to approve detection')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReject = async () => {
    const detectionId = result?.detection?.id ?? result?.id ?? result?.detection_id
    if (!detectionId) {
      toast.error('Tidak ada hasil deteksi yang bisa ditolak')
      return
    }

    setIsReviewing(true)
    try {
      await apiEndpoints.deleteDetection(detectionId)

      toast.success('Hasil deteksi ditolak dan dihapus')
      handleReset()
    } catch (error) {
      console.error('Failed to reject detection:', error)
      toast.error(error.message || 'Failed to reject detection')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReset = () => {
    resetUpload()
    clearResult()
    setReviewDecision(null)
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Detection | Palm Tree Detection</title>
        <meta
          name="description"
          content="Unggah citra, jalankan deteksi, dan review hasil menggunakan model active terbaru."
        />
      </Helmet>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <UploadZone
          file={file}
          previewUrl={previewUrl}
          progress={progress}
          isUploading={isUploading}
          onInputChange={onInputChange}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onReset={handleReset}
        />

        <div className="card space-y-6 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model Config</p>
            <h3 className="mt-2 font-display text-2xl text-slate-900">Detection Settings</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Models</p>
                <p className="mt-1 text-sm text-slate-700">
                  {activeModelCount > 0
                    ? ``
                    : 'Belum ada model active.'}
                </p>
              </div>
              <div className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeModelCount === 0 ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                  Aktifkan model di halaman Models
                </span>
              ) : (
                activeModelOptions.map((model) => (
                  <span
                    key={model.id}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      model.id === primaryActiveModel?.id
                        ? 'bg-primary-900 text-white'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {model.label}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Confidence Threshold</span>
              <span>{confidenceLabel}</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.01"
              value={confidenceThreshold}
              onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
              className="w-full accent-primary-900"
            />
          </div>

          <Button className="h-12 w-full" onClick={handleRunDetection} disabled={!file || isRunning || !primaryActiveModel}>
            <WandSparkles size={16} />
            {isRunning ? 'Running detection...' : 'Run Detection'}
          </Button>

          <div className="rounded-lg bg-primary-50/60 p-4 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2 font-semibold text-primary-900">
              <SlidersHorizontal size={14} />
              Current profile
            </p>
            <p className="mt-1">
              {primaryActiveModel?.label || 'No active model'} with threshold {confidenceLabel}
            </p>
          </div>
        </div>
      </section>

            <section>
        {isRunning ? (
          <Skeleton className="h-[560px]" />
        ) : (
          <DetectionResult
            result={result}
            onApprove={handleApprove}
            onReject={handleReject}
            isReviewing={isReviewing}
            reviewDecision={reviewDecision}
          />
        )}
      </section>
    </div>
  )
}
