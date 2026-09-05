import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Fill in all fields'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/exercises');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Iron<span>Log</span></div>
        <div className={styles.subtitle}>Create your account</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              type="text" placeholder="Your name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email" placeholder="you@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password" placeholder="Min 6 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className={styles.switch}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
