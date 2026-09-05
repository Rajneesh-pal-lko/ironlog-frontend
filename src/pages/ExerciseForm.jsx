import { useState, useEffect } from 'react';
import { MUSCLE_GROUPS, SUBCATEGORIES } from '../data/constants';
import { api } from '../data/api';
import styles from './ExerciseForm.module.css';

const EMPTY = {
  name: '',
  muscleGroup: '',
  subCategory: '',
  equipment: '',
  movementType: '',
  unilateral: false,
  notes: '',
};

export default function ExerciseForm({ exercise, onClose }) {
  const [form, setForm] = useState(exercise ? { ...exercise } : { ...EMPTY });
  const [errors, setErrors] = useState({});
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [movementOptions, setMovementOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!exercise;

  useEffect(() => {
    async function loadOptions() {
      const [eq, mv] = await Promise.all([
        api.equipment.getAll(),
        api.movementTypes.getAll(),
      ]);
      setEquipmentOptions(eq);
      setMovementOptions(mv);
    }
    loadOptions();
  }, []);

  function set(field, value) {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === 'muscleGroup' && !isEdit) updated.subCategory = '';
      return updated;
    });
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Exercise name is required';
    if (!form.muscleGroup) e.muscleGroup = 'Select a muscle group';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.exercises.update(exercise._id, form);
      } else {
        await api.exercises.create(form);
      }
      onClose(true);
    } catch (err) {
      setErrors({ name: err.message });
    } finally {
      setSaving(false);
    }
  }

  const subcats = SUBCATEGORIES[form.muscleGroup] || [];

  return (
    <div className={styles.overlay} onClick={() => onClose(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.title}>{isEdit ? 'Edit Exercise' : 'Add Exercise'}</div>

        <div className={styles.group}>
          <label className={styles.label}>Exercise Name *</label>
          <input
            className={`${styles.input} ${errors.name ? styles.error : ''}`}
            type="text"
            placeholder="e.g. Incline Dumbbell Press"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
          {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.group}>
            <label className={styles.label}>Muscle Group *</label>
            <select
              className={`${styles.select} ${errors.muscleGroup ? styles.error : ''}`}
              value={form.muscleGroup}
              onChange={e => set('muscleGroup', e.target.value)}
            >
              <option value="">Select…</option>
              {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            {errors.muscleGroup && <span className={styles.errorMsg}>{errors.muscleGroup}</span>}
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Sub-category</label>
            <select
              className={styles.select}
              value={form.subCategory}
              onChange={e => set('subCategory', e.target.value)}
              disabled={!form.muscleGroup}
            >
              <option value="">{form.muscleGroup ? 'Select…' : 'Pick muscle first'}</option>
              {subcats.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.group}>
            <label className={styles.label}>Equipment</label>
            <select className={styles.select} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
              <option value="">Select…</option>
              {equipmentOptions.map(eq => <option key={eq}>{eq}</option>)}
            </select>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Movement Type</label>
            <select className={styles.select} value={form.movementType} onChange={e => set('movementType', e.target.value)}>
              <option value="">Select…</option>
              {movementOptions.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.toggleRow} onClick={() => set('unilateral', !form.unilateral)}>
          <div className={styles.toggleInfo}>
            <div className={styles.toggleTitle}>Unilateral</div>
            <div className={styles.toggleSub}>Log left & right side separately</div>
          </div>
          <div className={`${styles.toggle} ${form.unilateral ? styles.on : ''}`}>
            <div className={styles.thumb} />
          </div>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Personal Notes</label>
          <textarea
            className={styles.textarea}
            placeholder="Your cues, tips, grip width… anything you want to remember"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Exercise'}
        </button>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
