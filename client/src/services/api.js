import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request interceptor: attach JWT Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  // Dynamically read from localStorage so we always use the latest token
  // without needing to subscribe to the store (avoids circular imports).
  try {
    const raw = localStorage.getItem('nyawit-auth')
    if (raw) {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch {
    // If parsing fails, proceed without auth header
  }
  return config
})

// ── Response interceptor: unwrap data, handle 401 ────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear stored auth and redirect to login
      try {
        localStorage.removeItem('nyawit-auth')
      } catch {
        /* ignore */
      }
      // Avoid a hard import loop — use location directly
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(
      error?.response?.data || {
        success: false,
        message: error.message || 'Unexpected error',
      },
    )
  },
)

export const apiEndpoints = {
  // Auth
  login: (data) => api.post('/api/v1/auth/login', data),
  me: () => api.get('/api/v1/auth/me'),

  // Detections
  detect: (formData, config = {}) =>
    api.post('/api/v1/detect', formData, {
      ...config,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listDetections: (params = {}) => api.get('/api/v1/detections', { params }),
  getDetectionDetail: (id) => api.get(`/api/v1/detections/${id}`),
  deleteDetection: (id) => api.delete(`/api/v1/detections/${id}`),

  // Detection Requests (approval workflow)
  listDetectionRequests: (params = {}) => api.get('/api/v1/detection-requests', { params }),
  getDetectionRequest: (id) => api.get(`/api/v1/detection-requests/${id}`),
  reviewDetectionRequest: (id, data) => api.post(`/api/v1/detection-requests/${id}/review`, data),
  deleteDetectionRequest: (id) => api.delete(`/api/v1/detection-requests/${id}`),

  // Trees
  listTrees: (params = {}) => api.get('/api/v1/trees', { params }),
  getTreeDetail: (id) => api.get(`/api/v1/trees/${id}`),
  getTreeStats: () => api.get('/api/v1/trees/stats'),

  // Datasets
  listDatasets: (params = {}) => api.get('/api/v1/datasets', { params }),
  uploadDataset: (formData) =>
    api.post('/api/v1/datasets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDataset: (id) => api.delete(`/api/v1/datasets/${id}`),

  // Models
  listModels: () => api.get('/api/v1/models'),
  listModelFiles: () => api.get('/api/v1/models/files'),
  createModel: (formData) =>
    api.post('/api/v1/models', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteModel: (id) => api.delete(`/api/v1/models/${id}`),
  activateModel: (id) => api.post(`/api/v1/models/${id}/activate`),
  getModelMetrics: (id) => api.get(`/api/v1/models/${id}/metrics`),
  exportModel: (id) => api.get(`/api/v1/models/${id}/export`),

  // Analytics
  analyticsOverview: (params = {}) => api.get('/api/v1/analytics/overview', { params }),
  analyticsTrend: (params = {}) => api.get('/api/v1/analytics/trend', { params }),

  // Health
  healthCheck: () => api.get('/api/v1/health'),
}

export default api
