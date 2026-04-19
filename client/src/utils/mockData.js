export const dashboardStats = [
  {
    key: 'total',
    title: 'Total Trees Detected',
    value: '12,842',
    trend: 12.4,
    icon: 'trees',
  },
  {
    key: 'healthy',
    title: 'Healthy Trees',
    value: '10,974',
    trend: 8.7,
    icon: 'shield',
  },
  {
    key: 'attention',
    title: 'Trees Needing Attention',
    value: '1,128',
    trend: -4.3,
    icon: 'alert',
  },
  {
    key: 'coverage',
    title: 'Area Coverage',
    value: '384.5 ha',
    trend: 5.1,
    icon: 'map',
  },
]

export const monthlyDetectionData = [
  { month: 'Jan', trees: 830 },
  { month: 'Feb', trees: 910 },
  { month: 'Mar', trees: 985 },
  { month: 'Apr', trees: 1042 },
  { month: 'May', trees: 1088 },
  { month: 'Jun', trees: 1164 },
  { month: 'Jul', trees: 1199 },
  { month: 'Aug', trees: 1242 },
  { month: 'Sep', trees: 1298 },
  { month: 'Oct', trees: 1384 },
  { month: 'Nov', trees: 1422 },
  { month: 'Dec', trees: 1493 },
]

export const recentDetections = [
  {
    id: 'DET-1129',
    treeId: 'TREE-0091',
    site: 'Site 1',
    status: 'Healthy',
    confidence: 0.94,
    detectedAt: '2026-04-19 09:14',
  },
  {
    id: 'DET-1128',
    treeId: 'TREE-0088',
    site: 'Site 2',
    status: 'Warning',
    confidence: 0.87,
    detectedAt: '2026-04-19 08:48',
  },
  {
    id: 'DET-1127',
    treeId: 'TREE-0086',
    site: 'Site 1',
    status: 'Critical',
    confidence: 0.83,
    detectedAt: '2026-04-18 17:32',
  },
  {
    id: 'DET-1126',
    treeId: 'TREE-0084',
    site: 'Site 3',
    status: 'Healthy',
    confidence: 0.92,
    detectedAt: '2026-04-18 15:07',
  },
  {
    id: 'DET-1125',
    treeId: 'TREE-0080',
    site: 'Site 2',
    status: 'Warning',
    confidence: 0.85,
    detectedAt: '2026-04-18 11:53',
  },
]

export const sitePreviewMarkers = [
  { id: 'S1', name: 'Site 1', lat: -2.261, lng: 113.911, status: 'Healthy' },
  { id: 'S2', name: 'Site 2', lat: -2.248, lng: 113.889, status: 'Warning' },
  { id: 'S3', name: 'Site 3', lat: -2.274, lng: 113.934, status: 'Critical' },
]

export const sampleDetections = [
  { id: 'TREE-102', status: 'Healthy', confidence: 0.95, x: 9, y: 12, width: 20, height: 25 },
  { id: 'TREE-103', status: 'Warning', confidence: 0.89, x: 34, y: 22, width: 18, height: 21 },
  { id: 'TREE-104', status: 'Healthy', confidence: 0.93, x: 57, y: 14, width: 19, height: 24 },
  { id: 'TREE-105', status: 'Critical', confidence: 0.84, x: 71, y: 38, width: 17, height: 22 },
  { id: 'TREE-106', status: 'Warning', confidence: 0.88, x: 21, y: 52, width: 16, height: 20 },
]

export const detectionStatusBreakdown = [
  { name: 'Healthy', value: 64 },
  { name: 'Warning', value: 24 },
  { name: 'Critical', value: 12 },
]

export const datasets = [
  { id: 'DS-001', site: 'Site 1', images: 2140, annotations: 11621, format: 'COCO' },
  { id: 'DS-002', site: 'Site 2', images: 1890, annotations: 9744, format: 'COCO' },
  { id: 'DS-003', site: 'Site 3', images: 1650, annotations: 8821, format: 'COCO' },
  { id: 'DS-004', site: 'Site 4', images: 1412, annotations: 7440, format: 'COCO' },
  { id: 'DS-005', site: 'Site 5', images: 1294, annotations: 6972, format: 'COCO' },
  { id: 'DS-006', site: 'Site 6', images: 1140, annotations: 5826, format: 'COCO' },
]

