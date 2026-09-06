import { useState, useEffect } from 'react';
import { api } from '../data/api';
import { MUSCLE_GROUPS, MUSCLE_EMOJI } from '../data/constants';
import styles from './Progress.module.css';

const VIEWS = ['Calendar', 'By Exercise', 'By Muscle'];

export default function Progress({ onMenuOpen }) {
  const [view, setView] = useState('Calendar');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.logo}>Iron<span>Log</span></h1>
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
        <div className={styles.viewTabs}>
          {VIEWS.map(v => (
            <button
              key={v}
              className={`${styles.viewTab} ${view === v ? styles.viewTabActive : ''}`}
              onClick={() => setView(v)}
            >{v}</button>
          ))}
        </div>
      </div>

      {view === 'Calendar'    && <CalendarView />}
      {view === 'By Exercise' && <ByExerciseView />}
      {view === 'By Muscle'   && <ByMuscleView />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALENDAR VIEW — month grid with workout dots, tap date to see
───────────────────────────────────────────────────────────── */
function CalendarView() {
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [daySession, setDaySession] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    api.progress.calendar(3).then(setCalendarDays).catch(() => {});
  }, []);

  const workoutDates = new Set(calendarDays.map(d => d.date));
  const workoutMap = Object.fromEntries(calendarDays.map(d => [d.date, d]));

  async function handleSelectDate(dateStr) {
    setSelectedDate(dateStr);
    setLoadingDay(true);
    try {
      const sessions = await api.progress.byDate(dateStr);
      setDaySession(sessions);
    } catch { setDaySession([]); }
    finally { setLoadingDay(false); }
  }

  // Build calendar grid for currentMonth
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(dateStr);
  }

  return (
    <div className={styles.section}>
      {/* Month nav */}
      <div className={styles.monthNav}>
        <button className={styles.monthBtn} onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>‹</button>
        <span className={styles.monthLabel}>
          {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
        <button className={styles.monthBtn} onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div className={styles.calGrid}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className={styles.calDayLabel}>{d}</div>
        ))}
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`e${i}`} />;
          const hasWorkout = workoutDates.has(dateStr);
          const isToday    = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const info       = workoutMap[dateStr];
          return (
            <button
              key={dateStr}
              className={`${styles.calDay}
                ${hasWorkout ? styles.calDayWorkout : ''}
                ${isToday    ? styles.calDayToday   : ''}
                ${isSelected ? styles.calDaySelected: ''}`}
              onClick={() => handleSelectDate(dateStr)}
            >
              <span className={styles.calDayNum}>{new Date(dateStr + 'T12:00:00').getDate()}</span>
              {hasWorkout && <span className={styles.calDot} />}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className={styles.dayDetail}>
          <div className={styles.dayDetailHeader}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {loadingDay ? (
            <p className={styles.dimText}>Loading…</p>
          ) : daySession.length === 0 ? (
            <p className={styles.dimText}>No workout logged on this day.</p>
          ) : daySession.map(s => (
            <div key={s._id} className={styles.sessionCard}>
              <div className={styles.sessionMeta}>
                {s.workoutTypes?.length > 0 && (
                  <div className={styles.sessionTypes}>
                    {s.workoutTypes.map(t => <span key={t} className={styles.typeTag}>{t}</span>)}
                  </div>
                )}
                <span className={styles.sessionStats}>
                  {s.exercises?.length || 0} exercises · {s.exercises?.reduce((a, ex) => a + (ex.sets?.length || 0), 0)} sets
                  {s.startTime && s.endTime && ` · ${Math.round((new Date(s.endTime) - new Date(s.startTime)) / 60000)} min`}
                </span>
              </div>
              {(s.exercises || []).map(ex => (
                <div key={ex._id} className={styles.exRow}>
                  <span className={styles.exName}>{ex.exerciseName}</span>
                  <span className={styles.exSets}>
                    {(ex.sets || []).map((set, i) => (
                      <span key={i} className={styles.setChip}>
                        {ex.isTimed ? `${set.duration}s`
                          : ex.isBodyweight ? `${set.reps}reps`
                          : `${set.weight}×${set.reps}`}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BY EXERCISE VIEW — browsable list with muscle filters + search
───────────────────────────────────────────────────────────── */
function ByExerciseView() {
  const [exercises, setExercises]   = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch]         = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selected, setSelected]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [limit, setLimit]           = useState(10);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    api.progress.exercisesDone()
      .then(data => setExercises(data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  // Distinct muscle groups from exercises actually done
  const muscles = ['All', ...Array.from(new Set(exercises.map(e => e.muscleGroup).filter(Boolean))).sort()];

  const filteredEx = exercises.filter(e => {
    if (muscleFilter !== 'All' && e.muscleGroup !== muscleFilter) return false;
    if (search) return e.name.toLowerCase().includes(search.toLowerCase());
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  async function handleSelect(ex) {
    // Toggle off if tapping the same one
    if (selected?._id === ex._id) { setSelected(null); setHistory([]); return; }
    setSelected(ex);
    setLoadingHistory(true);
    try {
      const data = await api.progress.byExercise(ex._id, limit);
      setHistory(data);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  }

  async function changeLimit(newLimit) {
    setLimit(newLimit);
    if (!selected) return;
    setLoadingHistory(true);
    try {
      const data = await api.progress.byExercise(selected._id, newLimit);
      setHistory(data);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  }

  // Best set across all history for selected exercise
  const bestSetEntry = history.reduce((b, h) => {
    const val = h.bestSet?.val || 0;
    return val > (b?.bestSet?.val || 0) ? h : b;
  }, null);

  return (
    <div className={styles.section}>

      {/* ── Search bar ── */}
      <div className={styles.searchWrap} style={{ marginBottom: 10 }}>
        <input
          className={styles.searchInput}
          placeholder="Search exercises you've done…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Muscle filter chips ── */}
      <div className={styles.exFilterChips}>
        {muscles.map(m => (
          <button
            key={m}
            className={`${styles.exFilterChip} ${muscleFilter === m ? styles.exFilterChipActive : ''}`}
            onClick={() => { setMuscleFilter(m); setSelected(null); setHistory([]); }}
          >
            {m === 'All' ? 'All' : `${MUSCLE_EMOJI[m] || ''} ${m}`}
          </button>
        ))}
      </div>

      {/* ── Exercise list or empty state ── */}
      {loadingList ? (
        <p className={styles.dimText}>Loading…</p>
      ) : filteredEx.length === 0 ? (
        <div className={styles.emptyHint}>
          <div className={styles.emptyIcon}>📊</div>
          <p>{exercises.length === 0
            ? 'No workout history yet. Log a session to see exercise progress here.'
            : `No ${muscleFilter !== 'All' ? muscleFilter + ' ' : ''}exercises match your search.`}
          </p>
        </div>
      ) : (
        <div className={styles.exList}>
          {filteredEx.map(ex => (
            <div key={ex._id}>
              {/* Exercise row */}
              <button
                className={`${styles.exListItem} ${selected?._id === ex._id ? styles.exListItemActive : ''}`}
                onClick={() => handleSelect(ex)}
              >
                <span className={styles.exListIcon}>{MUSCLE_EMOJI[ex.muscleGroup] || '💪'}</span>
                <span className={styles.exListInfo}>
                  <span className={styles.exListName}>{ex.name}</span>
                  <span className={styles.exListMuscle}>{ex.muscleGroup}</span>
                </span>
                <span className={styles.exListChevron}>
                  {selected?._id === ex._id ? '▲' : '▶'}
                </span>
              </button>

              {/* Inline history panel — expands below the row */}
              {selected?._id === ex._id && (
                <div className={styles.exHistoryPanel}>
                  {/* Limit tabs */}
                  <div className={styles.exHistoryPanelHeader}>
                    <span className={styles.exHistoryPanelTitle}>History</span>
                    <div className={styles.limitTabs}>
                      {[3, 10, 0].map(l => (
                        <button
                          key={l}
                          className={`${styles.limitTab} ${limit === l ? styles.limitTabActive : ''}`}
                          onClick={e => { e.stopPropagation(); changeLimit(l); }}
                        >{l === 0 ? 'All' : `Last ${l}`}</button>
                      ))}
                    </div>
                  </div>

                  {loadingHistory ? (
                    <p className={styles.dimText}>Loading…</p>
                  ) : history.length === 0 ? (
                    <p className={styles.dimText}>No sessions found.</p>
                  ) : (
                    <>
                      {/* Best set PR card */}
                      {bestSetEntry?.bestSet && bestSetEntry.bestSet.weight > 0 && (
                        <div className={styles.prCard}>
                          <span className={styles.prLabel}>🏆 Best Set</span>
                          <span className={styles.prVal}>
                            {bestSetEntry.bestSet.weight}kg × {bestSetEntry.bestSet.reps} reps
                          </span>
                          <span className={styles.prDate}>
                            {new Date(bestSetEntry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}

                      {/* Session cards */}
                      {history.map((h, i) => (
                        <div key={h._id || i} className={styles.historyCard}>
                          <div className={styles.historyCardHeader}>
                            <span className={styles.historyCardDate}>
                              {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className={styles.historyCardVol}>
                              {h.totalVolume > 0 ? `Vol: ${h.totalVolume}kg` : `${h.sets?.length || 0} sets`}
                            </span>
                          </div>
                          <div className={styles.historyCardSets}>
                            {(h.sets || []).map((s, j) => (
                              <span key={j} className={styles.setChip}>
                                <span className={styles.setChipNum}>{j + 1}</span>
                                {s.weight > 0 ? `${s.weight}kg × ${s.reps}` : `${s.reps} reps`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BY MUSCLE VIEW — pick muscle group, see all sessions for it
───────────────────────────────────────────────────────────── */
function ByMuscleView() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [sessions, setSessions]             = useState([]);
  const [loading, setLoading]               = useState(false);

  async function handleSelect(muscle) {
    setSelectedMuscle(muscle);
    setLoading(true);
    try {
      const data = await api.progress.byMuscle(muscle);
      setSessions(data);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.section}>
      {/* Muscle group grid */}
      <div className={styles.muscleGrid}>
        {MUSCLE_GROUPS.map(m => (
          <button
            key={m}
            className={`${styles.muscleBtn} ${selectedMuscle === m ? styles.muscleBtnActive : ''}`}
            onClick={() => handleSelect(m)}
          >
            <span className={styles.muscleBtnIcon}>{MUSCLE_EMOJI[m] || '💪'}</span>
            <span className={styles.muscleBtnLabel}>{m}</span>
          </button>
        ))}
      </div>

      {selectedMuscle && (
        <div className={styles.muscleResults}>
          <div className={styles.muscleResultsHeader}>
            {MUSCLE_EMOJI[selectedMuscle]} {selectedMuscle}
            <span className={styles.dimText}> — {sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <p className={styles.dimText}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p className={styles.dimText}>No {selectedMuscle} sessions logged yet.</p>
          ) : sessions.map(s => (
            <div key={s._id} className={styles.sessionCard}>
              <div className={styles.sessionCardDate}>
                {new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className={styles.sessionMeta}>
                {s.workoutTypes?.length > 0 && (
                  <div className={styles.sessionTypes}>
                    {s.workoutTypes.map(t => <span key={t} className={styles.typeTag}>{t}</span>)}
                  </div>
                )}
              </div>
              {(s.exercises || [])
                .filter(ex => ex.muscleGroup === selectedMuscle)
                .map(ex => (
                  <div key={ex._id} className={styles.exRow}>
                    <span className={styles.exName}>{ex.exerciseName}</span>
                    <span className={styles.exSets}>
                      {(ex.sets || []).map((set, i) => (
                        <span key={i} className={styles.setChip}>
                          {ex.isTimed ? `${set.duration}s`
                            : ex.isBodyweight ? `${set.reps}reps`
                            : `${set.weight}×${set.reps}`}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
