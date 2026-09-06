import { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { api } from '../../data/api';
import { MUSCLE_EMOJI } from '../../data/constants';
import RoutineSetup from '../../components/RoutineSetup';
import SmartExercisePicker from './SmartExercisePicker';
import styles from './StartWorkout.module.css';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatSets(ex) {
  const sets = ex.sets || [];
  if (!sets.length) return '';
  if (ex.isTimed)      return `${sets.length} sets`;
  if (ex.isBodyweight) return sets.map(s => `${s.reps}reps`).join(' · ');
  return sets.map(s => `${s.weight}×${s.reps}`).join(' · ');
}

function daysSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default function StartWorkout({ onMenuOpen }) {
  const { startSession, loading } = useWorkout();

  // Dev-only: simulate a different day of week
  const [devDayOffset, setDevDayOffset] = useState(0);
  const realDay = new Date().getDay();
  const simDay = import.meta.env.DEV ? (realDay + devDayOffset + 7) % 7 : realDay;

  const today = DAY_KEYS[simDay];
  const todayLong = import.meta.env.DEV && devDayOffset !== 0
    ? DAY_LABELS[simDay]
    : new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [routine, setRoutine]             = useState(null);   // user's weekly routine
  const [lastSession, setLastSession]     = useState(null);   // last session on this weekday
  const [loadingData, setLoadingData]     = useState(true);
  const [selected, setSelected]           = useState({});     // { exerciseId: true/false }
  const [extraExercises, setExtraExercises] = useState([]);   // added via picker
  const [showPicker, setShowPicker]       = useState(false);
  const [showRoutineSetup, setShowRoutineSetup] = useState(false);

  // Load routine + last same-weekday session in parallel
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      api.routine.get().catch(() => null),
      api.workouts.lastByWeekday(simDay).catch(() => null),
    ]).then(([routineData, sessionData]) => {
      setRoutine(routineData);
      setLastSession(sessionData);
      // Pre-select all exercises from last session
      if (sessionData?.exercises) {
        const sel = {};
        sessionData.exercises.forEach(ex => { sel[ex.exerciseId] = true; });
        setSelected(sel);
      }
    }).finally(() => setLoadingData(false));
  }, [simDay]);

  const todayRoutine = routine?.[today]; // { labels[], workoutTypes[], isRest }
  // Support old single-label format
  const todayLabels = todayRoutine?.labels?.length
    ? todayRoutine.labels
    : todayRoutine?.label ? [todayRoutine.label] : [];
  const hasRoutine = todayLabels.length > 0;
  const isRestDay = todayRoutine?.isRest;

  const selectedFromHistory = (lastSession?.exercises || []).filter(ex => selected[ex.exerciseId]);
  const selectedExercises = [...selectedFromHistory, ...extraExercises];

  async function handleStart() {
    const workoutTypes = todayRoutine?.workoutTypes || [];
    const exercisesToAdd = selectedExercises.map(ex => ({
      exerciseId:   ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup:  ex.muscleGroup,
      isBodyweight: ex.isBodyweight,
      isTimed:      ex.isTimed,
      unilateral:   ex.unilateral,
    }));
    await startSession(workoutTypes, exercisesToAdd);
  }

  function toggleEx(exerciseId) {
    setSelected(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }

  function handlePickerSelect(ex) {
    // Don't add if already in history list or already added
    const alreadyInHistory = (lastSession?.exercises || []).some(e => e.exerciseId === ex.exerciseId);
    const alreadyExtra = extraExercises.some(e => e.exerciseId === ex.exerciseId);
    if (alreadyInHistory) {
      // Just check it in the history list instead
      setSelected(prev => ({ ...prev, [ex.exerciseId]: true }));
    } else if (!alreadyExtra) {
      setExtraExercises(prev => [...prev, ex]);
    }
    setShowPicker(false);
  }

  function removeExtra(exerciseId) {
    setExtraExercises(prev => prev.filter(e => e.exerciseId !== exerciseId));
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.greeting}>{getGreeting()} 💪</span>
            <span className={styles.logo}>Iron<span>Log</span></span>
          </div>
          <div className={styles.headerBtns}>
            {onMenuOpen && (
              <button className={styles.menuBtn} onClick={onMenuOpen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className={styles.date}>{todayLong}</p>

        {import.meta.env.DEV && (
          <div className={styles.devDayPicker}>
            <span className={styles.devLabel}>🧪 Simulate day:</span>
            {DAY_LABELS.map((d, i) => (
              <button
                key={d}
                className={`${styles.devDayBtn} ${simDay === i ? styles.devDayBtnActive : ''}`}
                onClick={() => setDevDayOffset((i - realDay + 7) % 7)}
              >{d.slice(0, 3)}</button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.body}>

        {loadingData ? (
          <div className={styles.loadingWrap}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} style={{ width: '60%' }} />
            <div className={styles.skeleton} style={{ height: 80, marginTop: 24 }} />
          </div>
        ) : (

          <>
            {/* ── Today's routine label ── */}
            <div className={styles.todayRow}>
              {hasRoutine ? (
                <div className={styles.todayRoutine}>
                  <span className={styles.todayDayLabel}>Today</span>
                  <div className={styles.todayLabels}>
                    {todayLabels.map(l => (
                      <span key={l} className={`${styles.todayLabel} ${isRestDay ? styles.restLabel : styles.trainLabel}`}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noRoutine}>
                  <span className={styles.noRoutineText}>No routine set for today</span>
                </div>
              )}
              <button className={styles.editRoutineBtn} onClick={() => setShowRoutineSetup(true)}>
                {hasRoutine ? 'Edit' : '+ Set Routine'}
              </button>
            </div>

            {/* ── Rest day state ── */}
            {isRestDay ? (
              <div className={styles.restDayCard}>
                <div className={styles.restDayIcon}>😴</div>
                <p className={styles.restDayTitle}>Rest Day</p>
                <p className={styles.restDaySub}>Recovery is part of the program.</p>
                <button className={styles.restDayOverride} onClick={handleStart} disabled={loading}>
                  {loading ? 'Starting…' : 'Train anyway'}
                </button>
              </div>
            ) : (
              <>
                {/* ── Last session on this weekday ── */}
                {lastSession ? (
                  <div className={styles.lastSessionSection}>
                    <div className={styles.lastSessionHeader}>
                      <span className={styles.lastSessionTitle}>
                        Last {DAY_LABELS[simDay]}
                      </span>
                      <span className={styles.lastSessionMeta}>
                        {daysSince(lastSession.date)} · {lastSession.exercises.length} exercises
                      </span>
                    </div>

                    <p className={styles.hint}>Select exercises for today — uncheck what you're skipping</p>

                    {/* Exercise checklist */}
                    <div className={styles.exerciseList}>
                      {lastSession.exercises.map(ex => {
                        const isChecked = !!selected[ex.exerciseId];
                        return (
                          <button
                            key={ex.exerciseId}
                            className={`${styles.exCard} ${isChecked ? styles.exCardChecked : styles.exCardUnchecked}`}
                            onClick={() => toggleEx(ex.exerciseId)}
                          >
                            <div className={styles.exCardLeft}>
                              <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                                {isChecked && <span>✓</span>}
                              </div>
                              <div className={styles.exCardInfo}>
                                <span className={styles.exCardName}>{ex.exerciseName}</span>
                                <span className={styles.exCardMeta}>
                                  {ex.muscleGroup && <span className={styles.exCardMuscle}>{MUSCLE_EMOJI[ex.muscleGroup] || '💪'} {ex.muscleGroup}</span>}
                                  {ex.sets?.length > 0 && <span className={styles.exCardSets}>{formatSets(ex)}</span>}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Select all / none */}
                    <div className={styles.selectRow}>
                      <button className={styles.selectAllBtn} onClick={() => {
                        const sel = {};
                        lastSession.exercises.forEach(ex => { sel[ex.exerciseId] = true; });
                        setSelected(sel);
                      }}>Select all</button>
                      <button className={styles.selectAllBtn} onClick={() => setSelected({})}>Clear all</button>
                    </div>
                  </div>
                ) : null}

                {/* Extra exercises added via picker */}
                {extraExercises.length > 0 && (
                  <div className={styles.extraSection}>
                    <p className={styles.extraLabel}>Added by you</p>
                    <div className={styles.exerciseList}>
                      {extraExercises.map(ex => (
                        <div key={ex.exerciseId} className={`${styles.exCard} ${styles.exCardChecked}`}>
                          <div className={styles.exCardLeft}>
                            <div className={`${styles.checkbox} ${styles.checkboxChecked}`}>✓</div>
                            <div className={styles.exCardInfo}>
                              <span className={styles.exCardName}>{ex.exerciseName}</span>
                              <span className={styles.exCardMeta}>
                                {ex.muscleGroup && <span className={styles.exCardMuscle}>{MUSCLE_EMOJI[ex.muscleGroup] || '💪'} {ex.muscleGroup}</span>}
                                <span className={styles.exCardSets}>New</span>
                              </span>
                            </div>
                          </div>
                          <button className={styles.removeExtraBtn} onClick={() => removeExtra(ex.exerciseId)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add exercise button */}
                <button className={styles.addExBtn} onClick={() => setShowPicker(true)}>
                  + Add Exercise
                </button>

                {!lastSession && (
                  /* No history for this weekday */
                  <div className={styles.noHistoryCard}>
                    <div className={styles.noHistoryIcon}>📋</div>
                    <p className={styles.noHistoryTitle}>
                      No history for {DAY_LABELS[simDay]} yet
                    </p>
                    <p className={styles.noHistoryHint}>
                      After today's session, you'll see your exercises here next week.
                    </p>
                  </div>
                )}

                {/* ── Start CTA ── */}
                <button
                  className={`${styles.startBtn} ${selectedExercises.length > 0 ? styles.startBtnReady : ''}`}
                  onClick={handleStart}
                  disabled={loading}
                >
                  {loading ? 'Starting…' :
                    selectedExercises.length > 0
                      ? `🏋️  Start ${hasRoutine && !isRestDay && todayLabels.length ? todayLabels[0] : 'Workout'}  ·  ${selectedExercises.length} exercise${selectedExercises.length !== 1 ? 's' : ''}`
                      : `🏋️  Start Empty Workout`
                  }
                </button>
              </>
            )}
          </>
        )}
      </div>

      {showPicker && (
        <SmartExercisePicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          routineLabels={todayLabels}
          alreadyAdded={[
            ...(lastSession?.exercises || []).filter(e => selected[e.exerciseId]).map(e => e.exerciseId),
            ...extraExercises.map(e => e.exerciseId),
          ]}
        />
      )}

      {showRoutineSetup && <RoutineSetup
        onClose={() => setShowRoutineSetup(false)}
        onSaved={() => api.routine.get().then(setRoutine).catch(() => {})}
      />}
    </div>
  );
}
