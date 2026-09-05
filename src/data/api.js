const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getToken() {
  return localStorage.getItem('ironlog_token');
}

async function request(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    signup: (data) => request('POST', '/auth/signup', data, false),
    login:  (data) => request('POST', '/auth/login',  data, false),
    me:     ()     => request('GET',  '/auth/me'),
  },

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
