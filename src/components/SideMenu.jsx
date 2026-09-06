import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../data/api';
import { useToast } from './Toast';
import styles from './SideMenu.module.css';

const MENU_ITEMS = [
  {
    group: 'Manage',
    items: [
      { label: 'Equipment',      path: '/manage/equipment',      icon: '🏋️' },
      { label: 'Movement Types', path: '/manage/movement-types', icon: '🔄' },
    ],
  },
  {
    group: 'App',
    items: [
      { label: 'Settings',    path: '/settings', icon: '⚙️', soon: true },
      { label: 'Export Data', path: '/export',   icon: '📤', soon: true },
    ],
  },
];

export default function SideMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const showToast = useToast();
  const [seeding, setSeeding] = useState(false);

  async function handleSeedHistory() {
    setSeeding(true);
    try {
      const res = await api.seed.demoHistory();
      showToast(res.message || 'Demo history added!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed — make sure you have exercises in your library first.', 'error');
    } finally {
      setSeeding(false);
    }
  }

  function go(path, soon) {
    if (soon) return;
    onClose();
    navigate(path);
  }

  function handleLogout() {
    onClose();
    logout();
    navigate('/login');
  }

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.open : ''}`} onClick={onClose} />
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.appName}>Iron<span>Log</span></div>
            {user && <div className={styles.userName}>{user.name}</div>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {MENU_ITEMS.map(group => (
          <div key={group.group} className={styles.group}>
            <div className={styles.groupLabel}>{group.group}</div>
            {group.items.map(item => (
              <button
                key={item.path}
                className={`${styles.menuItem} ${item.soon ? styles.soon : ''}`}
                onClick={() => go(item.path, item.soon)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
                {item.soon
                  ? <span className={styles.soonBadge}>Soon</span>
                  : <span className={styles.arrow}>›</span>
                }
              </button>
            ))}
          </div>
        ))}

        <div className={styles.group}>
          <div className={styles.groupLabel}>Setup & Dev</div>
          <button className={styles.menuItem} onClick={handleSeedHistory} disabled={seeding}>
            <span className={styles.menuIcon}>🧪</span>
            <span className={styles.menuLabel}>{seeding ? 'Adding…' : 'Load Demo Workout History'}</span>
          </button>
        </div>

        <div className={styles.group}>
          <div className={styles.groupLabel}>Account</div>
          <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
            <span className={styles.menuIcon}>🚪</span>
            <span className={styles.menuLabel}>Log Out</span>
          </button>
        </div>

        <div className={styles.footer}>IronLog · Personal Gym Tracker</div>
      </div>
    </>
  );
}
