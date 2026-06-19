import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import * as api from '../api';

const FIELDS = {
  name:         { label: 'Company Name', required: true },
  address:      { label: 'Address',      required: true },
  phone:        { label: 'Phone',        required: false },
  email:        { label: 'Email',        required: false },
  contact_name: { label: 'Contact Name', required: false },
};

const AUTO_DETECT = {
  name:         ['name', 'company', 'business', 'organization', 'account'],
  address:      ['address', 'street', 'location', 'addr'],
  phone:        ['phone', 'tel', 'telephone', 'mobile', 'cell'],
  email:        ['email', 'e-mail', 'mail'],
  contact_name: ['contact', 'rep', 'person', 'salesperson', 'owner'],
};

function detectCol(columns, field) {
  return columns.find(col =>
    AUTO_DETECT[field].some(kw => col.toLowerCase().includes(kw))
  ) || '';
}

export default function ImportModal({ isLoaded, date, onDone, onClose }) {
  const [step, setStep] = useState('idle');   // idle | mapping | importing | done
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({ name: '', address: '', phone: '', email: '', contact_name: '' });
  const [addToRoute, setAddToRoute] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [summary, setSummary] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const parseFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!data.length) return;
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setRows(data);
      setMapping({
        name:         detectCol(cols, 'name'),
        address:      detectCol(cols, 'address'),
        phone:        detectCol(cols, 'phone'),
        email:        detectCol(cols, 'email'),
        contact_name: detectCol(cols, 'contact_name'),
      });
      setStep('mapping');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onFileInput = (e) => { if (e.target.files[0]) parseFile(e.target.files[0]); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
  };

  const validRows = rows.filter(r =>
    String(r[mapping.name] || '').trim() && String(r[mapping.address] || '').trim()
  );

  const handleImport = async () => {
    if (!mapping.name || !mapping.address) return;
    setStep('importing');

    const geocoder = isLoaded ? new window.google.maps.Geocoder() : null;
    const imported = [];
    const noGeo = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const name    = String(row[mapping.name]    || '').trim();
      const address = String(row[mapping.address] || '').trim();

      setProgress({ done: i + 1, total: validRows.length, label: name });

      let lat = null, lng = null;
      if (geocoder) {
        try {
          const { results } = await geocoder.geocode({ address });
          if (results.length > 0) {
            lat = results[0].geometry.location.lat();
            lng = results[0].geometry.location.lng();
          } else {
            noGeo.push(name);
          }
        } catch {
          noGeo.push(name);
        }
        // Small delay to avoid hitting geocoding rate limits
        await new Promise(r => setTimeout(r, 300));
      }

      try {
        const company = await api.createCompany({
          name,
          address,
          phone:        mapping.phone        ? String(row[mapping.phone]        || '').trim() || null : null,
          email:        mapping.email        ? String(row[mapping.email]        || '').trim() || null : null,
          contact_name: mapping.contact_name ? String(row[mapping.contact_name] || '').trim() || null : null,
          lat,
          lng,
        });
        imported.push(company);
      } catch {
        noGeo.push(name);
      }
    }

    if (addToRoute && imported.length) {
      for (const company of imported) {
        await api.addVisit(company.id, date);
      }
    }

    setSummary({ imported, noGeo, addToRoute });
    setStep('done');
    onDone(imported, addToRoute);
  };

  const canImport = mapping.name && mapping.address && validRows.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import from Excel / CSV</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Step: idle ── */}
        {step === 'idle' && (
          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
          >
            <div className="dropzone-icon">📂</div>
            <p><strong>Drop your file here</strong> or click to browse</p>
            <p className="hint">Supports .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={onFileInput}
            />
          </div>
        )}

        {/* ── Step: mapping ── */}
        {step === 'mapping' && (
          <>
            <p className="import-info">
              Found <strong>{rows.length} rows</strong> in the file.
              Match your columns to the fields below:
            </p>
            <div className="col-mapping">
              {Object.entries(FIELDS).map(([field, { label, required }]) => (
                <div key={field} className="col-row">
                  <label>{label}{required && ' *'}</label>
                  <select
                    value={mapping[field]}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                  >
                    <option value="">— skip —</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="preview-wrap">
              <p className="hint">Preview (first 5 rows)</p>
              <div className="preview-scroll">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {Object.entries(FIELDS)
                        .filter(([f]) => mapping[f])
                        .map(([f, { label }]) => <th key={f}>{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.entries(FIELDS)
                          .filter(([f]) => mapping[f])
                          .map(([f]) => (
                            <td key={f}>{String(row[mapping[f]] || '')}</td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <label className="route-check">
              <input
                type="checkbox"
                checked={addToRoute}
                onChange={e => setAddToRoute(e.target.checked)}
              />
              Add all imported companies to today's route and auto-plan it
            </label>

            {!canImport && (
              <p className="field-error">Select at least Company Name and Address columns to continue.</p>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleImport} disabled={!canImport}>
                Import {validRows.length} {validRows.length === 1 ? 'company' : 'companies'}
              </button>
            </div>
          </>
        )}

        {/* ── Step: importing ── */}
        {step === 'importing' && (
          <div className="import-progress">
            <p className="progress-label">
              Geocoding {progress.done} of {progress.total}…
            </p>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="progress-company">{progress.label}</p>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && summary && (
          <div className="import-done">
            <div className="done-icon">✓</div>
            <p><strong>{summary.imported.length}</strong> {summary.imported.length === 1 ? 'company' : 'companies'} imported</p>
            {summary.noGeo.length > 0 && (
              <p className="warn-text">
                ⚠ {summary.noGeo.length} address{summary.noGeo.length > 1 ? 'es' : ''} couldn't be geocoded — they're saved but won't appear on the map.
              </p>
            )}
            {summary.addToRoute && (
              <p className="success-text">Added to today's route — planning now…</p>
            )}
            <button className="btn-primary" onClick={onClose} style={{ marginTop: 20 }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
