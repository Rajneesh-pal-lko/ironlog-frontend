import { useState, useEffect } from 'react';
import { MUSCLE_GROUPS, MUSCLE_EMOJI } from '../data/constants';
import { api } from '../data/api';
import { useToast } from '../components/Toast';
import ExerciseForm from './ExerciseForm';
import styles from './Exercises.module.css';

export default function Exercises({ onMenuOpen }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [detailEx, setDetailEx] = useState(null);
  const showToast = useToast();

  const load = async () => {
    try {
      const data = await api.exercises.getAll();
      setExercises(data);
    } catch (err) {
      showToast('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = exercises.filter(e => {
    if (!showInactive && !e.active) return false;
    if (filter !== 'All' && e.muscleGroup !== filter) return false;
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

  async function handleToggleActive(ex) {
    try {
      await api.exercises.toggleActive(ex._id);
      await load();
      setDetailEx(null);
      showToast(ex.active ? `"${ex.name}" deactivated` : `"${ex.name}" activated`);
    } catch {
      showToast('Failed to update exercise');
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
      showToast('Failed to delete exercise');
    }
  }

  function handleEdit(ex) {
    setEditExercise(ex);
    setDetailEx(null);
    setShowForm(true);
  }

  async function handleFormClose(saved) {
    setShowForm(false);
    setEditExercise(null);
    if (saved) {
      await load();
      showToast(editExercise ? 'Exercise updated' : 'Exercise added');
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.logo}>Iron<span>Log</span></h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.inactiveToggle} onClick={() => setShowInactive(v => !v)}>
              {showInactive ? 'Hide inactive' : 'Show inactive'}
            </button>
            <button className={styles.menuBtn} onClick={onMenuOpen} title="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
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

      {/* Filter chips */}
      <div className={styles.chips}>
        {['All', ...MUSCLE_GROUPS].map(g => (
          <button
            key={g}
            className={`${styles.chip} ${filter === g ? styles.active : ''}`}
            onClick={() => setFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Count label */}
      <div className={styles.label}>
        {loading ? 'Loading…' : query
          ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
          : filter === 'All'
            ? `${filtered.length} exercise${filtered.length !== 1 ? 's' : ''}`
            : `${filter} · ${filtered.length}`}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p>Loading exercises…</p></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏋️</div>
            <p>{query ? `No results for "${query}"` : 'No exercises yet. Tap + to add one.'}</p>
          </div>
        ) : (
          filtered.map(ex => (
            <div
              key={ex._id}
              className={`${styles.card} ${!ex.active ? styles.inactive : ''}`}
              onClick={() => setDetailEx(ex)}
            >
              <div className={styles.icon}>{MUSCLE_EMOJI[ex.muscleGroup] || '💪'}</div>
              <div className={styles.info}>
                <div className={styles.name}>{ex.name}</div>
                <div className={styles.tags}>
                  {ex.muscleGroup && <span className={`${styles.tag} ${styles.muscle}`}>{ex.muscleGroup}</span>}
                  {ex.subCategory && <span className={`${styles.tag} ${styles.sub}`}>{ex.subCategory}</span>}
                  {ex.equipment && <span className={`${styles.tag} ${styles.equip}`}>{ex.equipment}</span>}
                  {ex.movementType && <span className={`${styles.tag} ${styles.move}`}>{ex.movementType}</span>}
                  {ex.unilateral && <span className={`${styles.tag} ${styles.uni}`}>Unilateral</span>}
                </div>
              </div>
              {!ex.active && <span className={styles.inactiveBadge}>Inactive</span>}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => { setEditExercise(null); setShowForm(true); }}>+</button>

      {/* Add / Edit form modal */}
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
                  {detailEx.muscleGroup && <span className={`${styles.tag} ${styles.muscle}`}>{detailEx.muscleGroup}</span>}
                  {detailEx.subCategory && <span className={`${styles.tag} ${styles.sub}`}>{detailEx.subCategory}</span>}
                  {detailEx.equipment && <span className={`${styles.tag} ${styles.equip}`}>{detailEx.equipment}</span>}
                  {detailEx.movementType && <span className={`${styles.tag} ${styles.move}`}>{detailEx.movementType}</span>}
                  {detailEx.unilateral && <span className={`${styles.tag} ${styles.uni}`}>Unilateral</span>}
                </div>
              </div>
            </div>
            {detailEx.notes && <div className={styles.detailNote}>📝 {detailEx.notes}</div>}
            <div className={styles.detailActions}>
              <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleEdit(detailEx)}>Edit</button>
              <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => handleToggleActive(detailEx)}>
                {detailEx.active ? 'Deactivate' : 'Activate'}
              </button>
              <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(detailEx)}>Delete</button>
            </div>
            <div style={{ height: 8 }} />
          </div>
        </div>
      )}
    </div>
  );
}
