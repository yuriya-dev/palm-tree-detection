import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) =>
    Promise.reject(
      error?.response?.data || {
        success: false,
        message: error.message || 'Unexpected error',
      },
    ),
)

export const apiEndpoints = {
  detect: (formData, config = {}) =>
    api.post('/api/v1/detect', formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  listDetections: (params = {}) => api.get('/api/v1/detections', { params }),
  getDetectionDetail: (id) => api.get(`/api/v1/detections/${id}`),
  deleteDetection: (id) => api.delete(`/api/v1/detections/${id}`),

  listTrees: (params = {}) => api.get('/api/v1/trees', { params }),
  getTreeDetail: (id) => api.get(`/api/v1/trees/${id}`),
  getTreeStats: () => api.get('/api/v1/trees/stats'),

  listDatasets: (params = {}) => api.get('/api/v1/datasets', { params }),
  uploadDataset: (formData) =>
    api.post('/api/v1/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  deleteDataset: (id) => api.delete(`/api/v1/datasets/${id}`),

  listModels: () => api.get('/api/v1/models'),
  activateModel: (id) => api.post(`/api/v1/models/${id}/activate`),
  getModelMetrics: (id) => api.get(`/api/v1/models/${id}/metrics`),

  analyticsOverview: (params = {}) =>
    api.get('/api/v1/analytics/overview', { params }),
  analyticsTrend: (params = {}) => api.get('/api/v1/analytics/trend', { params }),

  healthCheck: () => api.get('/api/v1/health'),
}

export default api
