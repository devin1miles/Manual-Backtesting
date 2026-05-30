import { useState, useEffect } from 'react';
import api from '../api/client';
import TradeTable from '../components/TradeTable';

export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => { load(); }, [symbol, status]);

  async function load() {
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (symbol) params.set('symbol', symbol);
      if (status) params.set('status', status);
      const data = await api.get(`/trades?${params}`);
      setTrades(data);
    } catch {}
  }

  async function deleteTrade(id) {
    if (!confirm('Delete this trade?')) return;
    try { await api.delete(`/trades/${id}`); load(); } catch {}
  }

  const exportCSV = () => {
    const headers = ['ID', 'Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'PnL', 'Status', 'Date'];
    const rows = trades.map(t => [
      t.id, t.symbol, t.side, t.entry_price, t.exit_price || '', t.quantity,
      t.pnl || '', t.status, new Date(t.entry_time).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'trades.csv';
    a.click();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.h2}>Trade Journal</h2>
        <button style={styles.exportBtn} onClick={exportCSV}>Export CSV</button>
      </div>

      <div style={styles.filters}>
        <input style={styles.input} placeholder="Filter by symbol..." value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
        <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <span style={styles.count}>{trades.length} trades</span>
      </div>

      <TradeTable trades={trades} onDelete={deleteTrade} />
    </div>
  );
}

const styles = {
  page: { flex: 1, padding: 32, overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  h2: { fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  exportBtn: { padding: '7px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: 13 },
  filters: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 },
  input: { padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' },
  count: { color: 'var(--muted)', fontSize: 12, marginLeft: 'auto' },
};
