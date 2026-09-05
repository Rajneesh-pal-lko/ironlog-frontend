// Central API layer — all backend calls go through here
// When backend URL changes (e.g. deployed to Render), only change BASE_URL

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── EXERCISES ─────────────────────────────────────────────────────────
export const api = {
  exercises: {
    getAll:       ()           => request('GET',    '/exercises'),
    create:       (data)       => request('POST',   '/exercises', data),
    update:       (id, data)   => request('PUT',    `/exercises/${id}`, data),
    toggleActive: (id)         => request('PATCH',  `/exercises/${id}/toggle`),
    delete:       (id)         => request('DELETE', `/exercises/${id}`),
  },

  equipment: {
    getAll: ()     => request('GET',    '/settings/equipment'),
    add:    (name) => request('POST',   '/settings/equipment', { name }),
    delete: (name) => request('DELETE', `/settings/equipment/${encodeURIComponent(name)}`),
  },

  movementTypes: {
    getAll: ()     => request('GET',    '/settings/movement-types'),
    add:    (name) => request('POST',   '/settings/movement-types', { name }),
    delete: (name) => request('DELETE', `/settings/movement-types/${encodeURIComponent(name)}`),
  },
};
