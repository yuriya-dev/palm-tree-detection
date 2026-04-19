import Badge from './Badge'

const statusVariantMap = {
  healthy: 'success',
  warning: 'warning',
  critical: 'danger',
  active: 'success',
  training: 'info',
  inactive: 'neutral',
}

export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase?.() || 'inactive'
  const variant = statusVariantMap[normalized] || 'neutral'

  return <Badge variant={variant}>{status}</Badge>
}
