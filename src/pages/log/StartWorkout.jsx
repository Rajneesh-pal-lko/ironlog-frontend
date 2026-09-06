import { useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { api } from '../../data/api';
import { MUSCLE_GROUPS, MUSCLE_EMOJI } from '../../data/constants';
import styles from './StartWorkout.module.css';

const COMBO_TYPES = ['Upper Body', 'Lower Body', 'Full Body', 'Push', 'Pull'];

export default function StartWorkout({ onMenuOpen }) {
  const { startSession, loading } = useWorkout();
  const [selected, setSelected] = useState([]);
  const [movementTypes, setMovementTypes] = useState([]);

  useEffect(() => {
    api.movementTypes.getAll().then(setMovementTypes).catch(() => {});
  }, []);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function toggle(type) {
    setSelected(s => s.includes(type) ? s.filter(t => t !== type) : [...s, type]);
  }

  async function handleStart() {
    await startSession(selected);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <span className={styles.logo}>Iron<span>Log</span></span>
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
        <p className={styles.date}>{dateStr}</p>
      </div>

      <div className={styles.body}>
        <p className={styles.sectionLabel}>Muscle Groups</p>
        <div className={styles.grid}>
          {MUSCLE_GROUPS.map(m => (
            <button
              key={m}
              className={`${styles.typeBtn} ${selected.includes(m) ? styles.active : ''}`}
              onClick={() => toggle(m)}
            >
              <span className={styles.typeBtnIcon}>{MUSCLE_EMOJI[m] || '💪'}</span>
              <span>{m}</span>
            </button>
          ))}
        </div>

        <p className={styles.sectionLabel}>Combos</p>
        <div className={styles.chipRow}>
          {COMBO_TYPES.map(c => (
            <button
              key={c}
              className={`${styles.chip} ${selected.includes(c) ? styles.chipActive : ''}`}
              onClick={() => toggle(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {movementTypes.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Movement Types</p>
            <div className={styles.chipRow}>
              {movementTypes.map(m => (
                <button
                  key={m}
                  className={`${styles.chip} ${selected.includes(m) ? styles.chipActive : ''}`}
                  onClick={() => toggle(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Start button */}
      <div className={styles.footer}>
        {selected.length > 0 && (
          <div className={styles.selectedWrap}>
            {selected.map(s => (
              <span key={s} className={styles.selectedTag}>{s}</span>
            ))}
          </div>
        )}
        <button
          className={styles.startBtn}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Starting…' : '🏋️  Start Workout'}
        </button>
      </div>
    </div>
  );
}
