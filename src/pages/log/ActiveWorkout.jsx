import { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import SetLogger from './SetLogger';
import SmartExercisePicker from './SmartExercisePicker';
import styles from './ActiveWorkout.module.css';

function useElapsed(startTime) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = startTime ? new Date(startTime).getTime() : Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function setsSummary(ex) {
  const sets = ex.sets || [];
  if (!sets.length) return 'No sets';
  if (ex.isTimed) return `${sets.length} set${sets.length > 1 ? 's' : ''}`;
  if (ex.isBodyweight) return sets.map(s => `${s.reps || 0}`).join(' · ') + ' reps';
  return sets.map(s => `${s.weight || 0}×${s.reps || 0}`).join(' · ');
}

export default function ActiveWorkout() {
  const { session, addExerciseToSession, removeExercise, finishSession, discardSession, loading } = useWorkout();
  const [activeIdx, setActiveIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const elapsed = useElapsed(session?.startTime);

  const exercises = session?.exercises || [];

  // When a new exercise is added, focus it
  useEffect(() => {
    if (exercises.length > 0) setActiveIdx(exercises.length - 1);
  }, [exercises.length]);

  // Auto-open picker on fresh session with no exercises
  useEffect(() => {
    if (session && exercises.length === 0) {
      const t = setTimeout(() => setPickerOpen(true), 300);
      return () => clearTimeout(t);
    }
  }, [session?._id]); // only on new session, not every render

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  async function handleAddExercise(data) {
    await addExerciseToSession(data);
    // activeIdx will update via useEffect
  }

  if (!session) return null;

  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);

  return (
    <div className={styles.page}>

      {/* ── Sticky header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.dateStr}>{dateStr}</span>
          <span className={styles.timer}>{elapsed}</span>
        </div>
        <button className={styles.finishBtn} onClick={() => setConfirmFinish(true)}>
          Finish
        </button>
      </div>

      {/* ── Workout type tags ── */}
      {session.workoutTypes?.length > 0 && (
        <div className={styles.typesRow}>
          {session.workoutTypes.map(t => (
            <span key={t} className={styles.typeTag}>{t}</span>
          ))}
        </div>
      )}

      {/* ── Progress bar + dots ── */}
      {exercises.length > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${((activeIdx + 1) / exercises.length) * 100}%` }}
            />
          </div>
          <div className={styles.progressDots}>
            {exercises.map((ex, i) => (
              <button
                key={ex._id}
                className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''} ${i < activeIdx ? styles.dotDone : ''}`}
                onClick={() => setActiveIdx(i)}
                title={ex.exerciseName}
              />
            ))}
          </div>
          <span className={styles.progressLabel}>
            Exercise {activeIdx + 1} of {exercises.length} · {totalSets} set{totalSets !== 1 ? 's' : ''} logged
          </span>
        </div>
      )}

      {/* ── Previous exercises (collapsed) ── */}
      {exercises.slice(0, activeIdx).map((ex, i) => (
        <div key={ex._id} className={styles.doneCard}>
          <button className={styles.doneCardMain} onClick={() => setActiveIdx(i)}>
            <div className={styles.doneLeft}>
              <span className={styles.doneTick}>✓</span>
              <div>
                <span className={styles.doneName}>{ex.exerciseName}</span>
                <span className={styles.doneSets}>{setsSummary(ex)}</span>
              </div>
            </div>
            <span className={styles.doneEdit}>Edit</span>
          </button>
          <button
            className={styles.doneRemoveBtn}
            onClick={() => { removeExercise(ex._id); setActiveIdx(Math.max(0, activeIdx - 1)); }}
            title="Remove exercise"
          >✕</button>
        </div>
      ))}

      {/* ── Active exercise ── */}
      {exercises.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏋️</div>
          <p>No exercises yet.<br />Tap <strong>Add Exercise</strong> below to start.</p>
        </div>
      ) : (
        <div className={styles.activeCard}>
          <div className={styles.activeCardLabel}>
            <span>Current Exercise</span>
            <div className={styles.activeCardActions}>
              <span className={styles.activeCardNum}>{activeIdx + 1} / {exercises.length}</span>
              <button
                className={styles.removeExBtn}
                onClick={() => {
                  const ex = exercises[activeIdx];
                  const newIdx = Math.max(0, activeIdx - 1);
                  removeExercise(ex._id);
                  setActiveIdx(newIdx);
                }}
                title="Remove exercise"
              >✕ Remove</button>
            </div>
          </div>
          <SetLogger
            sessionExercise={exercises[activeIdx]}
            isLastExercise={activeIdx === exercises.length - 1}
            onExerciseDone={() => {
              if (activeIdx < exercises.length - 1) {
                setActiveIdx(activeIdx + 1);
              } else {
                setPickerOpen(true);
              }
            }}
            onFinishWorkout={() => setConfirmFinish(true)}
          />
        </div>
      )}

      {/* ── Next exercises (collapsed) ── */}
      {exercises.slice(activeIdx + 1).map((ex, i) => (
        <button key={ex._id} className={styles.nextCard} onClick={() => setActiveIdx(activeIdx + 1 + i)}>
          <span className={styles.nextNum}>{activeIdx + 2 + i}</span>
          <span className={styles.nextName}>{ex.exerciseName}</span>
          <span className={styles.nextMuscle}>{ex.muscleGroup}</span>
        </button>
      ))}

      {/* ── Add Exercise button ── */}
      <div className={styles.addWrap}>
        <button className={styles.addExBtn} onClick={() => setPickerOpen(true)}>
          + Add Exercise
        </button>
      </div>

      {pickerOpen && (
        <SmartExercisePicker
          onSelect={(data) => handleAddExercise(data)}
          onClose={() => setPickerOpen(false)}
          routineLabels={session?.workoutTypes || []}
          alreadyAdded={exercises.map(e => e.exerciseId)}
        />
      )}

      {/* ── Finish confirm sheet ── */}
      {confirmFinish && (
        <div className={styles.overlay} onClick={() => { setConfirmFinish(false); setConfirmDiscard(false); }}>
          <div className={styles.confirmSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmHandle} />
            <p className={styles.confirmTitle}>Finish workout?</p>

            {/* Summary */}
            <div className={styles.confirmSummary}>
              <div className={styles.confirmStat}>
                <span className={styles.confirmStatVal}>{exercises.length}</span>
                <span className={styles.confirmStatLabel}>Exercises</span>
              </div>
              <div className={styles.confirmStatDiv} />
              <div className={styles.confirmStat}>
                <span className={styles.confirmStatVal}>{totalSets}</span>
                <span className={styles.confirmStatLabel}>Sets</span>
              </div>
              <div className={styles.confirmStatDiv} />
              <div className={styles.confirmStat}>
                <span className={styles.confirmStatVal}>{elapsed}</span>
                <span className={styles.confirmStatLabel}>Duration</span>
              </div>
            </div>

            <div className={styles.confirmBtns}>
              <button className={styles.finishConfirmBtn} onClick={finishSession} disabled={loading}>
                {loading ? 'Saving…' : '💾  Save Workout'}
              </button>
              <button className={styles.keepGoingBtn} onClick={() => setConfirmFinish(false)}>
                Keep Going
              </button>
              {!confirmDiscard ? (
                <button className={styles.discardBtn} onClick={() => setConfirmDiscard(true)}>
                  Discard Workout
                </button>
              ) : (
                <div className={styles.discardConfirmRow}>
                  <span className={styles.discardWarn}>Sure? This can't be undone.</span>
                  <div className={styles.discardConfirmBtns}>
                    <button className={styles.discardConfirmNo} onClick={() => setConfirmDiscard(false)}>Cancel</button>
                    <button className={styles.discardConfirmYes} onClick={discardSession}>Yes, Discard</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
