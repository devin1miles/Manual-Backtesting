export const usd = (val) => {
  const n = parseFloat(val) || 0;
  return (n >= 0 ? '+' : '') + '$' + Math.abs(n).toFixed(2);
};

export const pct = (val) => `${parseFloat(val || 0).toFixed(1)}%`;

export const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const pnlColor = (val) => parseFloat(val) >= 0 ? 'var(--green)' : 'var(--red)';
