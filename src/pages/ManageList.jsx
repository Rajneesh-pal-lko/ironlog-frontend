import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import styles from './ManageList.module.css';

export default function ManageList({ title, items, onAdd, onDelete, placeholder }) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const showToast = useToast();

  function handleAdd() {
    const val = input.trim();
    if (!val) return;
    if (items.map(i => i.toLowerCase()).includes(val.toLowerCase())) {
      showToast('Already exists');
      return;
    }
    onAdd(val);
    setInput('');
    showToast(`"${val}" added`);
  }

  function handleDelete(item) {
    if (!window.confirm(`Remove "${item}"?`)) return;
    onDelete(item);
    showToast(`"${item}" removed`);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      {/* Add input */}
      <div className={styles.addRow}>
        <input
          className={styles.input}
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.addBtn} onClick={handleAdd}>Add</button>
      </div>

      {/* Count */}
      <div className={styles.label}>{items.length} {items.length === 1 ? 'item' : 'items'}</div>

      {/* List */}
      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>Nothing here yet. Add one above.</div>
        ) : (
          items.map(item => (
            <div key={item} className={styles.item}>
              <span className={styles.itemName}>{item}</span>
              <button className={styles.deleteBtn} onClick={() => handleDelete(item)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
