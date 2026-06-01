const API_BASE = 'https://manual-backtesting-production.up.railway.app/api';

const ApiClient = {
  async _request(method, path, body = null) {
    const { token } = await StorageHelper.get(['token']);
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  login: (email, password) =>
    ApiClient._request('POST', '/auth/login', { email, password }),

  register: (email, password, username) =>
    ApiClient._request('POST', '/auth/register', { email, password, username }),

  verify: () => ApiClient._request('GET', '/auth/verify'),

  getTrades: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return ApiClient._request('GET', `/trades${qs ? '?' + qs : ''}`);
  },

  createTrade: (trade) => ApiClient._request('POST', '/trades', trade),

  updateTrade: (id, updates) => ApiClient._request('PUT', `/trades/${id}`, updates),

  deleteTrade: (id) => ApiClient._request('DELETE', `/trades/${id}`),

  getStats: (period) => ApiClient._request('GET', `/stats/${period}`),

  getEquityCurve: () => ApiClient._request('GET', '/stats/equity-curve'),

  getBySymbol: () => ApiClient._request('GET', '/stats/by-symbol'),

  getBestWorst: () => ApiClient._request('GET', '/stats/best-worst'),
};
