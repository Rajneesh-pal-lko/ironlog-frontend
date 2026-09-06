import { useState, useEffect } from 'react';
import { MUSCLE_GROUPS, MUSCLE_EMOJI, MOVEMENT_TYPES } from '../data/constants';
import { api } from '../data/api';
import { useToast } from '../components/Toast';
import ExerciseForm from './ExerciseForm';
import { STARTER_EXERCISES } from '../data/starterExercises';
import styles from './Exercises.module.css';

export default function Exercises({ onMenuOpen }) {
  const [exercises, setExercises]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showMine, setShowMine]         = useState(true); // true = My Exercises (hearted only)
  const [filter, setFilter] = useState('All'); // 'All' | muscle group | movement type
  const [query, setQuery]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [detailEx, setDetailEx]         = useState(null);
  const [seeding, setSeeding]           = useState(false);
  const showToast = useToast();

  const load = async () => {
    try {
      const data = await api.exercises.getAll();
      setExercises(data);
    } catch {
      showToast('Failed to load exercises', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Optimistic heart toggle
  async function handleToggleFavourite(e, ex) {
    e.stopPropagation();
    e.preventDefault();
    setExercises(prev => prev.map(x =>
      x._id === ex._id ? { ...x, favourite: !x.favourite } : x
    ));
    try {
      await api.exercises.toggleFavourite(ex._id);
    } catch {
      setExercises(prev => prev.map(x => x._id === ex._id ? ex : x));
      showToast('Failed to update', 'error');
    }
  }

  async function handleDelete(ex) {
    if (!window.confirm(`Delete "${ex.name}"? This cannot be undone.`)) return;
    try {
      await api.exercises.delete(ex._id);
      await load();
      setDetailEx(null);
      showToast(`"${ex.name}" deleted`);
    } catch {
      showToast('Failed to delete exercise', 'error');
    }
  }

  function handleEdit(ex) {
    setEditExercise(ex);
    setDetailEx(null);
    setShowForm(true);
  }

  async function handleSeedExercises() {
    setSeeding(true);
    let added = 0, failed = 0;
    for (const ex of STARTER_EXERCISES) {
      try {
        await api.exercises.create({ ...ex, active: false, favourite: false });
        added++;
      } catch { failed++; }
    }
    await load();
    setSeeding(false);
    showToast(`Added ${added} exercises! Tap ♥ to add to My Exercises.`, 'success');
    setShowMine(false); // show all so user can pick
  }

  async function handleFormClose(saved) {
    setShowForm(false);
    setEditExercise(null);
    if (saved) {
      await load();
      showToast(editExercise ? 'Exercise updated' : 'Exercise added ✓', 'success');
    }
  }

  // Filtering logic — My Exercises = hearted only
  const isMovementFilter = MOVEMENT_TYPES.includes(filter);
  const filtered = exercises.filter(e => {
    if (showMine && !e.favourite) return false;
    if (filter !== 'All') {
      if (isMovementFilter) {
        if (e.movementType !== filter) return false;
      } else {
        if (e.muscleGroup !== filter) return false;
      }
    }
    if (query) {
      const q = query.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        (e.muscleGroup || '').toLowerCase().includes(q) ||
        (e.subCategory || '').toLowerCase().includes(q) ||
        (e.equipment || '').toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const myCount = exercises.filter(e => e.favourite).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.logo}>Iron<span>Log</span></h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.menuBtn} onClick={onMenuOpen}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* My Exercises / All toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${showMine ? styles.viewBtnActive : ''}`}
            onClick={() => setShowMine(true)}
          >
            ♥ My Exercises{myCount > 0 ? ` (${myCount})` : ''}
          </button>
          <button
            className={`${styles.viewBtn} ${!showMine ? styles.viewBtnActive : ''}`}
            onClick={() => setShowMine(false)}
          >
            All Exercises
          </button>
        </div>

        <div className={styles.searchWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search exercises…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter chips — muscle groups + movement types */}
      <div className={styles.chips}>
        <button
          className={`${styles.chip} ${filter === 'All' ? styles.active : ''}`}
          onClick={() => setFilter('All')}
        >All</button>

        {/* Muscle groups */}
        {MUSCLE_GROUPS.map(g => (
          <button
            key={g}
            className={`${styles.chip} ${filter === g ? styles.active : ''}`}
            onClick={() => setFilter(g)}
          >{g}</button>
        ))}

        {/* Divider */}
        <span className={styles.chipDivider}>|</span>

        {/* Movement types */}
        {MOVEMENT_TYPES.map(m => (
          <button
            key={m}
            className={`${styles.chip} ${styles.chipMove} ${filter === m ? styles.active : ''}`}
            onClick={() => setFilter(m)}
          >{m}</button>
        ))}
      </div>

      {/* Count label */}
      <div className={styles.label}>
        {loading ? 'Loading…'
          : query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
          : filter !== 'All' ? `${filter} · ${filtered.length}`
          : showMine ? `${filtered.length} saved exercise${filtered.length !== 1 ? 's' : ''}`
          : `${filtered.length} exercise${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p>Loading…</p></div>
        ) : exercises.length === 0 && !query ? (
          /* Seed banner */
          <div className={styles.seedBanner}>
            <div className={styles.seedIcon}>🏋️</div>
            <p className={styles.seedTitle}>Your library is empty</p>
            <p className={styles.seedSub}>Load {STARTER_EXERCISES.length} exercises covering every muscle group. Then ♥ heart the ones you actually do — those become your personal list.</p>
            <button className={styles.seedBtn} onClick={handleSeedExercises} disabled={seeding}>
              {seeding ? 'Adding exercises…' : `Load ${STARTER_EXERCISES.length} Starter Exercises`}
            </button>
            <p className={styles.seedOr}>or tap <strong>+</strong> to add manually</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>{showMine ? '♥' : '🔍'}</div>
            <p>
              {showMine
                ? muscleFilter !== 'All'
                  ? `No ${muscleFilter} exercises in My Exercises yet. Tap ♥ on any exercise to add it.`
                  : 'No exercises yet. Switch to All Exercises and tap ♥ to add some.'
                : query ? `No results for "${query}"` : `No exercises in ${muscleFilter}.`}
            </p>
          </div>
        ) : (
          filtered.map(ex => (
            <div
              key={ex._id}
              className={styles.card}
              onClick={() => setDetailEx(ex)}
            >
              <div className={styles.icon}>{MUSCLE_EMOJI[ex.muscleGroup] || '💪'}</div>
              <div className={styles.info}>
                <div className={styles.name}>{ex.name}</div>
                <div className={styles.tags}>
                  {ex.muscleGroup  && <span className={`${styles.tag} ${styles.muscle}`}>{ex.muscleGroup}</span>}
                  {ex.subCategory  && <span className={`${styles.tag} ${styles.sub}`}>{ex.subCategory}</span>}
                  {ex.equipment    && <span className={`${styles.tag} ${styles.equip}`}>{ex.equipment}</span>}
                  {ex.movementType && <span className={`${styles.tag} ${styles.move}`}>{ex.movementType}</span>}
                  {ex.unilateral   && <span className={`${styles.tag} ${styles.uni}`}>Unilateral</span>}
                </div>
              </div>
              <button
                className={`${styles.heartBtn} ${ex.favourite ? styles.heartActive : ''}`}
                onClick={e => handleToggleFavourite(e, ex)}
                title={ex.favourite ? 'Remove from My Exercises' : 'Add to My Exercises'}
              >
                {ex.favourite ? '♥' : '♡'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => { setEditExercise(null); setShowForm(true); }}>+</button>

      {showForm && <ExerciseForm exercise={editExercise} onClose={handleFormClose} />}

      {/* Detail modal */}
      {detailEx && (
        <div className={styles.overlay} onClick={() => setDetailEx(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <div className={styles.detailHeader}>
              <div className={styles.detailIcon}>{MUSCLE_EMOJI[detailEx.muscleGroup] || '💪'}</div>
              <div>
                <div className={styles.detailName}>{detailEx.name}</div>
                <div className={styles.tags} style={{ marginTop: 6 }}>
                  {detailEx.muscleGroup  && <span className={`${styles.tag} ${styles.muscle}`}>{detailEx.muscleGroup}</span>}
                  {detailEx.subCategory  && <span className={`${styles.tag} ${styles.sub}`}>{detailEx.subCategory}</span>}
                  {detailEx.equipment    && <span className={`${styles.tag} ${styles.equip}`}>{detailEx.equipment}</span>}
                  {detailEx.movementType && <span className={`${styles.tag} ${styles.move}`}>{detailEx.movementType}</span>}
                  {detailEx.unilateral   && <span className={`${styles.tag} ${styles.uni}`}>Unilateral</span>}
                </div>
              </div>
            </div>
            {detailEx.notes && <div className={styles.detailNote}>📝 {detailEx.notes}</div>}
            <div className={styles.detailActions}>
              <button
                className={`${styles.actionBtn} ${detailEx.favourite ? styles.secondary : styles.primary}`}
                onClick={e => { handleToggleFavourite(e, detailEx); setDetailEx(prev => prev ? { ...prev, favourite: !prev.favourite } : null); }}
              >
                {detailEx.favourite ? '♥ Remove from My Exercises' : '♡ Add to My Exercises'}
              </button>
              <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => handleEdit(detailEx)}>Edit</button>
              <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(detailEx)}>Delete</button>
            </div>
            <div style={{ height: 8 }} />
          </div>
        </div>
      )}
    </div>
  );
}
