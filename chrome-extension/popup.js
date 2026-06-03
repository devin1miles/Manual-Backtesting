// --- Screen helpers ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function setError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError(id) {
  const el = document.getElementById(id);
  el.textContent = '';
  el.classList.add('hidden');
}

// --- Auth ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('login-error');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return setError('login-error', data.error || 'Login failed');
    await StorageHelper.set({ token: data.token, user: data.user });
    loadDashboard(data.user);
    loadApiKeyStatus();
  } catch {
    setError('login-error', 'Could not connect to server. Is the backend running?');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('register-error');
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return setError('register-error', data.error || 'Registration failed');
    await StorageHelper.set({ token: data.token, user: data.user });
    loadDashboard(data.user);
    loadApiKeyStatus();
  } catch {
    setError('register-error', 'Could not connect to server. Is the backend running?');
  }
});

document.getElementById('show-register').addEventListener('click', () => showScreen('register-screen'));
document.getElementById('show-login').addEventListener('click', () => showScreen('login-screen'));

document.getElementById('logout-btn').addEventListener('click', async () => {
  await StorageHelper.remove(['token', 'user']);
  showScreen('login-screen');
});

// --- Dashboard ---
let currentTab = 'today';

async function loadDashboard(user) {
  showScreen('dashboard-screen');
  document.getElementById('user-email-display').textContent = user.email;
  await loadStats(currentTab);
}

async function loadStats(period) {
  const { token } = await StorageHelper.get(['token']);
  try {
    const res = await fetch(`${API_BASE}/stats/${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return;

    const pnl = parseFloat(data.net_pnl);
    const pnlEl = document.getElementById('stat-pnl');
    pnlEl.textContent = `$${pnl.toFixed(2)}`;
    pnlEl.className = 'stat-value ' + (pnl >= 0 ? 'positive' : 'negative');

    document.getElementById('stat-winrate').textContent = `${data.win_rate}%`;
    document.getElementById('stat-trades').textContent = data.total_trades;
    document.getElementById('stat-avg-win').textContent = `$${parseFloat(data.avg_win).toFixed(2)}`;
  } catch {
    // silently fail — server might not be reachable
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    await loadStats(currentTab);
  });
});

// --- Trade Form ---
document.getElementById('trade-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('trade-error');
  document.getElementById('trade-success').classList.add('hidden');

  const { token } = await StorageHelper.get(['token']);
  const symbol = document.getElementById('trade-symbol').value.trim();
  const side = document.getElementById('trade-side').value;
  const entry_price = parseFloat(document.getElementById('trade-entry').value);
  const exit_price_raw = document.getElementById('trade-exit').value;
  const exit_price = exit_price_raw ? parseFloat(exit_price_raw) : null;
  const quantity = parseFloat(document.getElementById('trade-qty').value);
  const notes = document.getElementById('trade-notes').value.trim();
  const now = new Date().toISOString();

  const body = { symbol, side, entry_price, quantity, entry_time: now, notes };
  if (exit_price) { body.exit_price = exit_price; body.exit_time = now; }

  try {
    const res = await fetch(`${API_BASE}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return setError('trade-error', data.error || 'Failed to log trade');

    document.getElementById('trade-form').reset();
    document.getElementById('trade-success').classList.remove('hidden');
    await loadStats(currentTab);
  } catch {
    setError('trade-error', 'Could not connect to server');
  }
});

// --- API Key ---
document.getElementById('save-key-btn').addEventListener('click', async () => {
  const key = document.getElementById('anthropic-key-input').value.trim();
  const msg = document.getElementById('key-msg');
  if (!key.startsWith('sk-ant-')) {
    msg.textContent = 'Invalid — must start with sk-ant-';
    msg.style.color = '#ff5c5c';
    msg.classList.remove('hidden');
    return;
  }
  await StorageHelper.set({ anthropicKey: key });
  document.getElementById('anthropic-key-input').value = '';
  document.getElementById('anthropic-key-input').placeholder = 'Key saved ✓ (paste new key to update)';
  msg.textContent = 'Saved!';
  msg.style.color = '#00d4aa';
  msg.classList.remove('hidden');
});

async function loadApiKeyStatus() {
  const { anthropicKey } = await StorageHelper.get(['anthropicKey']);
  if (anthropicKey) {
    document.getElementById('anthropic-key-input').placeholder = 'Key saved ✓ (paste new key to update)';
  }
}

// --- Init ---
async function init() {
  const { token, user } = await StorageHelper.get(['token', 'user']);
  if (!token || !user) return showScreen('login-screen');

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      loadDashboard(data.user);
      loadApiKeyStatus();
    } else {
      await StorageHelper.remove(['token', 'user']);
      showScreen('login-screen');
    }
  } catch {
    // Backend offline — still show dashboard with cached user
    if (user) loadDashboard(user);
    else showScreen('login-screen');
  }
}

init();
