const express = require('express');
const cors = require('cors');
const path = require('path');
const { read, write, nextId } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── Companies ──────────────────────────────────────────────

app.get('/api/companies', (req, res) => {
  const db = read();
  res.json([...db.companies].sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/companies', (req, res) => {
  const db = read();
  const { name, address, phone, email, contact_name, notes, lat, lng } = req.body;
  const company = {
    id: nextId(db, 'companies'),
    name, address,
    phone: phone || null,
    email: email || null,
    contact_name: contact_name || null,
    notes: notes || null,
    lat: lat || null,
    lng: lng || null,
    created_at: new Date().toISOString(),
  };
  db.companies.push(company);
  write(db);
  res.json(company);
});

app.put('/api/companies/:id', (req, res) => {
  const db = read();
  const id = Number(req.params.id);
  const idx = db.companies.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, address, phone, email, contact_name, notes, lat, lng } = req.body;
  db.companies[idx] = {
    ...db.companies[idx],
    name, address,
    phone: phone || null,
    email: email || null,
    contact_name: contact_name || null,
    notes: notes || null,
    lat: lat || null,
    lng: lng || null,
  };
  write(db);
  res.json(db.companies[idx]);
});

app.delete('/api/companies/:id', (req, res) => {
  const db = read();
  const id = Number(req.params.id);
  db.companies = db.companies.filter(c => c.id !== id);
  db.visits = db.visits.filter(v => v.company_id !== id);
  write(db);
  res.json({ success: true });
});

// ── Visits ─────────────────────────────────────────────────

app.get('/api/visits', (req, res) => {
  const db = read();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const dayVisits = db.visits
    .filter(v => v.visit_date === date)
    .map(v => {
      const company = db.companies.find(c => c.id === v.company_id);
      return { ...v, company_name: company?.name, address: company?.address, lat: company?.lat, lng: company?.lng, phone: company?.phone, contact_name: company?.contact_name };
    })
    .sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
  res.json(dayVisits);
});

app.post('/api/visits', (req, res) => {
  const db = read();
  const { company_id, visit_date } = req.body;
  const existing = db.visits.find(v => v.company_id === Number(company_id) && v.visit_date === visit_date);
  if (existing) return res.json(existing);
  const visit = { id: nextId(db, 'visits'), company_id: Number(company_id), visit_date, status: 'pending', notes: null };
  db.visits.push(visit);
  write(db);
  res.json(visit);
});

app.patch('/api/visits/:id', (req, res) => {
  const db = read();
  const id = Number(req.params.id);
  const idx = db.visits.findIndex(v => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { status, notes } = req.body;
  if (status !== undefined) db.visits[idx].status = status;
  if (notes !== undefined) db.visits[idx].notes = notes;
  write(db);
  res.json(db.visits[idx]);
});

app.delete('/api/visits/:id', (req, res) => {
  const db = read();
  db.visits = db.visits.filter(v => v.id !== Number(req.params.id));
  write(db);
  res.json({ success: true });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CRM server → http://localhost:${PORT}`));
