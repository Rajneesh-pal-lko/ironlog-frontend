import { useState, useEffect, useRef } from 'react';
import styles from './RestTimer.module.css';

const STORAGE_KEY = 'ironlog_rest_seconds';

export function getDefaultRest() {
  return Number(localStorage.getItem(STORAGE_KEY) || 90);
}

export default function RestTimer({ seconds: initialSeconds, onDismiss }) {
  const defaultSecs = initialSeconds ?? getDefaultRest();
  const [total, setTotal] = useState(defaultSecs);
  const [remaining, setRemaining] = useState(defaultSecs);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) { onDismiss?.(); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); onDismiss?.(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, remaining]);

  function adjust(delta) {
    const next = Math.max(10, remaining + delta);
    setRemaining(next);
    const newTotal = Math.max(10, total + delta);
    setTotal(newTotal);
    localStorage.setItem(STORAGE_KEY, newTotal);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / total) * 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.row}>
        <div className={styles.adjustBtns}>
          <button className={styles.adjustBtn} onClick={() => adjust(-30)}>−30s</button>
          <button className={styles.adjustBtn} onClick={() => adjust(+30)}>+30s</button>
        </div>
        <span className={styles.time}>{mm}:{ss}</span>
        <div className={styles.btns}>
          <button className={styles.btn} onClick={() => setPaused(p => !p)}>
            {paused ? '▶' : '⏸'}
          </button>
          <button className={styles.btn} onClick={onDismiss}>Skip</button>
        </div>
      </div>
    </div>
  );
}
