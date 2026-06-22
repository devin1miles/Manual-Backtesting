import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset', { token, password });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Trading Analyzer</h1>
          <p style={styles.error}>Missing or invalid reset link.</p>
          <button style={styles.back} onClick={() => navigate('/login')}>← Back to login</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Trading Analyzer</h1>
          <p style={styles.sub}>Password updated. You can now log in.</p>
          <button style={styles.btn} onClick={() => navigate('/login')}>Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Trading Analyzer</h1>
        <p style={styles.sub}>Choose a new password</p>
        <form onSubmit={submit}>
          <input style={styles.input} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <input style={styles.input} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Reset Password'}
          </button>
        </form>
        <button style={styles.back} onClick={() => navigate('/login')}>← Back to login</button>
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
  error: { color: 'var(--red)', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  btn: { width: '100%', padding: 11, background: 'var(--accent)', color: '#0f0f14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 10 },
  back: { width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', textAlign: 'center' },
};
