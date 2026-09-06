import { useState, useEffect } from 'react';
import { api } from '../../data/api';
import styles from './ExercisePicker.module.css';
import { MUSCLE_GROUPS, MUSCLE_EMOJI } from '../../data/constants';

const TABS = ['All', 'Muscle', 'Movement'];

export default function ExercisePicker({ onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [filter, setFilter] = useState(null);
  const [movementTypes, setMovementTypes] = useState([]);

  useEffect(() => {
    api.exercises.getAll().then(data => setExercises(data.filter(e => e.active)));
    api.movementTypes.getAll().then(setMovementTypes).catch(() => {});
  }, []);

  const filtered = exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (tab === 'Muscle' && filter) return e.muscleGroup === filter;
    if (tab === 'Movement' && filter) return (e.movementTypes || []).includes(filter);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  function handleSelect(ex) {
    const isBodyweight = ex.equipment === 'Bodyweight' && !ex.unilateral;
    // Timed: Plank, Side Plank, hollow holds, cardio machines etc.
    const TIMED_KEYWORDS = ['plank', 'hold', 'carry', 'run', 'bike', 'row', 'treadmill', 'elliptical', 'stairmaster', 'sprint', 'walk'];
    const isTimed = TIMED_KEYWORDS.some(k => ex.name.toLowerCase().includes(k));
    onSelect({
      exerciseId: ex._id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      unilateral: ex.unilateral || false,
      isBodyweight,
      isTimed,
    });
    onClose();
  }

  const filterOptions = tab === 'Muscle' ? MUSCLE_GROUPS : movementTypes;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>Add Exercise</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tabBtn} ${tab === t ? styles.active : ''}`}
              onClick={() => { setTab(t); setFilter(null); }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        {tab !== 'All' && filterOptions.length > 0 && (
          <div className={styles.chips}>
            {filterOptions.map(opt => (
              <button
                key={opt}
                className={`${styles.chip} ${filter === opt ? styles.chipActive : ''}`}
                onClick={() => setFilter(f => f === opt ? null : opt)}
              >
                {tab === 'Muscle' && MUSCLE_EMOJI[opt] ? `${MUSCLE_EMOJI[opt]} ` : ''}{opt}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className={styles.list}>
          {filtered.length === 0 && (
            <div className={styles.empty}>No exercises found</div>
          )}
          {filtered.map(ex => (
            <button key={ex._id} className={styles.item} onClick={() => handleSelect(ex)}>
              <span className={styles.itemIcon}>{MUSCLE_EMOJI[ex.muscleGroup] || '🏋️'}</span>
              <span className={styles.itemInfo}>
                <span className={styles.itemName}>
                  {ex.favourite && <span style={{color:'#ff4d6d',marginRight:4}}>♥</span>}
                  {ex.name}
                </span>
                <span className={styles.itemSub}>{ex.muscleGroup}{ex.equipment ? ` · ${ex.equipment}` : ''}{ex.unilateral ? ' · Unilateral' : ''}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
