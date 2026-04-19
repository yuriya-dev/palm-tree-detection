import { SlidersHorizontal, WandSparkles } from 'lucide-react'
import { useMemo } from 'react'
import useDetection from '../hooks/useDetection'
import useUpload from '../hooks/useUpload'
import Skeleton from '../components/shared/Skeleton'
import DetectionResult from '../components/ui/DetectionResult'
import UploadZone from '../components/ui/UploadZone'
import Button from '../components/ui/Button'

const models = ['Site 1', 'Site 2']

export default function Detection() {
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
    selectedModel,
    confidenceThreshold,
    isRunning,
    result,
    setModel,
    setConfidenceThreshold,
    runDetection,
    clearResult,
  } = useDetection()

  const confidenceLabel = useMemo(
    () => `${Math.round(confidenceThreshold * 100)}%`,
    [confidenceThreshold],
  )

  const handleRunDetection = async () => {
    if (!previewUrl || !file || isRunning) {
      return
    }

    await startUploadSimulation()
    await runDetection(previewUrl)
  }

  const handleReset = () => {
    resetUpload()
    clearResult()
  }

  return (
    <div className="space-y-6">
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

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select Model</span>
            <select
              value={selectedModel}
              onChange={(event) => setModel(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

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

          <Button className="h-12 w-full" onClick={handleRunDetection} disabled={!file || isRunning}>
            <WandSparkles size={16} />
            {isRunning ? 'Running detection...' : 'Run Detection'}
          </Button>

          <div className="rounded-lg bg-primary-50/60 p-4 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2 font-semibold text-primary-900">
              <SlidersHorizontal size={14} />
              Current profile
            </p>
            <p className="mt-1">{selectedModel} with threshold {confidenceLabel}</p>
          </div>
        </div>
      </section>

      <section>
        {isRunning ? <Skeleton className="h-[560px]" /> : <DetectionResult result={result} />}
      </section>
    </div>
  )
}
