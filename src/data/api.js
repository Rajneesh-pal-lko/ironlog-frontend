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
    toggleActive:     (id) => request('PATCH', `/exercises/${id}/toggle`),
    toggleFavourite:  (id) => request('PATCH', `/exercises/${id}/favourite`),
    delete:       (id)         => request('DELETE', `/exercises/${id}`),
  },

  equipment: {
    getAll: ()     => request('GET',    '/settings/equipment'),
    add:    (name) => request('POST',   '/settings/equipment', { name }),
    delete: (name) => request('DELETE', `/settings/equipment/${encodeURIComponent(name)}`),
  },

  workouts: {
    getSessions:   ()               => request('GET',    '/workouts'),
    getSession:    (id)             => request('GET',    `/workouts/${id}`),
    createSession: (data)           => request('POST',   '/workouts', data),
    updateSession: (id, data)       => request('PATCH',  `/workouts/${id}`, data),
    addExercise:   (id, data)       => request('POST',   `/workouts/${id}/exercises`, data),
    addSet:        (id, exId, data) => request('POST',   `/workouts/${id}/exercises/${exId}/sets`, data),
    deleteSet:     (id, exId, setId)     => request('DELETE', `/workouts/${id}/exercises/${exId}/sets/${setId}`),
    updateSet:     (id, exId, setId, data) => request('PATCH', `/workouts/${id}/exercises/${exId}/sets/${setId}`, data),
    getHistory:    (exerciseId)     => request('GET',    `/workouts/history/${exerciseId}`),
  },

  progress: {
    calendar:      (months = 3)    => request('GET', `/progress/calendar?months=${months}`),
    byDate:        (date)          => request('GET', `/progress/by-date?date=${date}`),
    byExercise:    (id, limit = 0) => request('GET', `/progress/by-exercise/${id}?limit=${limit}`),
    byMuscle:      (muscle)        => request('GET', `/progress/by-muscle/${encodeURIComponent(muscle)}`),
    exercisesDone: ()              => request('GET', '/progress/exercises-done'),
  },

  seed: {
    demoHistory: () => request('POST', '/seed/demo-history'),
  },

  movementTypes: {
    getAll: ()     => request('GET',    '/settings/movement-types'),
    add:    (name) => request('POST',   '/settings/movement-types', { name }),
    delete: (name) => request('DELETE', `/settings/movement-types/${encodeURIComponent(name)}`),
  },
};
