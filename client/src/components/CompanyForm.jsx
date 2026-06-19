import React, { useState } from 'react';

const EMPTY = { name: '', address: '', phone: '', email: '', contact_name: '', notes: '', lat: null, lng: null };

export default function CompanyForm({ company, isLoaded, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...company });
  const [geocoding, setGeocoding] = useState(false);
  const [geoStatus, setGeoStatus] = useState(company.lat ? 'ok' : '');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const geocodeAddress = async (address) => {
    if (!isLoaded || !address) return null;
    setGeocoding(true);
    setGeoStatus('');
    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address });
      if (results.length > 0) {
        const loc = results[0].geometry.location;
        return { lat: loc.lat(), lng: loc.lng() };
      }
      setGeoStatus('error');
      return null;
    } catch {
      setGeoStatus('error');
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleGeoClick = async () => {
    const coords = await geocodeAddress(form.address);
    if (coords) {
      setForm(f => ({ ...f, ...coords }));
      setGeoStatus('ok');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalForm = { ...form };

    if (!finalForm.lat && isLoaded && finalForm.address) {
      const coords = await geocodeAddress(finalForm.address);
      if (coords) {
        finalForm = { ...finalForm, ...coords };
        setGeoStatus('ok');
      }
    }

    onSave(finalForm);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{company.id ? 'Edit Company' : 'Add Company'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Company Name *</label>
          <input
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Acme Corp"
            autoFocus
          />

          <label>Address *</label>
          <div className="address-row">
            <input
              required
              value={form.address}
              onChange={e => { set('address', e.target.value); set('lat', null); set('lng', null); setGeoStatus(''); }}
              placeholder="123 Main St, City, State ZIP"
            />
            <button
              type="button"
              className="geo-btn"
              onClick={handleGeoClick}
              disabled={!isLoaded || geocoding || !form.address}
              title="Verify location on map"
            >
              {geocoding ? '…' : '📍'}
            </button>
          </div>
          {geoStatus === 'error' && <span className="field-error">Address not found — check for typos</span>}
          {geoStatus === 'ok' && <span className="field-ok">✓ Location verified</span>}

          <label>Contact Name</label>
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Jane Smith" />

          <label>Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />

          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@company.com" />

          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Add any notes about this company..."
          />

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Company</button>
          </div>
        </form>
      </div>
    </div>
  );
}
