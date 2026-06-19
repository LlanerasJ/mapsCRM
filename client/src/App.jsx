import React, { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import MapView from './components/MapView';
import RoutePlanner from './components/RoutePlanner';
import ImportModal from './components/ImportModal';
import * as api from './api';

const LIBRARIES = ['places', 'geometry'];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES,
  });

  const [companies, setCompanies] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('companies');
  const [editingCompany, setEditingCompany] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [route, setRoute] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const [gmapsUrl, setGmapsUrl] = useState('');

  const loadCompanies = useCallback(async () => {
    setCompanies(await api.fetchCompanies());
  }, []);

  const loadVisits = useCallback(async () => {
    setVisits(await api.fetchVisits(selectedDate));
  }, [selectedDate]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);
  useEffect(() => { loadVisits(); }, [loadVisits]);

  const computeRouteFromVisits = useCallback(async (visitList) => {
    if (!isLoaded) return;
    const mappable = visitList.filter(v => v.lat && v.lng);
    if (mappable.length < 2) return;
    const service = new window.google.maps.DirectionsService();
    const stops = mappable.map(v => ({ lat: v.lat, lng: v.lng }));
    try {
      const result = await service.route({
        origin: stops[0],
        destination: stops[stops.length - 1],
        waypoints: stops.slice(1, -1).map(loc => ({ location: loc, stopover: true })),
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setRoute(result);
    } catch (e) {
      console.error('Auto-route failed:', e);
    }
  }, [isLoaded]);

  const handleSaveCompany = async (data) => {
    if (editingCompany?.id) {
      await api.updateCompany(editingCompany.id, data);
    } else {
      await api.createCompany(data);
    }
    setEditingCompany(null);
    loadCompanies();
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    await api.deleteCompany(id);
    loadCompanies();
    loadVisits();
  };

  const handleToggleVisit = async (companyId) => {
    const existing = visits.find(v => v.company_id === companyId);
    if (existing) {
      await api.removeVisit(existing.id);
    } else {
      await api.addVisit(companyId, selectedDate);
    }
    setRoute(null);
    loadVisits();
  };

  const handleMarkVisited = async (visitId, currentStatus) => {
    await api.updateVisit(visitId, {
      status: currentStatus === 'visited' ? 'pending' : 'visited',
    });
    loadVisits();
  };

  const handleRegeocode = useCallback(async () => {
    if (!isLoaded) return;
    const missing = companies.filter(c => !c.lat);
    if (!missing.length) return;
    const geocoder = new window.google.maps.Geocoder();
    for (const company of missing) {
      try {
        const { results } = await geocoder.geocode({ address: company.address });
        if (results.length > 0) {
          const loc = results[0].geometry.location;
          await api.updateCompany(company.id, { ...company, lat: loc.lat(), lng: loc.lng() });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    loadCompanies();
  }, [isLoaded, companies, loadCompanies]);

  const handleImportDone = async (importedCompanies, shouldAutoRoute) => {
    await loadCompanies();
    const freshVisits = await api.fetchVisits(selectedDate);
    setVisits(freshVisits);
    setShowImport(false);
    if (shouldAutoRoute && freshVisits.length >= 2) {
      setActiveTab('planner');
      await computeRouteFromVisits(freshVisits);
    } else if (shouldAutoRoute) {
      setActiveTab('planner');
    }
  };

  const noKey = !API_KEY || API_KEY === 'YOUR_API_KEY_HERE';

  return (
    <div className="app">
      <header className="header">
        <h1>MapsCRM</h1>
        <div className="date-picker">
          <label>Planning date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setRoute(null); setGmapsUrl(''); }}
          />
        </div>
      </header>

      <div className={`main ${mobileShowMap ? 'mobile-map' : 'mobile-list'}`}>
        <aside className="sidebar">
          <div className="tabs">
            <button
              className={activeTab === 'companies' ? 'active' : ''}
              onClick={() => setActiveTab('companies')}
            >
              Companies
            </button>
            <button
              className={activeTab === 'planner' ? 'active' : ''}
              onClick={() => setActiveTab('planner')}
            >
              Day Planner {visits.length > 0 && <span className="badge">{visits.length}</span>}
            </button>
            <button className="tab-map-btn" onClick={() => setMobileShowMap(true)}>
              🗺
            </button>
          </div>

          {activeTab === 'companies' ? (
            <CompanyList
              companies={companies}
              onAdd={() => setEditingCompany({})}
              onEdit={c => setEditingCompany(c)}
              onDelete={handleDeleteCompany}
              onSelect={id => setSelectedCompanyId(id === selectedCompanyId ? null : id)}
              onImport={() => setShowImport(true)}
              onRegeocode={handleRegeocode}
              selectedId={selectedCompanyId}
            />
          ) : (
            <RoutePlanner
              companies={companies}
              visits={visits}
              date={selectedDate}
              isLoaded={isLoaded && !noKey}
              onToggleVisit={handleToggleVisit}
              onMarkVisited={handleMarkVisited}
              onRouteComputed={setRoute}
              onGmapsUrl={setGmapsUrl}
              onViewMap={() => setMobileShowMap(true)}
            />
          )}
        </aside>

        <main className="map-panel">
          <button className="map-back-btn" onClick={() => setMobileShowMap(false)}>
            ← List
          </button>
          {gmapsUrl && (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="gmaps-overlay-btn">
              Open in Google Maps ↗
            </a>
          )}
          {noKey ? (
            <div className="no-key">
              <div className="no-key-box">
                <h2>Google Maps API Key Required</h2>
                <p>Open <code>client/.env.local</code> and replace the placeholder:</p>
                <pre>VITE_GOOGLE_MAPS_API_KEY=your_key_here</pre>
                <p className="hint">
                  Get a key at <strong>console.cloud.google.com</strong> — enable
                  Maps JavaScript API, Geocoding API, and Directions API.
                </p>
              </div>
            </div>
          ) : loadError ? (
            <div className="no-key">
              <div className="no-key-box">
                <h2>Failed to load Google Maps</h2>
                <p>Check that your API key is valid and the Maps JavaScript API is enabled.</p>
              </div>
            </div>
          ) : (
            <MapView
              isLoaded={isLoaded}
              companies={companies}
              visits={visits}
              route={route}
              selectedCompanyId={selectedCompanyId}
              onMarkerClick={id => setSelectedCompanyId(id === selectedCompanyId ? null : id)}
            />
          )}
        </main>
      </div>

      {editingCompany !== null && (
        <CompanyForm
          company={editingCompany}
          isLoaded={isLoaded && !noKey}
          onSave={handleSaveCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}

      {showImport && (
        <ImportModal
          isLoaded={isLoaded && !noKey}
          date={selectedDate}
          onDone={handleImportDone}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
