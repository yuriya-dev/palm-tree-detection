import { useDetectionStore } from '../store/useAppStore'
import { detectionStatusBreakdown, sampleDetections } from '../utils/mockData'

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

  const runDetection = async (imageUrl) => {
    if (!imageUrl) {
      return null
    }

    setRunning(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const filteredDetections = sampleDetections.filter(
        (item) => item.confidence >= confidenceThreshold,
      )

      const nextResult = {
        imageUrl,
        selectedModel,
        confidenceThreshold,
        detections: filteredDetections,
        count: filteredDetections.length,
        breakdown: detectionStatusBreakdown,
        processedAt: new Date().toISOString(),
      }

      setResult(nextResult)
      return nextResult
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
