// Temporary localStorage layer — will be swapped for API calls when backend is ready

import { EQUIPMENT_OPTIONS, MOVEMENT_TYPES } from './constants';

const KEYS = {
  exercises: 'ironlog_exercises',
  equipment: 'ironlog_equipment',
  movementTypes: 'ironlog_movement_types',
};

// ── EXERCISES ─────────────────────────────────────────────────────────

export function getExercises() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.exercises) || '[]');
  } catch {
    return [];
  }
}

export function saveExercises(list) {
  localStorage.setItem(KEYS.exercises, JSON.stringify(list));
}

export function addExercise(exercise) {
  const list = getExercises();
  const newEx = { ...exercise, id: 'ex_' + Date.now(), active: true, createdAt: new Date().toISOString() };
  list.push(newEx);
  saveExercises(list);
  return newEx;
}

export function updateExercise(id, updates) {
  const list = getExercises();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates };
  saveExercises(list);
  return list[idx];
}

export function deleteExercise(id) {
  const list = getExercises().filter(e => e.id !== id);
  saveExercises(list);
}

export function toggleActive(id) {
  const list = getExercises();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return;
  list[idx].active = !list[idx].active;
  saveExercises(list);
  return list[idx];
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────

export function getEquipment() {
  try {
    const saved = localStorage.getItem(KEYS.equipment);
    if (saved) return JSON.parse(saved);
    // First time: seed from constants
    localStorage.setItem(KEYS.equipment, JSON.stringify(EQUIPMENT_OPTIONS));
    return [...EQUIPMENT_OPTIONS];
  } catch {
    return [...EQUIPMENT_OPTIONS];
  }
}

export function addEquipment(name) {
  const list = getEquipment();
  const trimmed = name.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  const updated = [...list, trimmed].sort();
  localStorage.setItem(KEYS.equipment, JSON.stringify(updated));
  return updated;
}

export function deleteEquipment(name) {
  const updated = getEquipment().filter(e => e !== name);
  localStorage.setItem(KEYS.equipment, JSON.stringify(updated));
  return updated;
}

// ── MOVEMENT TYPES ────────────────────────────────────────────────────

export function getMovementTypes() {
  try {
    const saved = localStorage.getItem(KEYS.movementTypes);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(KEYS.movementTypes, JSON.stringify(MOVEMENT_TYPES));
    return [...MOVEMENT_TYPES];
  } catch {
    return [...MOVEMENT_TYPES];
  }
}

export function addMovementType(name) {
  const list = getMovementTypes();
  const trimmed = name.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  const updated = [...list, trimmed].sort();
  localStorage.setItem(KEYS.movementTypes, JSON.stringify(updated));
  return updated;
}

export function deleteMovementType(name) {
  const updated = getMovementTypes().filter(e => e !== name);
  localStorage.setItem(KEYS.movementTypes, JSON.stringify(updated));
  return updated;
}
