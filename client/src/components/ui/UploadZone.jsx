import { ImagePlus, UploadCloud } from 'lucide-react'
import Button from './Button'

export default function UploadZone({
  file,
  previewUrl,
  progress,
  isUploading,
  onInputChange,
  onDrop,
  onDragOver,
  onReset,
}) {
  return (
    <div className="card space-y-4 p-5">
      <div
        className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/40"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          id="upload-image"
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={onInputChange}
        />

        {!previewUrl ? (
          <>
            <div className="mb-4 rounded-full bg-white p-3 text-primary-900 shadow-sm">
              <UploadCloud size={24} />
            </div>
            <h3 className="font-display text-xl text-slate-900">Upload Citra UAV</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Drag and drop file gambar ke area ini, atau klik untuk memilih gambar dari perangkat.
            </p>
          </>
        ) : (
          <div className="w-full space-y-3">
            <img
              src={previewUrl}
              alt="Preview UAV"
              className="h-56 w-full rounded-lg object-cover"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{file?.name}</span>
              <span>{Math.round((file?.size || 0) / 1024)} KB</span>
            </div>
          </div>
        )}
      </div>

      {progress > 0 && (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-900 to-primary-700 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-500">{progress}%</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => document.getElementById('upload-image')?.click()}>
          <ImagePlus size={14} />
          Select Image
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={isUploading || !file}>
          Reset
        </Button>
      </div>
    </div>
  )
}
