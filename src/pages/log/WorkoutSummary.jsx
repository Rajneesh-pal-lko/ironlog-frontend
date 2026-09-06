import { useWorkout } from '../../context/WorkoutContext';
import styles from './WorkoutSummary.module.css';

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const mins = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function totalVolume(exercises) {
  return exercises.reduce((total, ex) => {
    if (ex.isTimed || ex.isBodyweight) return total;
    return total + (ex.sets || []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
  }, 0);
}

function totalSets(exercises) {
  return exercises.reduce((t, ex) => t + (ex.sets?.length || 0), 0);
}

export default function WorkoutSummary() {
  const { lastCompleted, clearLastCompleted } = useWorkout();
  if (!lastCompleted) return null;

  const exercises = lastCompleted.exercises || [];
  const sets      = totalSets(exercises);
  const vol       = totalVolume(exercises);
  const duration  = formatDuration(lastCompleted.startTime, lastCompleted.endTime);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <div className={styles.topIcon}>🏁</div>
        <h1 className={styles.title}>Workout Complete!</h1>
        <p className={styles.sub}>
          {new Date(lastCompleted.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{duration}</span>
            <span className={styles.statLabel}>Duration</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statVal}>{exercises.length}</span>
            <span className={styles.statLabel}>Exercises</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statVal}>{sets}</span>
            <span className={styles.statLabel}>Sets</span>
          </div>
          {vol > 0 && <>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <span className={styles.statVal}>{vol >= 1000 ? `${(vol/1000).toFixed(1)}t` : `${vol}kg`}</span>
              <span className={styles.statLabel}>Volume</span>
            </div>
          </>}
        </div>

        {/* PR callouts */}
        {exercises.some(ex => ex._pr) && (
          <div className={styles.prBanner}>
            🏆 New PRs this session!
            {exercises.filter(ex => ex._pr).map(ex => (
              <span key={ex._id} className={styles.prExName}>{ex.exerciseName}</span>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <div className={styles.exList}>
          {exercises.map(ex => {
            const sets = ex.sets || [];
            const summary = ex.isTimed
              ? `${sets.length} sets`
              : ex.isBodyweight
                ? sets.map(s => `${s.reps}`).join(' · ') + ' reps'
                : sets.map(s => `${s.weight}×${s.reps}`).join(' · ');
            return (
              <div key={ex._id} className={styles.exRow}>
                <span className={styles.exName}>{ex.exerciseName}</span>
                <span className={styles.exSets}>{summary}</span>
              </div>
            );
          })}
        </div>

        <button className={styles.doneBtn} onClick={clearLastCompleted}>
          Done 💪
        </button>
      </div>
    </div>
  );
}
