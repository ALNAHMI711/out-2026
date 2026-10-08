// Safe formatting helpers for untrusted/nullish API values.

export function formatPrice(cents, currency = '$') {
  const n = Number(cents);
  if (!Number.isFinite(n)) return currency + '0.00';
  return currency + (n / 100).toFixed(2);
}

export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US');
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function safeString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}
