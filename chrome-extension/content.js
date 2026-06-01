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
      <div id="ta-login-prompt" class="hidden">
        <div class="ta-prompt-title">Login to log trades</div>
        <input id="ta-login-email" type="email" placeholder="Email" />
        <input id="ta-login-pass" type="password" placeholder="Password" />
        <button id="ta-login-btn">Login</button>
        <div id="ta-login-msg"></div>
      </div>
      <div id="ta-key-prompt" class="hidden">
        <input id="ta-key-input" type="password" placeholder="Paste Anthropic API key (sk-ant-...)" />
        <button id="ta-key-save">Save Key</button>
      </div>
      <div id="ta-dropzone">
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
        <input id="ta-exit"   type="number" placeholder="Exit Price (if closed)" step="0.01" />
        <div id="ta-rr" class="hidden"></div>
        <div class="ta-row">
          <input id="ta-pv" type="number" placeholder="$/point (e.g. 20)" step="0.01" min="0.01" />
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

  // --- Core: read file, call Anthropic directly from content script ---
  async function parseImageFile(file) {
    // Use localStorage — always accessible from content scripts, no extension context needed
    const key = localStorage.getItem('ta_anthropic_key');
    if (!key) {
      setStatus('No API key — enter it below', true);
      showKeyPrompt();
      return;
    }

    setStatus('Reading image...', false);
    showPreview('Converting file...');
    setDropEnabled(false);

    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    setStatus('Calling AI...', false);
    showPreview('Analyzing price labels...');
    setDropEnabled(false);

    // Step 3: call Anthropic directly
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 128,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: `Read the colored price label boxes on the RIGHT AXIS of this TradingView chart. There is a Position tool drawn as a colored rectangle.

STEP 1 — Read the GRAY or DARK box on the right axis → entry price.
STEP 2 — Read the GREEN box on the right axis → take_profit price.
STEP 3 — Determine side purely from numbers: take_profit > entry → "long" | take_profit < entry → "short"
STEP 4 — Find stop_loss: there may be multiple RED boxes on the right axis. Use STEP 3 to pick the correct one:
  • side = "long"  → stop_loss MUST be less than entry. Pick the red box below the gray box.
  • side = "short" → stop_loss MUST be greater than entry. Pick the red box above the gray box.
  Any red box that violates this rule is the live market ticker — ignore it.
STEP 5 — Read "Qty: XX" and "Risk/reward ratio: X.XX" from text inside the colored rectangle if visible.
STEP 6 — Symbol from top-left of chart (e.g. NQ, XAUUSD, ES1!)
STEP 7 — Outcome: did candles close past TP or SL after the entry?
  Candles past TP → result="win" exit_price=take_profit
  Candles past SL → result="loss" exit_price=stop_loss
  Unclear/open → result=null exit_price=null

Return ONLY this JSON, no other text:
{"entry":0,"stop_loss":0,"take_profit":0,"side":"long or short","symbol":null,"risk_reward":null,"quantity":null,"exit_price":null,"result":null}` },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content[0].text.trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Unexpected response: ' + text.slice(0, 80));
      fillForm(JSON.parse(match[0]));

    } catch (err) {
      showPreview(err.message);
      setStatus('Failed', true);
    } finally {
      setDropEnabled(true);
    }
  }

  document.getElementById('ta-login-btn').addEventListener('click', async () => {
    const email = document.getElementById('ta-login-email').value.trim();
    const pass  = document.getElementById('ta-login-pass').value;
    const msgEl = document.getElementById('ta-login-msg');
    msgEl.textContent = 'Logging in...';
    try {
      const res = await fetch('${BACKEND}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { msgEl.textContent = data.error || 'Login failed'; return; }
      localStorage.setItem('ta_jwt_token', data.token);
      document.getElementById('ta-login-prompt').classList.add('hidden');
      document.getElementById('ta-login-email').value = '';
      document.getElementById('ta-login-pass').value = '';
      setStatus('Logged in — ready to log trades', false);
    } catch (e) {
      msgEl.textContent = 'Cannot reach backend';
    }
  });

  function showKeyPrompt() {
    document.getElementById('ta-key-prompt').classList.remove('hidden');
    document.getElementById('ta-key-input').focus();
  }

  document.getElementById('ta-key-save').addEventListener('click', () => {
    const val = document.getElementById('ta-key-input').value.trim();
    if (!val.startsWith('sk-ant-')) {
      setStatus('Invalid key — must start with sk-ant-', true);
      return;
    }
    localStorage.setItem('ta_anthropic_key', val);
    document.getElementById('ta-key-input').value = '';
    document.getElementById('ta-key-prompt').classList.add('hidden');
    setStatus('Key saved — now drop a screenshot', false);
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

    const pv = lookupPointValue(data.symbol);
    if (pv) document.getElementById('ta-pv').value = pv;

    document.getElementById('ta-actions').classList.remove('hidden');

    if (data.result) {
      setStatus(data.result === 'win' ? 'Trade WON — confirm to log' : 'Trade LOST — confirm to log');
    } else {
      setStatus(data.entry ? 'AI detected — confirm to log' : 'Fill in missing fields');
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
    const side_mult = side === 'short' ? -1 : 1;
    const risk_reward = sl && tp && entry
      ? Math.abs((side === 'short' ? (entry - tp) : (tp - entry)) / Math.abs(entry - sl)).toFixed(2)
      : null;

    if (!entry) return setMsg('Entry price required', true);

    const trade = {
      symbol, side, entry_price: entry, quantity: qty,
      entry_time: localISO(),
      stop_loss: sl, take_profit: tp, risk_reward, notes,
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
      const res = await fetch('${BACKEND}/api/trades', {
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

  ['ta-entry', 'ta-sl', 'ta-tp'].forEach(id =>
    document.getElementById(id).addEventListener('input', recalcRR)
  );
  document.getElementById('ta-side').addEventListener('change', recalcRR);

  function resetWidget() {
    document.getElementById('ta-actions').classList.add('hidden');
    document.getElementById('ta-rr').classList.add('hidden');
    document.getElementById('ta-msg').textContent = '';
    document.getElementById('ta-status').textContent = '';
    showPreview('');
    ['ta-entry','ta-sl','ta-tp','ta-exit','ta-pv','ta-notes'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('ta-qty').value = '1';
  }
})();
