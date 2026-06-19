import React, { useState } from 'react';

export default function CompanyList({ companies, onAdd, onEdit, onDelete, onSelect, onImport, onRegeocode, selectedId }) {
  const [search, setSearch] = useState('');

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const unmapped = companies.filter(c => !c.lat).length;

  return (
    <div className="company-list">
      <div className="list-toolbar">
        <input
          className="search"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="toolbar-actions">
          <button className="btn-secondary import-btn" onClick={onImport}>⬆ Import Excel</button>
          <button className="btn-primary add-btn" onClick={onAdd}>+ Add</button>
        </div>
      </div>

      {unmapped > 0 && (
        <div className="regeo-banner">
          <span>⚠ {unmapped} {unmapped === 1 ? 'company is' : 'companies are'} missing map locations</span>
          <button className="btn-link" onClick={onRegeocode}>Fix all</button>
        </div>
      )}

      <div className="list-items">
        {filtered.length === 0 && companies.length === 0 && (
          <div className="empty">
            <p>No companies yet.</p>
            <p>Click <strong>+ Add</strong> to get started.</p>
          </div>
        )}
        {filtered.length === 0 && companies.length > 0 && (
          <div className="empty"><p>No results for "{search}"</p></div>
        )}
        {filtered.map(company => (
          <div
            key={company.id}
            className={`company-item ${selectedId === company.id ? 'selected' : ''}`}
            onClick={() => onSelect(company.id)}
          >
            <div className="company-info">
              <strong>{company.name}</strong>
              <span className="addr">{company.address}</span>
              {company.contact_name && <span className="meta">👤 {company.contact_name}</span>}
              {company.phone && <span className="meta">📞 {company.phone}</span>}
              {!company.lat && <span className="warn">⚠ no location</span>}
            </div>
            <div className="company-actions" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(company)} title="Edit" className="icon-btn">✏️</button>
              <button onClick={() => onDelete(company.id)} title="Delete" className="icon-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
