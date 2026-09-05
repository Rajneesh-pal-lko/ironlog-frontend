import styles from './ComingSoon.module.css';

export default function ComingSoon({ icon, title, description }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}
