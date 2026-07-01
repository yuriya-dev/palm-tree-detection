import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { Maximize2, Minimize2 } from 'lucide-react'
import TreeMarker from './TreeMarker'

const defaultCenter = [-3.0, 104.0]

function MapRecenter({ center, zoom, isFullscreen }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [isFullscreen, map])

  return null
}

export default function SiteMap({
  markers,
  height = 320,
  zoom = 12,
  center: customCenter,
  selectedTreeId,
  onSelectTree,
  isFullscreen: customFullscreen,
  onToggleFullscreen,
  interactive = true,
}) {
  const [internalFullscreen, setInternalFullscreen] = useState(false)
  const isFullscreen = customFullscreen ?? internalFullscreen

  const center = customCenter || (markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter)

  const toggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen()
    } else {
      setInternalFullscreen(!internalFullscreen)
    }
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-slate-900 overflow-hidden'
    : 'relative z-0 h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm'

  const containerStyle = isFullscreen
    ? { height: '100%', width: '100%' }
    : { height: `${height}px`, width: '100%' }

  return (
    <div className={containerClasses} style={containerStyle}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={false}
      >
        <MapRecenter center={center} zoom={zoom} isFullscreen={isFullscreen} />
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
          <TreeMarker 
            key={marker.id} 
            tree={marker} 
            isSelected={selectedTreeId === marker.id}
            onClick={() => onSelectTree && onSelectTree(marker)}
          />
        ))}
      </MapContainer>

      <button
        onClick={toggleFullscreen}
        type="button"
        className="absolute top-4 right-4 z-[99999] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-lg transition-all hover:bg-slate-50 hover:text-slate-950 focus:outline-none ring-2 ring-primary-500/20"
        title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Map'}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  )
}
