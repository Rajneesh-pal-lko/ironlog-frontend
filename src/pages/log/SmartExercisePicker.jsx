import { useState, useEffect, useRef } from 'react';
import { api } from '../../data/api';
import { MUSCLE_EMOJI } from '../../data/constants';
import { useToast } from '../../components/Toast';
import styles from './SmartExercisePicker.module.css';

// Keywords that mark timed exercises
const TIMED_KEYWORDS = ['plank', 'hold', 'carry', 'run', 'bike', 'row', 'treadmill', 'elliptical', 'stairmaster', 'sprint', 'walk'];

function buildExData(ex) {
  const isBodyweight = ex.equipment === 'Bodyweight' && !ex.unilateral;
  const isTimed = TIMED_KEYWORDS.some(k => (ex.exerciseName || ex.name || '').toLowerCase().includes(k));
  return {
    exerciseId:   ex.exerciseId || ex._id,
    exerciseName: ex.exerciseName || ex.name,
    muscleGroup:  ex.muscleGroup,
    isBodyweight: ex.isBodyweight ?? isBodyweight,
    isTimed:      ex.isTimed ?? isTimed,
    unilateral:   ex.unilateral || false,
  };
}

function daysSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  if (diff < 14) return '1wk ago';
  return `${Math.round(diff / 7)}wk ago`;
}

// Which muscle groups map to routine workout types
const TYPE_TO_MUSCLES = {
  'Push':        ['Chest', 'Shoulders', 'Triceps', 'Arms'],
  'Pull':        ['Back', 'Biceps', 'Arms'],
  'Legs':        ['Legs', 'Glutes', 'Hamstrings', 'Quads', 'Calves'],
  'Upper Body':  ['Chest', 'Back', 'Shoulders', 'Arms', 'Biceps', 'Triceps'],
  'Lower Body':  ['Legs', 'Glutes', 'Hamstrings', 'Quads', 'Calves', 'Core'],
  'Full Body':   [], // all
  'Chest':       ['Chest'],
  'Back':        ['Back'],
  'Shoulders':   ['Shoulders'],
  'Arms':        ['Arms', 'Biceps', 'Triceps'],
  'Core':        ['Core', 'Abs'],
  'Hinge':       ['Back', 'Legs', 'Glutes'],
  'Squat':       ['Legs', 'Glutes', 'Quads'],
  'Cardio':      [],
  'Mobility':    [],
};

function musclesForRoutine(routineLabels) {
  if (!routineLabels?.length) return null;
  const set = new Set();
  for (const label of routineLabels) {
    const muscles = TYPE_TO_MUSCLES[label];
    if (!muscles || muscles.length === 0) return null; // Full Body / Cardio = show all
    muscles.forEach(m => set.add(m));
  }
  return set.size > 0 ? set : null;
}

