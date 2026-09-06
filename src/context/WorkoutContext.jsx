import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../data/api';
import { useToast } from '../components/Toast';

const WorkoutContext = createContext(null);

const LS_KEY = 'ironlog_active_session';

// Save session snapshot to localStorage
function persistLocally(session) {
  if (!session) {
    localStorage.removeItem(LS_KEY);
  } else {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ...session, _localSavedAt: Date.now() }));
    } catch (_) {}
  }
}

// Load local snapshot (only used as fallback if API returns nothing)
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Discard snapshots older than 24h
    if (Date.now() - (data._localSavedAt || 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

export function WorkoutProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCompleted, setLastCompleted] = useState(null);
  const showToast = useToast();
  const saveDebounce = useRef({});

  // ── Persist to localStorage on every session change ──
  useEffect(() => {
    persistLocally(session);
  }, [session]);

  // ── Warn browser before tab close if workout is active ──
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (session) {
        e.preventDefault();
        e.returnValue = 'You have an active workout. Your progress is saved — are you sure you want to leave?';
        return e.returnValue;
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  // ── On mount: fetch from API, fall back to localStorage ──
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const sessions = await api.workouts.getSessions();
        const today = new Date().toDateString();
        const active = sessions.find(s =>
          s.status === 'in_progress' && new Date(s.date).toDateString() === today
        );
        if (active) {
          // Merge in any locally-saved set values that may be newer than the DB
          const local = loadLocal();
          if (local && local._id === active._id) {
            // Use local set values (more recent, since updateSet is fire-and-forget)
            const merged = mergeLocalSets(active, local);
            setSession(merged);
          } else {
            setSession(active);
          }
        } else {
          // No API session — check if there's a local snapshot (offline/API failure scenario)
          const local = loadLocal();
          if (local && local.status === 'in_progress') {
            setSession(local);
            showToast('Restored your last workout session', 'success');
          }
        }
      } catch (_) {
        // API failed — try local
        const local = loadLocal();
        if (local && local.status === 'in_progress') {
          setSession(local);
          showToast('Restored workout from local cache', 'success');
        }
      }
    }
    checkActiveSession();
  }, []);

  // exercises = optional array of { exerciseId, exerciseName, muscleGroup, isBodyweight, isTimed, unilateral }
  const startSession = useCallback(async (workoutTypes, exercises = []) => {
    setLoading(true);
    try {
      let s = await api.workouts.createSession({ workoutTypes });
      // Bulk-add pre-selected exercises sequentially
      for (const ex of exercises) {
        s = await api.workouts.addExercise(s._id, ex);
      }
      setSession(s);
      return s;
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const addExerciseToSession = useCallback(async (exerciseData) => {
    if (!session) return;
    try {
      const updated = await api.workouts.addExercise(session._id, exerciseData);
      setSession(updated);
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [session, showToast]);

  const removeExercise = useCallback(async (exerciseId) => {
    if (!session) return;
    // Optimistic update immediately
    setSession(prev => prev ? {
      ...prev,
      exercises: prev.exercises.filter(ex => ex._id !== exerciseId),
    } : prev);
    try {
      const updated = await api.workouts.removeExercise(session._id, exerciseId);
      setSession(updated);
    } catch (err) {
      showToast(err.message, 'error');
      // Revert by re-fetching would be ideal, but toast is enough for now
    }
  }, [session, showToast]);

  const addSet = useCallback(async (exerciseId, setData) => {
    if (!session) return;
    try {
      const updated = await api.workouts.addSet(session._id, exerciseId, setData);
      setSession(updated);
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [session, showToast]);

  const deleteSet = useCallback(async (exerciseId, setId) => {
    if (!session) return;
    try {
      const updated = await api.workouts.deleteSet(session._id, exerciseId, setId);
      setSession(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [session, showToast]);

  // Optimistic local update + debounced API save (600ms)
  const updateSet = useCallback((exerciseId, setId, data) => {
    if (!session) return;

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex._id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => s._id === setId ? { ...s, ...data } : s),
          };
        }),
      };
    });

    // Debounce API call per set
    const key = `${exerciseId}_${setId}`;
    clearTimeout(saveDebounce.current[key]);
    saveDebounce.current[key] = setTimeout(() => {
      api.workouts.updateSet(session._id, exerciseId, setId, data).catch(() => {});
    }, 600);
  }, [session]);

  const finishSession = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updated = await api.workouts.updateSession(session._id, {
        status: 'completed',
        endTime: new Date(),
      });
      setSession(null);
      setLastCompleted(updated); // store for summary screen
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [session, showToast]);

  const discardSession = useCallback(async () => {
    if (!session) return;
    try {
      await api.workouts.updateSession(session._id, { status: 'completed' });
    } catch (_) {}
    setSession(null);
    localStorage.removeItem(LS_KEY);
  }, [session]);

  return (
    <WorkoutContext.Provider value={{
      session, loading, lastCompleted, clearLastCompleted: () => setLastCompleted(null),
      startSession, addExerciseToSession, removeExercise, addSet, deleteSet, updateSet,
      finishSession, discardSession,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => useContext(WorkoutContext);

// Merge local set values into the server session (local wins for set values)
function mergeLocalSets(serverSession, localSession) {
  if (!localSession?.exercises) return serverSession;
  return {
    ...serverSession,
    exercises: serverSession.exercises.map(ex => {
      const localEx = localSession.exercises.find(le => le._id === ex._id);
      if (!localEx) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => {
          const localSet = localEx.sets?.find(ls => ls._id === s._id);
          return localSet ? { ...s, ...localSet } : s;
        }),
      };
    }),
  };
}
