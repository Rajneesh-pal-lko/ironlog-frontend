import { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

let showToastFn = null;

export function useToast() {
  return showToastFn;
}

export default function Toast() {
  const [toast, setToast] = useState({ message: '', visible: false });

  const show = useCallback((message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  }, []);

  useEffect(() => {
    showToastFn = show;
  }, [show]);

  return (
    <div className={`${styles.toast} ${toast.visible ? styles.show : ''}`}>
      {toast.message}
    </div>
  );
}
