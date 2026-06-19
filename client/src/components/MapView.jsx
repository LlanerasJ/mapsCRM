import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';

const MAP_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 5;

const PIN_RED = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
const PIN_BLUE = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
const PIN_GREEN = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

export default function MapView({ isLoaded, companies, visits, route, selectedCompanyId, onMarkerClick }) {
  const [map, setMap] = useState(null);

  const visitMap = Object.fromEntries(visits.map(v => [v.company_id, v]));

  const onLoad = useCallback(m => setMap(m), []);

  useEffect(() => {
    if (!map) return;
    const mapped = companies.filter(c => c.lat && c.lng);
    if (mapped.length === 0) return;
    if (mapped.length === 1) {
      map.setCenter({ lat: mapped[0].lat, lng: mapped[0].lng });
      map.setZoom(13);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    mapped.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));
    map.fitBounds(bounds, 60);
  }, [map, companies]);

  useEffect(() => {
    if (!map || !selectedCompanyId) return;
    const c = companies.find(x => x.id === selectedCompanyId);
    if (c?.lat && c?.lng) {
      map.panTo({ lat: c.lat, lng: c.lng });
      map.setZoom(Math.max(map.getZoom(), 13));
    }
  }, [map, selectedCompanyId, companies]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="spinner" />
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_STYLE}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      onLoad={onLoad}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {companies.filter(c => c.lat && c.lng).map(company => {
        const visit = visitMap[company.id];
        const icon = visit
          ? visit.status === 'visited' ? PIN_GREEN : PIN_BLUE
          : PIN_RED;
        return (
          <Marker
            key={company.id}
            position={{ lat: company.lat, lng: company.lng }}
            icon={{ url: icon }}
            onClick={() => onMarkerClick(company.id)}
            zIndex={selectedCompanyId === company.id ? 999 : undefined}
          />
        );
      })}

      {selectedCompany?.lat && (
        <InfoWindow
          position={{ lat: selectedCompany.lat, lng: selectedCompany.lng }}
          onCloseClick={() => onMarkerClick(selectedCompany.id)}
          options={{ pixelOffset: new window.google.maps.Size(0, -36) }}
        >
          <div className="info-window">
            <h3>{selectedCompany.name}</h3>
            <p>{selectedCompany.address}</p>
            {selectedCompany.contact_name && <p>👤 {selectedCompany.contact_name}</p>}
            {selectedCompany.phone && <p>📞 {selectedCompany.phone}</p>}
            {selectedCompany.email && <p>✉️ {selectedCompany.email}</p>}
            {selectedCompany.notes && <p className="notes">{selectedCompany.notes}</p>}
          </div>
        </InfoWindow>
      )}

      {route && (
        <DirectionsRenderer
          directions={route}
          options={{ suppressMarkers: false, polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 4 } }}
        />
      )}

      <div className="map-legend">
        <div className="legend-item"><span className="dot red" /> Not planned</div>
        <div className="legend-item"><span className="dot blue" /> Planned</div>
        <div className="legend-item"><span className="dot green" /> Visited</div>
      </div>
    </GoogleMap>
  );
}
