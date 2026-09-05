import { useNavigate } from 'react-router-dom';
import styles from './SideMenu.module.css';

const MENU_ITEMS = [
  {
    group: 'Manage',
    items: [
      { label: 'Equipment', path: '/manage/equipment', icon: '🏋️' },
      { label: 'Movement Types', path: '/manage/movement-types', icon: '🔄' },
    ],
  },
  {
    group: 'App',
    items: [
      { label: 'Settings', path: '/settings', icon: '⚙️', soon: true },
      { label: 'Export Data', path: '/export', icon: '📤', soon: true },
    ],
  },
];

export default function SideMenu({ open, onClose }) {
  const navigate = useNavigate();

  function go(path, soon) {
    if (soon) return;
    onClose();
    navigate(path);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.open : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <div className={styles.appName}>Iron<span>Log</span></div>
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

        <div className={styles.footer}>IronLog · Personal Gym Tracker</div>
      </div>
    </>
  );
}