export const datasetComposition = [
  { name: 'Train', value: 70 },
  { name: 'Validation', value: 20 },
  { name: 'Test', value: 10 },
]

export const models = [
  {
    id: 'MOD-S1-V4',
    name: 'PalmNet Site 1',
    site: 'Site 1',
    accuracy: 95.2,
    map: 0.78,
    status: 'Active',
  },
  {
    id: 'MOD-S2-V3',
    name: 'PalmNet Site 2',
    site: 'Site 2',
    accuracy: 93.9,
    map: 0.74,
    status: 'Training',
  },
  {
    id: 'MOD-GLOBAL-V2',
    name: 'PalmNet Global',
    site: 'Multi Site',
    accuracy: 92.1,
    map: 0.7,
    status: 'Inactive',
  },
]

export const modelPerformanceTrend = [
  { epoch: 'E1', site1: 0.52, site2: 0.48, global: 0.44 },
  { epoch: 'E2', site1: 0.61, site2: 0.56, global: 0.51 },
  { epoch: 'E3', site1: 0.68, site2: 0.63, global: 0.57 },
  { epoch: 'E4', site1: 0.73, site2: 0.67, global: 0.61 },
  { epoch: 'E5', site1: 0.78, site2: 0.72, global: 0.66 },
]

export const trainingHistory = [
  {
    id: 'TR-248',
    title: 'PalmNet Site 2 fine-tuning completed',
    time: '2 hours ago',
    detail: 'mAP improved from 0.71 to 0.74',
  },
  {
    id: 'TR-247',
    title: 'Augmentation pipeline updated',
    time: 'Yesterday',
    detail: 'Added adaptive brightness and random crop',
  },
  {
    id: 'TR-246',
    title: 'Site 1 model promoted to active',
    time: '3 days ago',
    detail: 'Validation score reached 95.2% accuracy',
  },
]

export const weeklyTrend = [
  { week: 'W1', detections: 212 },
  { week: 'W2', detections: 238 },
  { week: 'W3', detections: 246 },
  { week: 'W4', detections: 271 },
  { week: 'W5', detections: 266 },
  { week: 'W6', detections: 289 },
  { week: 'W7', detections: 305 },
]

export const siteComparison = [
  { site: 'Site 1', trees: 3120 },
  { site: 'Site 2', trees: 2815 },
  { site: 'Site 3', trees: 2542 },
  { site: 'Site 4', trees: 1988 },
]

export const analyticsKpis = [
  {
    key: 'detections',
    title: 'Detections This Period',
    value: '4,862',
    trend: 11.2,
    icon: 'scan',
  },
  {
    key: 'sites',
    title: 'Active Sites',
    value: '8',
    trend: 4.1,
    icon: 'building',
  },
  {
    key: 'uptime',
    title: 'Model Uptime',
    value: '99.3%',
    trend: 0.8,
    icon: 'clock',
  },
  {
    key: 'alerts',
    title: 'Critical Alerts',
    value: '32',
    trend: -6.5,
    icon: 'bell',
  },
]

export const heatmapActivity = Array.from({ length: 42 }, (_, index) => {
  const value = (index * 7 + 19) % 13
  return {
    day: index + 1,
    value,
  }
})

const treeStatuses = ['Healthy', 'Warning', 'Critical']
const sites = ['Site 1', 'Site 2', 'Site 3']

export const trees = Array.from({ length: 45 }, (_, index) => {
  const status = treeStatuses[index % treeStatuses.length]
  const confidence = 0.79 + (index % 10) * 0.02
  const lat = -2.24 - index * 0.0019
  const lng = 113.89 + index * 0.0023

  return {
    id: `TREE-${String(index + 1).padStart(4, '0')}`,
    site: sites[index % sites.length],
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    status,
    confidence: Math.min(0.99, Number(confidence.toFixed(2))),
    detectedAt: `2026-04-${String((index % 18) + 1).padStart(2, '0')}`,
  }
})
