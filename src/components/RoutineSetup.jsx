import { useState, useEffect } from 'react';
import { api } from '../data/api';
import { useToast } from './Toast';
import styles from './RoutineSetup.module.css';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

// Groups of selectable labels — tap to toggle, max 3 per day
const LABEL_GROUPS = [
  {
    group: 'Session',
    labels: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body'],
  },
  {
    group: 'Focus',
    labels: ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Hinge', 'Squat', 'Cardio', 'Mobility'],
  },
  {
    group: '',
    labels: ['Rest Day'],
  },
];

// Derive workoutTypes array from selected labels
const LABEL_TYPES = {
  'Push':        ['Push', 'Chest', 'Shoulders', 'Arms'],
  'Pull':        ['Pull', 'Back', 'Arms'],
  'Legs':        ['Legs'],
  'Upper Body':  ['Chest', 'Back', 'Shoulders', 'Arms'],
  'Lower Body':  ['Legs', 'Core'],
  'Full Body':   ['Full Body'],
  'Chest':       ['Chest'],
  'Back':        ['Back'],
  'Shoulders':   ['Shoulders'],
  'Arms':        ['Arms'],
  'Core':        ['Core'],
  'Hinge':       ['Hinge'],
  'Squat':       ['Squat'],
  'Cardio':      ['Cardio'],
  'Mobility':    ['Mobility'],
  'Rest Day':    [],
};

const MAX_SELECT = 3;

const emptyDay = () => ({ labels: [], workoutTypes: [], isRest: false });

// Migrate old single-label format
function normaliseDay(d) {
  if (!d) return emptyDay();
  if (Array.isArray(d.labels)) return d;
  // old format had d.label (string)
  if (d.label) return {
    labels: [d.label],
    workoutTypes: d.workoutTypes || [],
    isRest: !!d.isRest,
  };
  return emptyDay();
}

function buildTypes(labels) {
  const set = new Set();
  labels.forEach(l => (LABEL_TYPES[l] || []).forEach(t => set.add(t)));
  return [...set];
}

export default function RoutineSetup({ onClose, onSaved }) {
  const [days, setDays] = useState({
    mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(),
    fri: emptyDay(), sat: emptyDay(), sun: emptyDay(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false); // view mode by default
  const showToast = useToast();

  useEffect(() => {
    api.routine.get().then(data => {
      if (data) {
        const merged = {};
        let hasAny = false;
        DAYS.forEach(({ key }) => {
          merged[key] = normaliseDay(data[key]);
          if (merged[key].labels?.length > 0) hasAny = true;
        });
        setDays(merged);
        // If nothing saved yet, open straight into edit mode
        if (!hasAny) setEditing(true);
      } else {
        setEditing(true);
      }
    }).catch(() => { setEditing(true); }).finally(() => setLoading(false));
  }, []);

  function toggleLabel(dayKey, label) {
    setDays(prev => {
      const day = prev[dayKey];
      const isRest = label === 'Rest Day';

      // If toggling Rest Day on — clear everything else
      if (isRest) {
        const alreadyRest = day.labels.includes('Rest Day');
        return {
          ...prev,
          [dayKey]: alreadyRest
            ? emptyDay()
            : { labels: ['Rest Day'], workoutTypes: [], isRest: true },
        };
      }

      // If rest day is set, remove it first
      const currentLabels = day.labels.filter(l => l !== 'Rest Day');
      const idx = currentLabels.indexOf(label);

      let newLabels;
      if (idx >= 0) {
        // Deselect
        newLabels = currentLabels.filter(l => l !== label);
      } else {
        // Select — enforce max
        if (currentLabels.length >= MAX_SELECT) return prev;
        newLabels = [...currentLabels, label];
      }

      return {
        ...prev,
        [dayKey]: {
          labels: newLabels,
          workoutTypes: buildTypes(newLabels),
          isRest: false,
        },
      };
    });
  }

  function clearDay(dayKey) {
    setDays(prev => ({ ...prev, [dayKey]: emptyDay() }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.routine.save(days);
      showToast('Routine saved! 🗓', 'success');
      setEditing(false);
      onSaved?.(); // notify parent to reload without closing
    } catch {
      showToast('Failed to save routine', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.loadingMsg}>Loading routine…</div>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Weekly Routine</h2>
            <p className={styles.sub}>{editing ? 'Select up to 3 focus areas per day.' : 'Your current training split.'}</p>
          </div>
          <div className={styles.headerRight}>
            {!editing && (
              <button className={styles.editBtn} onClick={() => setEditing(true)}>Edit</button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div className={styles.daysList}>
          {DAYS.map(({ key, label }) => {
            const day = days[key];
            const selectedLabels = day.labels || [];
            const atMax = selectedLabels.filter(l => l !== 'Rest Day').length >= MAX_SELECT;

            return (
              <div key={key} className={styles.dayRow}>
                <div className={styles.dayNameWrap}>
                  <span className={`${styles.dayName} ${!editing && selectedLabels.length === 0 ? styles.dayNameDim : ''}`}>
                    {label}
                  </span>
                  {editing && selectedLabels.length > 0 && (
                    <button className={styles.clearBtn} onClick={() => clearDay(key)}>Clear</button>
                  )}
                </div>

                {/* VIEW MODE */}
                {!editing ? (
                  <div className={styles.viewRow}>
                    {selectedLabels.length > 0 ? (
                      selectedLabels.map(l => (
                        <span key={l} className={`${styles.labelChip} ${day.isRest ? styles.restChip : styles.trainChip}`}>
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className={styles.unsetText}>—</span>
                    )}
                  </div>
                ) : (
                  /* EDIT MODE */
                  <div className={styles.dayRight}>
                    {selectedLabels.length > 0 && (
                      <div className={styles.selectedRow}>
                        {selectedLabels.map(l => (
                          <span key={l} className={`${styles.labelChip} ${day.isRest ? styles.restChip : styles.trainChip}`}>
                            {l}
                            <button className={styles.chipRemove} onClick={() => toggleLabel(key, l)}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}

                    {!day.isRest && (
                      <div className={styles.groupsWrap}>
                        {LABEL_GROUPS.map(({ group, labels }) => (
                          <div key={group || 'rest'} className={styles.labelGroupRow}>
                            {group ? <span className={styles.groupTag}>{group}</span> : null}
                            <div className={styles.quickBtns}>
                              {labels.map(ql => {
                                const isSelected = selectedLabels.includes(ql);
                                const disabled = !isSelected && atMax && ql !== 'Rest Day';
                                return (
                                  <button
                                    key={ql}
                                    className={`${styles.quickBtn}
                                      ${isSelected ? styles.quickBtnSelected : ''}
                                      ${ql === 'Rest Day' ? styles.quickBtnRest : ''}
                                      ${disabled ? styles.quickBtnDisabled : ''}`}
                                    onClick={() => toggleLabel(key, ql)}
                                    disabled={disabled}
                                  >{ql}</button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {day.isRest && (
                      <p className={styles.restNote}>Rest day — tap a label above to change</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          {editing ? (
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Routine'}
            </button>
          ) : (
            <button className={styles.saveBtn} onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
