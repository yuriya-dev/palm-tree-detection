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

const clampPercent = (value) => Math.max(0, Math.min(100, value))

const fallbackDetection = (status, confidence) => [
  {
    id: 'TREE-0000',
    label: 'Palm Tree',
    status,
    confidence,
    x: 22,
    y: 18,
    width: 38,
    height: 34,
  },
]

const buildResult = ({ imageUrl, selectedModel, confidenceThreshold, detection, prediction }) => {
  const uiDetections = mapPredictionBoxes(prediction, detection, confidenceThreshold)
  const status = normalizeStatus(prediction?.status || detection?.status)

  return {
    imageUrl,
    selectedModel,
    confidenceThreshold,
    status,
    prediction,
    detection,
    detections: uiDetections,
    count: uiDetections.length,
    breakdown: buildBreakdown(uiDetections),
    processedAt: new Date().toISOString(),
  }
}

const mapPredictionBoxes = (prediction, detection, confidenceThreshold) => {
  const imageWidth = Number(prediction?.image_size?.width || 0)
  const imageHeight = Number(prediction?.image_size?.height || 0)
  const boxes = Array.isArray(prediction?.detections) ? prediction.detections : []

  if (!boxes.length || imageWidth <= 0 || imageHeight <= 0) {
    const confidence = Number(prediction?.confidence || detection?.confidence || confidenceThreshold)
    const status = normalizeStatus(prediction?.status || detection?.status)
    return fallbackDetection(status, confidence)
  }

  return boxes
    .map((item, index) => {
      const box = item?.box || {}
      const left = (Number(box.x1 || 0) / imageWidth) * 100
      const top = (Number(box.y1 || 0) / imageHeight) * 100
      const width = ((Number(box.x2 || 0) - Number(box.x1 || 0)) / imageWidth) * 100
      const height = ((Number(box.y2 || 0) - Number(box.y1 || 0)) / imageHeight) * 100

      return {
        id: `TREE-${String(index + 1).padStart(4, '0')}`,
        label: item?.label || 'Palm Tree',
        status: normalizeStatus(item?.status || prediction?.status || detection?.status),
        confidence: Number(item?.confidence || prediction?.confidence || detection?.confidence || confidenceThreshold),
        x: clampPercent(left),
        y: clampPercent(top),
        width: clampPercent(width),
        height: clampPercent(height),
      }
    })
    .filter((item) => item.confidence >= confidenceThreshold)
}

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

    const runDetection = async ({ file, imageUrl, skipApproval = false, modelMeta = null }) => {
      if (!file || !imageUrl) {
        return null
      }

      const selectedSite = modelMeta?.site || selectedModel
      const selectedModelName = modelMeta?.name || modelMeta?.id || selectedModel
      const selectedModelLabel = modelMeta?.label || selectedModelName || selectedSite

      setRunning(true)

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('site', selectedSite)
        formData.append('model', selectedModelName)
        formData.append('confidence_threshold', confidenceThreshold.toFixed(2))
        formData.append('require_approval', skipApproval ? 'false' : 'true') // Enable/disable approval workflow
        formData.append('requested_by', 'user') // You can get this from auth context

        console.log('[Detection] Sending request with:', { selectedModel: selectedModelLabel, confidenceThreshold, skipApproval })
        const response = await apiEndpoints.detect(formData)
        console.log('[Detection] Response received:', response)

        // Check if it's a pending request (HTTP 202)
        if (response?.data?.status === 'pending') {
          console.log('[Detection] Request is pending approval')
        
          // Create a preview result for the pending request
          const previewResult = {
            imageUrl,
            selectedModel: selectedModelLabel,
            confidenceThreshold,
            status: 'pending',
            detections: [],
            count: 0,
            breakdown: [],
            processedAt: new Date().toISOString(),
          }
        
          setResult(previewResult)
          return { status: 'pending', data: response.data }
        }

      const rawData = response?.data || response || {}
      console.log('[Detection] Parsed rawData:', rawData)

      const rawDetection = rawData?.detection || rawData
      const rawPrediction = rawData?.prediction || rawDetection?.prediction || {}
      console.log('[Detection] Extracted detection:', rawDetection)
      console.log('[Detection] Extracted prediction:', rawPrediction)

      const uiDetections = mapPredictionBoxes(rawPrediction, rawDetection, confidenceThreshold)
      const confidence = Number(rawDetection?.confidence || rawPrediction?.confidence || confidenceThreshold)
      const status = normalizeStatus(rawPrediction?.status || rawDetection?.status)
      console.log('[Detection] Mapped boxes:', uiDetections.length, 'Status:', status)

      const nextResult = {
        imageUrl,
        selectedModel: selectedModelLabel,
        confidenceThreshold,
        status,
        prediction: rawPrediction,
        detection: rawDetection,
        detections: uiDetections,
        count: uiDetections.length,
        breakdown: buildBreakdown(uiDetections),
        processedAt: new Date().toISOString(),
      }

      console.log('[Detection] Final result:', nextResult)
      setResult(nextResult)
      return nextResult
    } catch (error) {
      console.error('[Detection] Error:', error)
      throw new Error(error?.message || 'Failed to run detection')
    } finally {
      setRunning(false)
    }
  }
  
  const applyDetectionOutcome = ({
    imageUrl,
    detection,
    prediction,
    selectedModel: nextSelectedModel = selectedModel,
    confidenceThreshold: nextConfidenceThreshold = confidenceThreshold,
  }) => {
    const nextResult = buildResult({
      imageUrl,
      selectedModel: nextSelectedModel,
      confidenceThreshold: nextConfidenceThreshold,
      detection,
      prediction,
    })

    setResult(nextResult)
    return nextResult
  }

  return {
    selectedModel,
    confidenceThreshold,
    isRunning,
    result,
    setModel,
    setConfidenceThreshold,
    runDetection,
    applyDetectionOutcome,
    clearResult,
  }
}
