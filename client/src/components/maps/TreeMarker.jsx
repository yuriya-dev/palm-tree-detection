import { CircleMarker, Popup } from 'react-leaflet'
import StatusBadge from '../ui/StatusBadge'

const markerColorMap = {
  Healthy: '#16a34a',
  Warning: '#d97706',
  Critical: '#dc2626',
}

export default function TreeMarker({ tree }) {
  const markerColor = markerColorMap[tree.status] || '#0284c7'

  return (
    <CircleMarker
      center={[tree.lat, tree.lng]}
      radius={8}
      pathOptions={{
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.82,
        weight: 2,
      }}
    >
      <Popup>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">{tree.id || tree.name}</p>
          <p className="text-xs text-slate-500">
            {tree.lat}, {tree.lng}
          </p>
          <StatusBadge status={tree.status} />
        </div>
      </Popup>
    </CircleMarker>
  )
}
