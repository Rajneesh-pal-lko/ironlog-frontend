import { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { api } from '../../data/api';
import RestTimer from './RestTimer';
import styles from './SetLogger.module.css';

const DEFAULT_REST = 90;

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

export default function SetLogger({ sessionExercise, onExerciseDone }) {
  const { addSet, deleteSet, updateSet } = useWorkout();
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState(0); // 0 = most recent
  const [historyLimit, setHistoryLimit] = useState(1); // 1 or 3
  const [activeRestSetId, setActiveRestSetId] = useState(null);
  const [unit, setUnit] = useState(() => localStorage.getItem('ironlog_unit') || 'kg');

  const ex = sessionExercise;
  const sets = ex.sets || [];
  const mode = getMode(ex);

  useEffect(() => {
    api.workouts.getHistory(ex.exerciseId).then(data => {
      setHistory(data || []);
      setHistoryTab(0);
    }).catch(() => {});
  }, [ex.exerciseId]);

  async function handleAddSet() {
    const prev = sets[sets.length - 1];
    let newSet = { unit, restSeconds: DEFAULT_REST };
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

  const shownHistory = history.slice(0, historyLimit);
  const historyTabLabels = shownHistory.map((h, i) =>
    new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  );

  // Column headers
  const headers = {
    weighted:   ['#', unit, 'Reps', '✓', ''],
    bodyweight: ['#', 'Reps', '✓', ''],
    timed:      ['#', 'Secs', '✓', ''],
    unilateral: ['#', `L${unit}`, 'Lreps', `R${unit}`, 'Rreps', '✓', ''],
  }[mode];

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

      {/* ── History ── */}
      <div className={styles.historySection}>
        <div className={styles.historyToggleRow}>
          <button className={styles.historyToggle} onClick={() => setHistoryOpen(o => !o)}>
            <span className={styles.historyToggleLabel}>📅 Previous sessions
              {history.length > 0 && <span className={styles.historyCount}> {Math.min(history.length, 3)}</span>}
            </span>
            <span className={styles.historyToggleIcon}>{historyOpen ? '▲' : '▼'}</span>
          </button>
          {history.length > 1 && historyOpen && (
            <div className={styles.historyLimitBtns}>
              {[1, 3].map(n => (
                <button
                  key={n}
                  className={`${styles.historyLimitBtn} ${historyLimit === n ? styles.historyLimitActive : ''}`}
                  onClick={() => { setHistoryLimit(n); setHistoryTab(0); }}
                >{n}</button>
              ))}
            </div>
          )}
        </div>

        {historyOpen && (
          <div className={styles.historyBody}>
            {history.length === 0 ? (
              <p className={styles.historyEmpty}>No previous sessions for this exercise yet.</p>
            ) : (
              <>
                {/* Session tabs — shown when historyLimit > 1 or multiple sessions */}
                {shownHistory.length > 1 && (
                  <div className={styles.historyTabs}>
                    {historyTabLabels.map((label, i) => (
                      <button
                        key={i}
                        className={`${styles.historyTabBtn} ${historyTab === i ? styles.historyTabActive : ''}`}
                        onClick={() => setHistoryTab(i)}
                      >
                        {i === 0 ? 'Last' : label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected session's sets */}
                {(() => {
                  const h = shownHistory[historyTab] || shownHistory[0];
                  if (!h) return null;
                  return (
                    <div className={styles.historySession}>
                      <div className={styles.historySessionHeader}>
                        <span className={styles.historyDate}>
                          {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={styles.historySetCount}>{h.sets?.length || 0} sets</span>
                      </div>
                      <div className={styles.historySets}>
                        {(h.sets || []).map((s, j) => (
                          <span key={j} className={styles.historySet}>
                            <span className={styles.historySetNum}>{j + 1}</span>
                            {formatHistorySet(s, mode)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>

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
          seconds={DEFAULT_REST}
          onDismiss={() => setActiveRestSetId(null)}
        />
      )}

      {/* ── Add set ── */}
      <button className={styles.addSetBtn} onClick={handleAddSet}>+ Add Set</button>

      {/* ── Exercise done button ── */}
      {sets.length > 0 && onExerciseDone && (
        <button
          className={`${styles.exerciseDoneBtn} ${allConfirmed ? styles.exerciseDoneBtnReady : ''}`}
          onClick={onExerciseDone}
        >
          {allConfirmed ? '✓ Exercise Done — Next' : 'Next Exercise →'}
        </button>
      )}
    </div>
  );
}

/* ── Set Row ── */
function SetRow({ set, index, mode, unit, onDelete, onUpdate, onDone }) {
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
  const saveTimer = useRef(null);

  function change(field, raw) {
    if (confirmed) return; // locked — must untick first
    const val = raw === '' ? '' : Number(raw);
    const next = { ...vals, [field]: val };
    setVals(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(next), 600);
  }

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
    <div className={`${styles.setRow} ${confirmed ? styles.setRowDone : ''}`}
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

      <button className={styles.delBtn} onClick={onDelete}>✕</button>
    </div>
  );
}
