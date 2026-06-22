(function () {
  if (document.getElementById('ta-widget')) return;

  const BACKEND = 'https://manual-backtesting-production.up.railway.app';

  const widget = document.createElement('div');
  widget.id = 'ta-widget';
  widget.innerHTML = `
    <div id="ta-header">
      <span>Trading Analyzer</span>
      <button id="ta-minimize">−</button>
    </div>
    <div id="ta-body">
      <div id="ta-login-prompt">
        <div class="ta-prompt-title">Login to log trades</div>
        <input id="ta-login-email" type="email" placeholder="Email" />
        <input id="ta-login-pass" type="password" placeholder="Password" />
        <button id="ta-login-btn">Login</button>
        <div id="ta-login-msg"></div>
        <div id="ta-forgot-link">Forgot password?</div>
      </div>
      <div id="ta-reset-prompt" class="hidden">
        <div class="ta-prompt-title">Reset Password</div>
        <input id="ta-reset-email" type="email" placeholder="Your email" />
        <button id="ta-reset-btn">Send Reset Link</button>
        <div id="ta-reset-msg"></div>
        <div id="ta-back-login">← Back to login</div>
      </div>
      <div id="ta-logged-in" class="hidden">
        <div id="ta-user-bar"><span id="ta-user-email"></span><button id="ta-logout-btn">Logout</button></div>
      </div>
      <div id="ta-dropzone" class="hidden">
        <div id="ta-drop-label">📸 Drop screenshot here</div>
        <div id="ta-drop-hint">or</div>
        <label id="ta-upload-label" for="ta-file-input">Choose file</label>
        <input id="ta-file-input" type="file" accept="image/*" />
      </div>
      <div id="ta-status"></div>
      <div id="ta-preview" class="hidden"></div>
      <div id="ta-actions" class="hidden">
        <div class="ta-row">
          <select id="ta-side"><option value="long">Long</option><option value="short">Short</option></select>
          <input id="ta-qty" type="number" value="1" min="1" placeholder="Qty" />
        </div>
        <input id="ta-entry"  type="number" placeholder="Entry Price"  step="0.01" />
        <div class="ta-row">
          <input id="ta-sl"   type="number" placeholder="Stop Loss"    step="0.01" />
          <input id="ta-tp"   type="number" placeholder="Take Profit"  step="0.01" />
        </div>
        <div id="ta-outcome-btns">
          <button class="ta-outcome-btn" data-outcome="open">Still Open</button>
          <button class="ta-outcome-btn" data-outcome="win">✓ Won</button>
          <button class="ta-outcome-btn" data-outcome="loss">✗ Lost</button>
        </div>
        <input id="ta-exit" type="number" placeholder="Exit Price (optional override)" step="0.01" />
        <div id="ta-rr" class="hidden"></div>
        <div id="ta-pnl-preview" class="hidden"></div>
        <select id="ta-strategy">
          <option value="">Strategy (optional)</option>
          <option value="Order Block">Order Block</option>
          <option value="Fair Value Gap (FVG)">Fair Value Gap (FVG)</option>
          <option value="Breaker Block">Breaker Block</option>
          <option value="Liquidity Sweep">Liquidity Sweep</option>
          <option value="Break of Structure (BOS)">Break of Structure (BOS)</option>
          <option value="Change of Character (CHoCH)">Change of Character (CHoCH)</option>
          <option value="Supply &amp; Demand">Supply &amp; Demand</option>
          <option value="Fibonacci Retracement">Fibonacci Retracement</option>
          <option value="Pin Bar">Pin Bar</option>
          <option value="Inside Bar">Inside Bar</option>
        </select>
        <div class="ta-row">
          <input id="ta-pv" type="number" placeholder="$/point" step="0.01" min="0.01" />
          <input id="ta-notes" type="text" placeholder="Notes (optional)" />
        </div>
        <div id="ta-btns">
          <button id="ta-confirm">Log Trade</button>
          <button id="ta-cancel">Cancel</button>
        </div>
        <div id="ta-msg"></div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // --- Point value map ($/point per instrument) ---
  const POINT_VALUES = {
    ES: 50, NQ: 20, YM: 5, RTY: 50,
    MES: 5, MNQ: 2, MYM: 0.5, M2K: 5,
    GC: 100, MGC: 10, SI: 5000, SIL: 1000,
    CL: 1000, MCL: 100, NG: 10000,
  };
  function lookupPointValue(symbol) {
    if (!symbol) return '';
    const base = symbol.replace(/\d+!?$/, '').toUpperCase();
    return POINT_VALUES[base] || '';
  }

  // --- Draggable header ---
  const header = document.getElementById('ta-header');
  let dragging = false, startX, startY;
  widget.style.right  = '24px';
  widget.style.bottom = '24px';

  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'ta-minimize') return;
    dragging = true;
    const rect = widget.getBoundingClientRect();
    widget.style.right  = 'auto';
    widget.style.bottom = 'auto';
    widget.style.left   = rect.left + 'px';
    widget.style.top    = rect.top  + 'px';
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    widget.style.left = (e.clientX - startX) + 'px';
    widget.style.top  = (e.clientY - startY) + 'px';
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
    header.style.cursor = 'grab';
  });

  // --- Minimize ---
  let minimized = false;
  document.getElementById('ta-minimize').addEventListener('click', () => {
    minimized = !minimized;
    document.getElementById('ta-body').style.display = minimized ? 'none' : 'block';
    document.getElementById('ta-minimize').textContent = minimized ? '+' : '−';
  });

  // --- Drop zone events ---
  const dropzone = document.getElementById('ta-dropzone');
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) parseImageFile(file);
  });

  document.getElementById('ta-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) parseImageFile(file);
    e.target.value = '';
  });

  // --- Core: read file, send to backend for AI parsing ---
  async function parseImageFile(file) {
    const token = localStorage.getItem('ta_jwt_token');
    if (!token) {
      setStatus('Login required', true);
      return;
    }

    setStatus('Reading image...', false);
    showPreview('Converting file...');
    setDropEnabled(false);

    const base64 = await fileToBase64(file);
    const mimeType = detectMimeType(base64);

    setStatus('Analyzing chart...', false);
    showPreview('Analyzing price labels...');

    try {
      const res = await fetch(`${BACKEND}/api/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      if (res.status === 401) {
        localStorage.removeItem('ta_jwt_token');
        localStorage.removeItem('ta_user_email');
        resetWidget();
        showUnauthed();
        setStatus('Session expired — please log in again', true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      fillForm(data);

    } catch (err) {
      showPreview(err.message);
      setStatus('Failed', true);
    } finally {
      setDropEnabled(true);
    }
  }

  function showAuthed(email) {
    document.getElementById('ta-login-prompt').classList.add('hidden');
    document.getElementById('ta-logged-in').classList.remove('hidden');
    document.getElementById('ta-user-email').textContent = email || '';
    document.getElementById('ta-dropzone').classList.remove('hidden');
    document.getElementById('ta-status').textContent = '';
  }

  function showUnauthed() {
    document.getElementById('ta-login-prompt').classList.remove('hidden');
    document.getElementById('ta-logged-in').classList.add('hidden');
    document.getElementById('ta-dropzone').classList.add('hidden');
    document.getElementById('ta-actions').classList.add('hidden');
    showPreview('');
  }

  function initAuth() {
    const token = localStorage.getItem('ta_jwt_token');
    const email = localStorage.getItem('ta_user_email');
    if (token) showAuthed(email);
    else showUnauthed();
  }

  document.getElementById('ta-logout-btn').addEventListener('click', () => {
    localStorage.removeItem('ta_jwt_token');
    localStorage.removeItem('ta_user_email');
    resetWidget();
    showUnauthed();
  });

  document.getElementById('ta-login-btn').addEventListener('click', async () => {
    const email = document.getElementById('ta-login-email').value.trim();
    const pass  = document.getElementById('ta-login-pass').value;
    const msgEl = document.getElementById('ta-login-msg');
    msgEl.textContent = 'Logging in...';
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { msgEl.textContent = data.error || 'Login failed'; return; }
      localStorage.setItem('ta_jwt_token', data.token);
      localStorage.setItem('ta_user_email', email);
      document.getElementById('ta-login-email').value = '';
      document.getElementById('ta-login-pass').value = '';
      showAuthed(email);
    } catch (e) {
      msgEl.textContent = 'Cannot reach backend';
    }
  });

  initAuth();

  // --- Forgot / Reset password ---
  document.getElementById('ta-forgot-link').addEventListener('click', () => {
    document.getElementById('ta-login-prompt').classList.add('hidden');
    document.getElementById('ta-reset-prompt').classList.remove('hidden');
  });
  document.getElementById('ta-back-login').addEventListener('click', () => {
    document.getElementById('ta-reset-prompt').classList.add('hidden');
    document.getElementById('ta-login-prompt').classList.remove('hidden');
  });
  document.getElementById('ta-reset-btn').addEventListener('click', async () => {
    const email = document.getElementById('ta-reset-email').value.trim();
    const msgEl = document.getElementById('ta-reset-msg');
    if (!email) { msgEl.textContent = 'Enter your email'; return; }
    msgEl.textContent = 'Sending...';
    try {
      const res = await fetch(`${BACKEND}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      msgEl.textContent = res.ok
        ? 'Check your email for a reset link'
        : 'Email not found';
    } catch { msgEl.textContent = 'Cannot reach backend'; }
  });

  // --- Won / Lost / Open outcome buttons ---
  document.querySelectorAll('.ta-outcome-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ta-outcome-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const outcome = btn.dataset.outcome;
      const tp = parseFloat(document.getElementById('ta-tp').value);
      const sl = parseFloat(document.getElementById('ta-sl').value);
      if (outcome === 'win' && tp)  document.getElementById('ta-exit').value = tp;
      if (outcome === 'loss' && sl) document.getElementById('ta-exit').value = sl;
      if (outcome === 'open')       document.getElementById('ta-exit').value = '';
    });
  });

  function localISO() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function detectMimeType(base64) {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/png';
  }

  function setDropEnabled(enabled) {
    dropzone.style.pointerEvents = enabled ? '' : 'none';
    dropzone.style.opacity = enabled ? '' : '0.5';
  }

  function showPreview(text) {
    const el = document.getElementById('ta-preview');
    if (text) { el.textContent = text; el.classList.remove('hidden'); }
    else el.classList.add('hidden');
  }

  // --- Fill form with AI result ---
  function fillForm(data) {
    // Enforce side from prices — never trust the AI's side label
    if (data.entry && data.take_profit) {
      data.side = data.take_profit > data.entry ? 'long' : 'short';
    }
    // If SL is on the wrong side of entry, swap SL and TP
    if (data.entry && data.stop_loss && data.take_profit) {
      const slWrong = (data.side === 'long'  && data.stop_loss > data.entry) ||
                      (data.side === 'short' && data.stop_loss < data.entry);
      if (slWrong) {
        [data.stop_loss, data.take_profit] = [data.take_profit, data.stop_loss];
      }
    }

    const parts = [];
    if (data.side)        parts.push(data.side.toUpperCase());
    if (data.entry)       parts.push(`Entry: ${data.entry}`);
    if (data.stop_loss)   parts.push(`SL: ${data.stop_loss}`);
    if (data.take_profit) parts.push(`TP: ${data.take_profit}`);
    if (data.result)      parts.push(data.result === 'win' ? '✓ WIN' : '✗ LOSS');

    showPreview(parts.length ? parts.join('  |  ') : 'No position detected — fill in manually');

    if (data.side)        document.getElementById('ta-side').value  = data.side;
    if (data.quantity)    document.getElementById('ta-qty').value   = data.quantity;
    if (data.entry)       document.getElementById('ta-entry').value = data.entry;
    if (data.stop_loss)   document.getElementById('ta-sl').value    = data.stop_loss;
    if (data.take_profit) document.getElementById('ta-tp').value    = data.take_profit;
    if (data.exit_price)  document.getElementById('ta-exit').value  = data.exit_price;

    const e = data.entry, sl = data.stop_loss, tp = data.take_profit;
    let rr = null;
    if (e && sl && tp) {
      rr = data.side === 'short'
        ? Math.abs((e - tp) / (sl - e)).toFixed(2)
        : Math.abs((tp - e) / (e - sl)).toFixed(2);
    }
    if (rr) {
      const rrEl = document.getElementById('ta-rr');
      rrEl.textContent = `R:R  ${rr} : 1`;
      rrEl.classList.remove('hidden');
    }

    widget.dataset.symbol = data.symbol || '';
    widget.dataset.result  = data.result  || '';
    widget.dataset.rr      = rr || '';

    // Only auto-fill $/point if the symbol is explicitly in our map
    const pv = lookupPointValue(data.symbol);
    const pvEl = document.getElementById('ta-pv');
    if (pv) pvEl.value = pv;
    else pvEl.value = '';

    updatePnlPreview();
    document.getElementById('ta-actions').classList.remove('hidden');
    // Reset outcome buttons
    document.querySelectorAll('.ta-outcome-btn').forEach(b => b.classList.remove('active'));

    setStatus(data.entry ? 'Parsed — select outcome then log' : 'Fill in missing fields');
  }

  function updatePnlPreview() {
    const e   = parseFloat(document.getElementById('ta-entry').value);
    const sl  = parseFloat(document.getElementById('ta-sl').value);
    const tp  = parseFloat(document.getElementById('ta-tp').value);
    const qty = parseFloat(document.getElementById('ta-qty').value) || 1;
    const pv  = parseFloat(document.getElementById('ta-pv').value);
    const el  = document.getElementById('ta-pnl-preview');
    if (e && sl && tp && pv) {
      const risk   = Math.abs(e - sl)  * qty * pv;
      const reward = Math.abs(tp - e)  * qty * pv;
      el.textContent = `Risk $${risk.toFixed(0)}  →  Reward $${reward.toFixed(0)}`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function setStatus(msg, isError = false) {
    const el = document.getElementById('ta-status');
    el.textContent = msg;
    el.style.color = isError ? '#ff5c5c' : '#00d4aa';
  }

  function setMsg(msg, isError = false) {
    const el = document.getElementById('ta-msg');
    el.textContent = msg;
    el.style.color = isError ? '#ff5c5c' : '#00d4aa';
  }

  // --- Log Trade ---
  document.getElementById('ta-confirm').addEventListener('click', async () => {
    let symbol = widget.dataset.symbol;
    if (!symbol) symbol = prompt('Enter symbol (e.g. XAUUSD, NQ):')?.toUpperCase();
    if (!symbol) return setMsg('Symbol required', true);

    const side  = document.getElementById('ta-side').value;
    const qty   = parseFloat(document.getElementById('ta-qty').value) || 1;
    const entry = parseFloat(document.getElementById('ta-entry').value);
    const sl    = parseFloat(document.getElementById('ta-sl').value)   || null;
    const tp    = parseFloat(document.getElementById('ta-tp').value)   || null;
    const exit  = parseFloat(document.getElementById('ta-exit').value) || null;
    const pv    = parseFloat(document.getElementById('ta-pv').value) || lookupPointValue(symbol) || 1;
    const notes = document.getElementById('ta-notes').value.trim();
    const strategy = document.getElementById('ta-strategy').value || null;
    const side_mult = side === 'short' ? -1 : 1;
    const risk_reward = sl && tp && entry
      ? Math.abs((side === 'short' ? (entry - tp) : (tp - entry)) / Math.abs(entry - sl)).toFixed(2)
      : null;

    if (!entry) return setMsg('Entry price required', true);

    const trade = {
      symbol, side, entry_price: entry, quantity: qty,
      entry_time: localISO(),
      stop_loss: sl, take_profit: tp, risk_reward, notes, strategy,
      point_value: pv,
      ...(exit ? { exit_price: exit, exit_time: localISO() } : {}),
    };

    const token = localStorage.getItem('ta_jwt_token');
    if (!token) {
      document.getElementById('ta-login-prompt').classList.remove('hidden');
      return setMsg('Login required — see form above', true);
    }

    setMsg('Logging...');
    try {
      const res = await fetch(`${BACKEND}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(trade),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('ta_jwt_token');
          document.getElementById('ta-login-prompt').classList.remove('hidden');
          setMsg('Session expired — please login again', true);
        } else {
          setMsg(`Error: ${data.error || 'Failed'}`, true);
        }
      } else {
        setMsg('Trade logged!');
        setTimeout(resetWidget, 2500);
      }
    } catch (e) {
      setMsg('Cannot reach backend — is it running?', true);
    }
  });

  document.getElementById('ta-cancel').addEventListener('click', resetWidget);

  function recalcRR() {
    const e    = parseFloat(document.getElementById('ta-entry').value);
    const sl   = parseFloat(document.getElementById('ta-sl').value);
    const tp   = parseFloat(document.getElementById('ta-tp').value);
    const side = document.getElementById('ta-side').value;
    const rrEl = document.getElementById('ta-rr');
    if (e && sl && tp && Math.abs(e - sl) > 0) {
      const rr = side === 'short'
        ? Math.abs((e - tp) / (sl - e)).toFixed(2)
        : Math.abs((tp - e) / (e - sl)).toFixed(2);
      rrEl.textContent = `R:R  ${rr} : 1`;
      rrEl.classList.remove('hidden');
    } else {
      rrEl.classList.add('hidden');
    }
  }

  ['ta-entry', 'ta-sl', 'ta-tp', 'ta-pv', 'ta-qty'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { recalcRR(); updatePnlPreview(); });
  });
  document.getElementById('ta-side').addEventListener('change', () => { recalcRR(); updatePnlPreview(); });

  function resetWidget() {
    document.getElementById('ta-actions').classList.add('hidden');
    document.getElementById('ta-rr').classList.add('hidden');
    document.getElementById('ta-pnl-preview').classList.add('hidden');
    document.getElementById('ta-msg').textContent = '';
    document.getElementById('ta-status').textContent = '';
    document.querySelectorAll('.ta-outcome-btn').forEach(b => b.classList.remove('active'));
    showPreview('');
    ['ta-entry','ta-sl','ta-tp','ta-exit','ta-pv','ta-notes'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('ta-strategy').value = '';
    document.getElementById('ta-qty').value = '1';
  }
})();
