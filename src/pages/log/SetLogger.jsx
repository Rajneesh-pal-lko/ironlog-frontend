import { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { api } from '../../data/api';
import RestTimer, { getDefaultRest } from './RestTimer';
import styles from './SetLogger.module.css';

function getMode(ex) {
  if (ex.isTimed)      return 'timed';
  if (ex.isBodyweight) return 'bodyweight';
  if (ex.unilateral)   return 'unilateral';
  return 'weighted';
}

function gridCols(mode) {
  if (mode === 'unilateral') return '28px 1fr 1fr 1fr 1fr 32px 28px';
  if (mode === 'bodyweight') return '28px 1fr 32px 28px';
  if (mode === 'timed')      return '28px 1fr 32px 28px';
  return '28px 1fr 1fr 32px 28px'; // weighted
}

function formatHistorySet(s, mode) {
  if (mode === 'unilateral') return `L${s.leftWeight}×${s.leftReps} R${s.rightWeight}×${s.rightReps}`;
  if (mode === 'timed')      return `${s.duration ?? 0}s`;
  if (mode === 'bodyweight') return `${s.reps ?? 0} reps`;
  return `${s.weight ?? 0}${s.unit || 'kg'} × ${s.reps ?? 0}`;
}

export default function SetLogger({ sessionExercise, onExerciseDone, isLastExercise, onFinishWorkout }) {
  const { addSet, deleteSet, updateSet } = useWorkout();
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState(0); // 0 = most recent
  const [historyLimit, setHistoryLimit] = useState(1); // 1 or 3
  const [activeRestSetId, setActiveRestSetId] = useState(null);
  const [unit, setUnit] = useState(() => localStorage.getItem('ironlog_unit') || 'kg');
  const [prBest, setPrBest] = useState(null); // { weight, reps, volume }

  const ex = sessionExercise;
  const sets = ex.sets || [];
  const mode = getMode(ex);
  const didAutoPopulate = useRef(false);

  useEffect(() => {
    didAutoPopulate.current = false; // reset when exercise changes
  }, [ex.exerciseId]);

  useEffect(() => {
    api.workouts.getPR(ex.exerciseId).then(setPrBest).catch(() => {});
    api.workouts.getHistory(ex.exerciseId).then(data => {
      const hist = data || [];
      setHistory(hist);
      setHistoryTab(0);

      // Auto-populate sets from last session — only once, only if no sets yet
      const lastSets = hist[0]?.sets;
      if (lastSets && lastSets.length > 0 && ex.sets?.length === 0 && !didAutoPopulate.current) {
        didAutoPopulate.current = true;
        (async () => {
          for (const s of lastSets) {
            let newSet = { unit, restSeconds: getDefaultRest() };
            if (mode === 'weighted')   { newSet.weight = s.weight ?? 0; newSet.reps = s.reps ?? 0; }
            if (mode === 'bodyweight') { newSet.weight = 0; newSet.reps = s.reps ?? 0; }
            if (mode === 'timed')      { newSet.duration = s.duration ?? 30; newSet.reps = 1; }
            if (mode === 'unilateral') {
              newSet.leftWeight  = s.leftWeight  ?? 0; newSet.leftReps  = s.leftReps  ?? 0;
              newSet.rightWeight = s.rightWeight ?? 0; newSet.rightReps = s.rightReps ?? 0;
            }
            await addSet(ex._id, newSet);
          }
        })();
      }
    }).catch(() => {});
  }, [ex.exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddSet() {
    const prev = sets[sets.length - 1];
    let newSet = { unit, restSeconds: getDefaultRest() };
    if (mode === 'weighted')    { newSet.weight = prev?.weight ?? 0; newSet.reps = prev?.reps ?? 0; }
    if (mode === 'bodyweight')  { newSet.weight = 0; newSet.reps = prev?.reps ?? 0; }
    if (mode === 'timed')       { newSet.duration = prev?.duration ?? 30; newSet.reps = 1; }
    if (mode === 'unilateral')  {
      newSet.leftWeight  = prev?.leftWeight  ?? 0;
      newSet.leftReps    = prev?.leftReps    ?? 0;
      newSet.rightWeight = prev?.rightWeight ?? 0;
      newSet.rightReps   = prev?.rightReps   ?? 0;
    }
    await addSet(ex._id, newSet);
  }

  function handleUnitToggle() {
    const next = unit === 'kg' ? 'lbs' : 'kg';
    setUnit(next);
    localStorage.setItem('ironlog_unit', next);
  }

  function handleSetDone(setId) {
    setActiveRestSetId(setId);
  }

  const confirmedCount = sets.filter(s => s._confirmed).length;
  const allConfirmed = sets.length > 0 && confirmedCount === sets.length;

  // Column headers
  const headers = {
    weighted:   ['#', unit, 'Reps', '✓', ''],
    bodyweight: ['#', 'Reps', '✓', ''],
    timed:      ['#', 'Secs', '✓', ''],
    unilateral: ['#', `L${unit}`, 'Lreps', `R${unit}`, 'Rreps', '✓', ''],
  }[mode];

  const lastSession = history[0] || null;
  const olderSessions = history.slice(1, 3);

  return (
    <div className={styles.wrap}>

      {/* ── Exercise header ── */}
      <div className={styles.exHeader}>
        <div className={styles.exInfo}>
          <span className={styles.exName}>{ex.exerciseName}</span>
          <span className={styles.exMuscle}>
            {ex.muscleGroup}
            {ex.isBodyweight && <span className={styles.modeBadge}> · Bodyweight</span>}
            {ex.isTimed      && <span className={styles.modeBadge}> · Timed</span>}
            {ex.unilateral   && <span className={styles.modeBadge}> · Unilateral</span>}
          </span>
        </div>
        {(mode === 'weighted' || mode === 'unilateral') && (
          <button className={styles.unitToggle} onClick={handleUnitToggle}>{unit}</button>
        )}
      </div>

      {/* ── Last session — always visible ── */}
      {lastSession ? (
        <div className={styles.lastSession}>
          <div className={styles.lastSessionHeader}>
            <span className={styles.lastSessionLabel}>Last time</span>
            <span className={styles.lastSessionDate}>
              {new Date(lastSession.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className={styles.lastSessionSets}>
            {(lastSession.sets || []).map((s, j) => (
              <span key={j} className={styles.historySet}>
                <span className={styles.historySetNum}>{j + 1}</span>
                {formatHistorySet(s, mode)}
              </span>
            ))}
          </div>
          {/* Older sessions collapsible */}
          {olderSessions.length > 0 && (
            <div className={styles.olderWrap}>
              <button className={styles.olderToggle} onClick={() => setHistoryOpen(o => !o)}>
                {historyOpen ? '▲ Hide older sessions' : `▼ Show ${olderSessions.length} older session${olderSessions.length > 1 ? 's' : ''}`}
              </button>
              {historyOpen && olderSessions.map((h, i) => (
                <div key={i} className={styles.olderSession}>
                  <span className={styles.olderDate}>
                    {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className={styles.lastSessionSets}>
                    {(h.sets || []).map((s, j) => (
                      <span key={j} className={styles.historySet}>
                        <span className={styles.historySetNum}>{j + 1}</span>
                        {formatHistorySet(s, mode)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noHistory}>First time doing this — crush it! 💪</div>
      )}

      {/* ── Sets table ── */}
      <div className={styles.setsWrap}>
        <div className={styles.setHeaderRow} style={{ gridTemplateColumns: gridCols(mode) }}>
          {headers.map((h, i) => (
            <span key={i} className={styles.setCol}>{h}</span>
          ))}
        </div>

        {sets.length === 0 && (
          <p className={styles.noSets}>Tap <strong>Add Set</strong> to log your first set.</p>
        )}

        {sets.map((s, i) => (
          <SetRow
            key={s._id || i}
            set={s}
            index={i}
            mode={mode}
            unit={unit}
            prBest={prBest}
            onDelete={() => deleteSet(ex._id, s._id)}
            onUpdate={data => updateSet(ex._id, s._id, data)}
            onDone={() => handleSetDone(s._id)}
          />
        ))}
      </div>

      {/* ── Rest timer (shows after ticking a set done) ── */}
      {activeRestSetId && (
        <RestTimer
          key={activeRestSetId}
          seconds={getDefaultRest()}
          onDismiss={() => setActiveRestSetId(null)}
        />
      )}

      {/* ── Add set ── */}
      <button className={styles.addSetBtn} onClick={handleAddSet}>+ Add Set</button>

      {/* ── Navigation / finish buttons ── */}
      {sets.length > 0 && (
        <div className={styles.exerciseBtnsRow}>
          {/* Always show Next (unless last exercise) */}
          {!isLastExercise && onExerciseDone && (
            <button
              className={`${styles.exerciseDoneBtn} ${allConfirmed ? styles.exerciseDoneBtnReady : ''}`}
              onClick={onExerciseDone}
            >
              {allConfirmed ? '✓ Done — Next Exercise' : 'Next Exercise →'}
            </button>
          )}
          {/* On last exercise: Add Another + Finish Workout */}
          {isLastExercise && (
            <>
              {onExerciseDone && (
                <button
                  className={styles.addAnotherBtn}
                  onClick={onExerciseDone}
                >
                  + Add Exercise
                </button>
              )}
              {onFinishWorkout && (
                <button
                  className={`${styles.finishWorkoutBtn} ${allConfirmed ? styles.finishWorkoutBtnReady : ''}`}
                  onClick={onFinishWorkout}
                >
                  {allConfirmed ? '🏁 Finish Workout' : 'Finish Workout'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Set Row ── */
function SetRow({ set, index, mode, unit, prBest, onDelete, onUpdate, onDone }) {
  const [vals, setVals] = useState({
    weight:      set.weight      ?? 0,
    reps:        set.reps        ?? 0,
    duration:    set.duration    ?? 30,
    leftWeight:  set.leftWeight  ?? 0,
    leftReps:    set.leftReps    ?? 0,
    rightWeight: set.rightWeight ?? 0,
    rightReps:   set.rightReps   ?? 0,
  });
  const [confirmed, setConfirmed] = useState(set._confirmed || false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimer = useRef(null);
  const saveTimer = useRef(null);

  function handleDeleteTap() {
    if (deleteArmed) {
      clearTimeout(deleteTimer.current);
      onDelete();
    } else {
      setDeleteArmed(true);
      deleteTimer.current = setTimeout(() => setDeleteArmed(false), 2000);
    }
  }

  function change(field, raw) {
    if (confirmed) return; // locked — must untick first
    const val = raw === '' ? '' : Number(raw);
    const next = { ...vals, [field]: val };
    setVals(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(next), 600);
  }

  // Is this set a new PR?
  const isPR = confirmed && mode === 'weighted' && prBest
    && vals.weight > 0 && vals.reps > 0
    && (vals.weight * vals.reps) > (prBest.volume || 0);

  function toggleConfirm() {
    const next = !confirmed;
    setConfirmed(next);
    onUpdate({ ...vals, _confirmed: next });
    if (next) onDone(); // trigger rest timer
  }

  const inp = (field, placeholder = '0') => ({
    className: `${styles.setInput} ${confirmed ? styles.setInputLocked : ''}`,
    type: 'number',
    inputMode: 'decimal',
    min: 0,
    value: vals[field] === 0 ? '' : vals[field],
    placeholder,
    readOnly: confirmed,
    onChange: e => change(field, e.target.value),
  });

  return (
    <>
      <div className={`${styles.setRow} ${confirmed ? styles.setRowDone : ''} ${isPR ? styles.setRowPR : ''}`}
           style={{ gridTemplateColumns: gridCols(mode) }}>
        <span className={styles.setNum}>{index + 1}</span>

        {mode === 'weighted'   && <><input {...inp('weight')} /><input {...inp('reps')} /></>}
        {mode === 'bodyweight' && <input {...inp('reps')} />}
        {mode === 'timed'      && <input {...inp('duration', '30')} />}
        {mode === 'unilateral' && (
          <>
            <input {...inp('leftWeight')} />
            <input {...inp('leftReps')} />
            <input {...inp('rightWeight')} />
            <input {...inp('rightReps')} />
          </>
        )}

        <button
          className={`${styles.doneTickBtn} ${confirmed ? styles.doneTickConfirmed : ''}`}
          onClick={toggleConfirm}
          title={confirmed ? 'Tap to edit' : 'Mark set done'}
        >
          {confirmed ? '✓' : '○'}
        </button>

        <button
          className={`${styles.delBtn} ${deleteArmed ? styles.delBtnArmed : ''}`}
          onClick={handleDeleteTap}
          title={deleteArmed ? 'Tap again to delete' : 'Delete set'}
        >{deleteArmed ? '?' : '✕'}</button>
      </div>
      {isPR && (
        <div className={styles.prBadge}>🏆 New PR!</div>
      )}
    </>
  );
}
