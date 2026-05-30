// Service worker — image parsing + trade sync

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'PARSE_IMAGE') {
    callAnthropic(msg.base64, msg.mimeType)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (msg.type === 'SYNC_TRADE') {
    syncTrade(msg.trade).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

async function callAnthropic(base64, mimeType = 'image/jpeg') {
  const { anthropicKey } = await chrome.storage.local.get(['anthropicKey']);
  if (!anthropicKey) {
    throw new Error('No API key saved — open the extension popup and paste your Anthropic key');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: `This is a TradingView chart screenshot. Look at the price axis on the right side for colored rectangular price labels:
- GRAY or DARK box = Entry price
- GREEN box = Take Profit price
- RED box = Stop Loss price

Return ONLY this JSON, no other text:
{"entry":0,"stop_loss":0,"take_profit":0,"side":"long or short","symbol":null}

side = "long" if take_profit > entry, "short" if take_profit < entry. Use null for any value not visible.`,
            },
          ],
        }],
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Request timed out after 30s');
    throw new Error('Network error: ' + e.message);
  }
  clearTimeout(timer);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned unexpected response: ' + text.slice(0, 100));
  return JSON.parse(match[0]);
}

async function syncTrade(trade) {
  const { token } = await chrome.storage.local.get(['token']);
  if (!token) throw new Error('Not logged in — open the extension popup first');

  const res = await fetch('http://localhost:3001/api/trades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(trade),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sync failed');
  return data;
}