export default function SmartExercisePicker({ onSelect, onClose, routineLabels = [], alreadyAdded = [] }) {
  const [myExercises, setMyExercises]   = useState([]);  // favourited exercises
  const [allExercises, setAllExercises] = useState([]);  // full library
  const [recentExs, setRecentExs]       = useState([]);  // recently done
  const [search, setSearch]             = useState('');
  const [showAll, setShowAll]           = useState(false); // toggle My / All
  const [loading, setLoading]           = useState(true);
  const [addingToFav, setAddingToFav]   = useState(null); // exerciseId being toggled
  const showToast = useToast();
  const searchRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.exercises.getAll(),
      api.workouts.recentExercises().catch(() => []),
    ]).then(([allEx, recent]) => {
      setAllExercises(allEx);
      setMyExercises(allEx.filter(e => e.favourite));
      setRecentExs(recent);
    }).finally(() => setLoading(false));
  }, []);

  // Muscles relevant to today's routine
  const routineMuscles = musclesForRoutine(routineLabels);

  function isAdded(exerciseId) {
    return alreadyAdded.some(id => id === exerciseId || id === exerciseId?.toString());
  }

  function handleSelect(ex) {
    const data = buildExData(ex);
    const isMine = allExercises.find(e => e._id === (ex._id || ex.exerciseId))?.favourite;
    onSelect(data, !isMine); // second arg = promptFav
    onClose();
  }

  async function handleAddToFav(ex, e) {
    e.stopPropagation();
    setAddingToFav(ex._id);
    try {
      await api.exercises.toggleFavourite(ex._id);
      setAllExercises(prev => prev.map(e => e._id === ex._id ? { ...e, favourite: true } : e));
      setMyExercises(prev => [...prev, { ...ex, favourite: true }]);
      showToast(`${ex.name} added to My Exercises ♥`, 'success');
    } catch {
      showToast('Failed to add', 'error');
    } finally {
      setAddingToFav(null);
    }
  }

  // Determine what list to show based on search + showAll toggle
  const sourceList = showAll ? allExercises : myExercises;

  const searchFiltered = search.length >= 1
    ? allExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  // Routine-matched exercises from My Exercises (for suggestions section)
  const routineSuggestions = !search && myExercises.filter(e => {
    if (!routineMuscles) return false; // no routine = no suggestions
    return routineMuscles.has(e.muscleGroup);
  }).slice(0, 8);

  // Recent exercises (excluding already added + already in suggestions)
  const suggestionIds = new Set(routineSuggestions ? routineSuggestions.map(e => e._id) : []);
  const recentFiltered = !search && recentExs
    .filter(e => !suggestionIds.has(e.exerciseId) && !isAdded(e.exerciseId))
    .slice(0, 6);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
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
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* My / All toggle — only shown when not searching */}
        {!search && (
          <div className={styles.toggleRow}>
            <button
              className={`${styles.toggleBtn} ${!showAll ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowAll(false)}
            >♥ My Exercises</button>
            <button
              className={`${styles.toggleBtn} ${showAll ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowAll(true)}
            >All Exercises</button>
          </div>
        )}

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loadingMsg}>Loading…</div>
          ) : searchFiltered ? (
            /* ── SEARCH RESULTS ── */
            <>
              {searchFiltered.length === 0 ? (
                <div className={styles.emptyMsg}>No exercises found for "{search}"</div>
              ) : searchFiltered.map(ex => (
                <ExRow key={ex._id} ex={ex} onSelect={handleSelect} isAdded={isAdded(ex._id)}
                  showFavPrompt={!ex.favourite} onAddFav={handleAddToFav} addingToFav={addingToFav} />
              ))}
            </>
          ) : !showAll ? (
            /* ── MY EXERCISES VIEW ── */
            <>
              {/* Routine suggestions */}
              {routineSuggestions?.length > 0 && (
                <Section title={`🔥 For today · ${routineLabels.join(' + ')}`}>
                  {routineSuggestions.map(ex => (
                    <ExRow key={ex._id} ex={ex} onSelect={handleSelect} isAdded={isAdded(ex._id)}
                      showFavPrompt={false} onAddFav={handleAddToFav} addingToFav={addingToFav} />
                  ))}
                </Section>
              )}

              {/* Recent */}
              {recentFiltered?.length > 0 && (
                <Section title="🕐 Recent">
                  {recentFiltered.map(ex => (
                    <ExRow key={ex.exerciseId} ex={{
                      _id: ex.exerciseId,
                      name: ex.exerciseName,
                      muscleGroup: ex.muscleGroup,
                      isBodyweight: ex.isBodyweight,
                      isTimed: ex.isTimed,
                      unilateral: ex.unilateral,
                      favourite: myExercises.some(m => m._id === ex.exerciseId),
                      _lastDate: ex.lastDate,
                    }} onSelect={handleSelect} isAdded={isAdded(ex.exerciseId)}
                      showFavPrompt={false} onAddFav={handleAddToFav} addingToFav={addingToFav} />
                  ))}
                </Section>
              )}

              {/* All My Exercises */}
              {myExercises.length === 0 ? (
                <div className={styles.emptyMsg}>
                  No exercises in My Exercises yet.<br/>
                  <button className={styles.switchToAll} onClick={() => setShowAll(true)}>Browse all exercises →</button>
                </div>
              ) : (
                <Section title={routineSuggestions?.length > 0 ? "All My Exercises" : "My Exercises"}>
                  {myExercises
                    .filter(e => !suggestionIds.has(e._id))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(ex => (
                      <ExRow key={ex._id} ex={ex} onSelect={handleSelect} isAdded={isAdded(ex._id)}
                        showFavPrompt={false} onAddFav={handleAddToFav} addingToFav={addingToFav} />
                    ))
                  }
                </Section>
              )}

              <button className={styles.browseAll} onClick={() => setShowAll(true)}>Browse all exercises →</button>
            </>
          ) : (
            /* ── ALL EXERCISES VIEW ── */
            <>
              {allExercises.length === 0 ? (
                <div className={styles.emptyMsg}>No exercises in library</div>
              ) : (
                <Section title="All Exercises">
                  {allExercises
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(ex => (
                      <ExRow key={ex._id} ex={ex} onSelect={handleSelect} isAdded={isAdded(ex._id)}
                        showFavPrompt={!ex.favourite} onAddFav={handleAddToFav} addingToFav={addingToFav} />
                    ))
                  }
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function ExRow({ ex, onSelect, isAdded, showFavPrompt, onAddFav, addingToFav }) {
  return (
    <button
      className={`${styles.exRow} ${isAdded ? styles.exRowAdded : ''}`}
      onClick={() => !isAdded && onSelect(ex)}
      disabled={isAdded}
    >
      <span className={styles.exIcon}>{MUSCLE_EMOJI[ex.muscleGroup] || '🏋️'}</span>
      <span className={styles.exInfo}>
        <span className={styles.exName}>
          {ex.favourite && <span className={styles.heart}>♥</span>}
          {ex.name}
          {isAdded && <span className={styles.addedBadge}> · Added</span>}
        </span>
        <span className={styles.exMeta}>
          {ex.muscleGroup}
          {ex._lastDate && <span className={styles.lastDate}> · {daysSince(ex._lastDate)}</span>}
        </span>
      </span>
      {showFavPrompt && !isAdded && (
        <button
          className={styles.favBtn}
          onClick={e => onAddFav(ex, e)}
          disabled={addingToFav === ex._id}
          title="Add to My Exercises"
        >
          {addingToFav === ex._id ? '…' : '♡'}
        </button>
      )}
    </button>
  );
}
