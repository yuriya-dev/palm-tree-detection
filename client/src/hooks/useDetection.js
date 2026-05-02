import { useDetectionStore } from '../store/useAppStore'
import { apiEndpoints } from '../services/api'

const STATUS_LABELS = ['Healthy', 'Warning', 'Critical']

const normalizeStatus = (status) => {
  const normalized = String(status || '').toLowerCase().trim()
  if (normalized === 'healthy') return 'Healthy'
  if (normalized === 'warning') return 'Warning'
  if (normalized === 'critical') return 'Critical'
  return 'Warning'
}

const buildBreakdown = (detections) =>
  STATUS_LABELS.map((name) => ({
    name,
    value: detections.filter((item) => item.status === name).length,
  }))

export default function useDetection() {
  const {
    selectedModel,
    confidenceThreshold,
    isRunning,
    result,
    setModel,
    setConfidenceThreshold,
    setRunning,
    setResult,
    clearResult,
  } = useDetectionStore()

  const runDetection = async ({ file, imageUrl }) => {
    if (!file || !imageUrl) {
      return null
    }

    setRunning(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('site', selectedModel)
      formData.append('model', 'mopad')
      formData.append('confidence_threshold', confidenceThreshold.toFixed(2))

      const response = await apiEndpoints.detect(formData)
      const rawDetection = response?.data
      const confidence = Number(rawDetection?.confidence || confidenceThreshold)

      const uiDetections = [
        {
          id: rawDetection?.tree_id || rawDetection?.treeId || 'TREE-0000',
          status: normalizeStatus(rawDetection?.status),
          confidence,
          x: 22,
          y: 18,
          width: 38,
          height: 34,
        },
      ].filter((item) => item.confidence >= confidenceThreshold)

      const nextResult = {
        imageUrl,
        selectedModel,
        confidenceThreshold,
        detections: uiDetections,
        count: uiDetections.length,
        breakdown: buildBreakdown(uiDetections),
        processedAt: new Date().toISOString(),
      }

      setResult(nextResult)
      return nextResult
    } catch (error) {
      throw new Error(error?.message || 'Failed to run detection')
    } finally {
      setRunning(false)
    }
  }

  return {
    selectedModel,
    confidenceThreshold,
    isRunning,
    result,
    setModel,
    setConfidenceThreshold,
    runDetection,
    clearResult,
  }
}
