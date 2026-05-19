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
      className="relative z-0 h-full w-full rounded-card"
      style={{ height: `${height}px`, width: '100%' }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl={false}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <TileLayer 
        url="/tiles/{z}/{x}/{y}.png" 
        attribution="&copy; UAV Simulation"
        maxZoom={18}
        minZoom={12}
      />
      {markers.map((marker) => (
        <TreeMarker key={marker.id} tree={marker} />
      ))}
    </MapContainer>
  )
}
