const TradeParser = {

  _price(str) {
    return parseFloat(String(str).replace(/,/g, ''));
  },

  _scanText(text, result, targetRef, stopRef) {
    // "Target: 145.9 (0.492%) ..."
    const tgt = text.match(/Target[:\s]*([\d,]+\.?\d*)\s*\(([\d.]+)%\)/i);
    if (tgt) {
      targetRef.points = TradeParser._price(tgt[1]);
      targetRef.pct    = parseFloat(tgt[2]);
    }
    // "Stop: 145.9 (0.492%) ..."
    const stp = text.match(/Stop[:\s]*([\d,]+\.?\d*)\s*\(([\d.]+)%\)/i);
    if (stp) {
      stopRef.points = TradeParser._price(stp[1]);
      stopRef.pct    = parseFloat(stp[2]);
    }
    // "Qty: 1"
    const qty = text.match(/Qty[:\s]+(\d+)/i);
    if (qty && !result.quantity) result.quantity = parseInt(qty[1]);
    // "Risk/reward ratio: 2.43"
    const rr = text.match(/Risk[\s/]+reward[^:]*:\s*([\d.]+)/i);
    if (rr && !result.risk_reward) result.risk_reward = parseFloat(rr[1]);
  },

  readPositionTool() {
    const result = {};
    const target = { points: null, pct: null };
    const stop   = { points: null, pct: null };

    // Pass 1: scan innerText of every div/span — handles text split across child elements
    const els = document.querySelectorAll('div, span, td, p, label');
    for (const el of els) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text.length < 8 || text.length > 300) continue;
      TradeParser._scanText(text, result, target, stop);
    }

    // Pass 2: fallback — scan full body innerText
    if (!target.points || !target.pct) {
      TradeParser._scanText(document.body.innerText || '', result, target, stop);
    }

    console.log('[TradeParser v2] target:', target, 'stop:', stop, 'qty:', result.quantity);

    // Calculate entry from points ÷ (pct/100)
    // e.g. 145.9 ÷ 0.00492 = 29,655 ≈ entry price
    if (target.points && target.pct) {
      result.entry = Math.round((target.points / (target.pct / 100)) * 100) / 100;
    } else if (stop.points && stop.pct) {
      result.entry = Math.round((stop.points / (stop.pct / 100)) * 100) / 100;
    }

    if (result.entry) {
      if (target.points) result.take_profit = Math.round((result.entry + target.points) * 100) / 100;
      if (stop.points)   result.stop_loss   = Math.round((result.entry - stop.points)   * 100) / 100;
    }

    // Derive side: TP above entry = long, below = short
    if (result.take_profit && result.stop_loss) {
      result.side = result.take_profit > result.stop_loss ? 'long' : 'short';
    }

    console.log('[TradeParser v2] result:', result);
    return result;
  },

  readSymbol() {
    const selectors = [
      '.tv-symbol-header__exchange-title',
      '[class*="symbolTitle"]',
      '[class*="symbol-"] [class*="name"]',
      '[class*="pane-legend"] [class*="title"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        return el.textContent.trim().replace(/[^A-Z0-9/]/gi, '').toUpperCase().split(/\s/)[0];
      }
    }
    return null;
  },

  readFromDOM() {
    return { symbol: TradeParser.readSymbol(), ...TradeParser.readPositionTool() };
  },
};
