import React, { useState } from 'react';

export default function RoutePlanner({ companies, visits, date, isLoaded, onToggleVisit, onMarkVisited, onRouteComputed, onViewMap }) {
  const [startAddress, setStartAddress] = useState('');
  const [computing, setComputing] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');

  const visitMap = Object.fromEntries(visits.map(v => [v.company_id, v]));
  const plannedIds = new Set(visits.map(v => v.company_id));
  const mappableVisits = visits.filter(v => v.lat && v.lng);
  const visitedCount = visits.filter(v => v.status === 'visited').length;

  const computeRoute = async () => {
    if (mappableVisits.length < 2) return;
    setComputing(true);
    setRouteError('');
    setGmapsUrl('');

    const service = new window.google.maps.DirectionsService();
    const stops = mappableVisits.map(v => ({ lat: v.lat, lng: v.lng }));

    let origin, destination, waypoints, middleStops;
    if (startAddress.trim()) {
      origin = startAddress.trim();
      destination = stops[stops.length - 1];
      middleStops = stops.slice(0, -1);
      waypoints = middleStops.map(loc => ({ location: loc, stopover: true }));
    } else {
      origin = stops[0];
      destination = stops[stops.length - 1];
      middleStops = stops.slice(1, -1);
      waypoints = middleStops.map(loc => ({ location: loc, stopover: true }));
    }

    try {
      const result = await service.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      onRouteComputed(result);
      onViewMap();

      // Build Google Maps URL with optimized waypoint order
      const order = result.routes[0].waypoint_order;
      const reordered = order.map(i => middleStops[i]);
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const allCoords = [
        originStr,
        ...reordered.map(s => `${s.lat},${s.lng}`),
        `${destination.lat},${destination.lng}`,
      ];
      setGmapsUrl(`https://www.google.com/maps/dir/${allCoords.join('/')}`);
    } catch {
      setRouteError('Could not compute route. Check that all companies have valid addresses.');
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="route-planner">
      <div className="planner-header">
        <div className="planner-title">
          <strong>Route for {date}</strong>
          {visits.length > 0 && (
            <span className="visit-summary">{visitedCount}/{visits.length} visited</span>
          )}
        </div>
        <p className="hint">Check companies to add them to today's route</p>
      </div>

      <div className="company-checklist">
        {companies.length === 0 && (
          <div className="empty">
            <p>Add companies first, then plan your route here.</p>
          </div>
        )}
        {companies.map(company => {
          const visit = visitMap[company.id];
          const isPlanned = plannedIds.has(company.id);
          const isVisited = visit?.status === 'visited';
          return (
            <div
              key={company.id}
              className={`check-item ${isVisited ? 'item-visited' : isPlanned ? 'item-planned' : ''}`}
            >
              <input
                type="checkbox"
                id={`chk-${company.id}`}
                checked={isPlanned}
                onChange={() => onToggleVisit(company.id)}
              />
              <label htmlFor={`chk-${company.id}`}>
                <span className="chk-name">{company.name}</span>
                <span className="chk-addr">{company.address}</span>
                {!company.lat && <span className="warn">⚠ no location</span>}
              </label>
              {visit && (
                <button
                  className={`visit-toggle ${isVisited ? 'toggled' : ''}`}
                  onClick={() => onMarkVisited(visit.id, visit.status)}
                  title={isVisited ? 'Mark as pending' : 'Mark as visited'}
                >
                  {isVisited ? '✓' : '○'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {visits.length > 0 && (
        <div className="route-controls">
          <label>Start from (optional)</label>
          <input
            value={startAddress}
            onChange={e => { setStartAddress(e.target.value); setGmapsUrl(''); }}
            placeholder="Your office or home address"
          />
          <button
            className="btn-primary plan-btn"
            onClick={computeRoute}
            disabled={!isLoaded || computing || mappableVisits.length < 2}
          >
            {computing ? 'Computing route…' : `Plan Route (${mappableVisits.length} stops)`}
          </button>
          {gmapsUrl && (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="btn-gmaps">
              Open in Google Maps ↗
            </a>
          )}
          {mappableVisits.length < 2 && (
            <p className="hint">Need at least 2 companies with verified locations to compute a route.</p>
          )}
          {routeError && <p className="field-error">{routeError}</p>}
        </div>
      )}
    </div>
  );
}
