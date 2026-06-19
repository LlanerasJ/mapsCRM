const BASE = '/api';

export async function fetchCompanies() {
  const res = await fetch(`${BASE}/companies`);
  return res.json();
}

export async function createCompany(data) {
  const res = await fetch(`${BASE}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCompany(id, data) {
  const res = await fetch(`${BASE}/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCompany(id) {
  await fetch(`${BASE}/companies/${id}`, { method: 'DELETE' });
}

export async function fetchVisits(date) {
  const res = await fetch(`${BASE}/visits?date=${date}`);
  return res.json();
}

export async function addVisit(company_id, visit_date) {
  const res = await fetch(`${BASE}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, visit_date }),
  });
  return res.json();
}

export async function updateVisit(id, data) {
  const res = await fetch(`${BASE}/visits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function removeVisit(id) {
  await fetch(`${BASE}/visits/${id}`, { method: 'DELETE' });
}
