import { MapContainer, TileLayer } from 'react-leaflet'
import TreeMarker from './TreeMarker'

const defaultCenter = [-2.261, 113.911]

export default function SiteMap({
  markers,
  height = 320,
  zoom = 12,
  interactive = true,
}) {
  const center =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-card"
      style={{ height: `${height}px`, width: '100%' }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((marker) => (
        <TreeMarker key={marker.id} tree={marker} />
      ))}
    </MapContainer>
  )
}
