import { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

let showToastFn = null;

export function useToast() {
  return showToastFn;
}

export default function Toast() {
  const [toast, setToast] = useState({ message: '', visible: false, type: 'default' });

  const show = useCallback((message, type = 'default') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  }, []);

  useEffect(() => {
    showToastFn = show;
  }, [show]);

  return (
    <div className={`${styles.toast} ${styles[toast.type] || ''} ${toast.visible ? styles.show : ''}`}>
      {toast.message}
    </div>
  );
}
