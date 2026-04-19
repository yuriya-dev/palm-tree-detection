import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

export const useDetectionStore = create((set) => ({
  selectedModel: 'Site 1',
  confidenceThreshold: 0.55,
  isRunning: false,
  result: null,
  setModel: (modelName) => set({ selectedModel: modelName }),
  setConfidenceThreshold: (threshold) => set({ confidenceThreshold: threshold }),
  setRunning: (isRunning) => set({ isRunning }),
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}))
