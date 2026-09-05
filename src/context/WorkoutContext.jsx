import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../data/api';
import { useToast } from '../components/Toast';

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [session, setSession] = useState(null);   // active session object
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  // On mount, check if there's an in_progress session from today
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const sessions = await api.workouts.getSessions();
        const today = new Date().toDateString();
        const active = sessions.find(s =>
          s.status === 'in_progress' && new Date(s.date).toDateString() === today
        );
        if (active) setSession(active);
      } catch (_) {}
    }
    checkActiveSession();
  }, []);

  const startSession = useCallback(async (workoutTypes) => {
    setLoading(true);
    try {
      const s = await api.workouts.createSession({ workoutTypes });
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

  const finishSession = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updated = await api.workouts.updateSession(session._id, {
        status: 'completed',
        endTime: new Date(),
      });
      setSession(null);
      showToast('Workout saved!', 'success');
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
      setSession(null);
    } catch (_) {
      setSession(null);
    }
  }, [session]);

  return (
    <WorkoutContext.Provider value={{
      session, loading,
      startSession, addExerciseToSession, addSet, deleteSet,
      finishSession, discardSession,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => useContext(WorkoutContext);
