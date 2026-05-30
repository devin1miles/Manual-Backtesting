import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/journal', label: 'Trade Journal' },
  { to: '/analytics', label: 'Analytics' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside style={styles.aside}>
      <div style={styles.logo}>Trading Analyzer</div>
      <nav style={styles.nav}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            ...styles.link,
            background: isActive ? 'var(--surface)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--muted)',
          })}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={styles.bottom}>
        <div style={styles.email}>{user.email}</div>
        <button style={styles.logout} onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}

const styles = {
  aside: { width: 200, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 },
  logo: { color: 'var(--accent)', fontWeight: 700, fontSize: 15, padding: '0 20px 24px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' },
  link: { display: 'block', padding: '9px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 500, fontSize: 13, transition: 'all 0.15s' },
  bottom: { padding: '0 20px', borderTop: '1px solid var(--border)', paddingTop: 16 },
  email: { fontSize: 11, color: 'var(--muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logout: { width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', cursor: 'pointer', fontSize: 12 },
};
