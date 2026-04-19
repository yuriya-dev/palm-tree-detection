import { useEffect, useRef, useState } from 'react'

const MAX_UPLOAD_PROGRESS = 100

export default function useUpload() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const objectUrlRef = useRef('')

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
  }

  const setSelectedFile = (nextFile) => {
    clearObjectUrl()

    if (!nextFile) {
      setFile(null)
      setPreviewUrl('')
      setProgress(0)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile)
    objectUrlRef.current = nextPreviewUrl

    setFile(nextFile)
    setPreviewUrl(nextPreviewUrl)
    setProgress(0)
  }

  const onInputChange = (event) => {
    const nextFile = event.target.files?.[0]
    setSelectedFile(nextFile)
  }

  const onDrop = (event) => {
    event.preventDefault()
    const nextFile = event.dataTransfer.files?.[0]
    setSelectedFile(nextFile)
  }

  const onDragOver = (event) => {
    event.preventDefault()
  }

  const startUploadSimulation = () =>
    new Promise((resolve) => {
      if (!file) {
        resolve(false)
        return
      }

      let currentProgress = 0
      setIsUploading(true)
      setProgress(0)

      const timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 16) + 9

        if (currentProgress >= MAX_UPLOAD_PROGRESS) {
          clearInterval(timer)
          setProgress(MAX_UPLOAD_PROGRESS)
          setIsUploading(false)
          resolve(true)
          return
        }

        setProgress(currentProgress)
      }, 120)
    })

  const resetUpload = () => {
    clearObjectUrl()
    setFile(null)
    setPreviewUrl('')
    setProgress(0)
    setIsUploading(false)
  }

  useEffect(() => {
    return () => {
      clearObjectUrl()
    }
  }, [])

  return {
    file,
    previewUrl,
    progress,
    isUploading,
    onInputChange,
    onDrop,
    onDragOver,
    startUploadSimulation,
    resetUpload,
  }
}
