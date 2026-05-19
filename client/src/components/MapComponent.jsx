import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={[-2.5, 118]}
        zoom={15}
        minZoom={15}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="/tiles/{z}/{x}/{y}.png"
          attribution="&copy; UAV Simulation"
          noWrap={true}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
