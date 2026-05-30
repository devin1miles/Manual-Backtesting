import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Trading Analyzer</h1>
        <p style={styles.sub}>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <input style={styles.input} placeholder="Username (optional)" value={form.username} onChange={set('username')} />
          )}
          <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
        <button style={styles.toggle} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', width: '100%' },
  card: { width: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 },
  title: { color: 'var(--accent)', fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' },
  sub: { color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  input: { display: 'block', width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, marginBottom: 10, outline: 'none' },
  error: { color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  btn: { width: '100%', padding: 11, background: 'var(--accent)', color: '#0f0f14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 10 },
  toggle: { width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', textAlign: 'center' },
};
