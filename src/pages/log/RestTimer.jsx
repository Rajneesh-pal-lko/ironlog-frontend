import { useState, useEffect, useRef } from 'react';
import styles from './RestTimer.module.css';

export default function RestTimer({ seconds = 90, onDismiss }) {
  const [remaining, setRemaining] = useState(seconds);
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

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / seconds) * 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Rest</span>
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
