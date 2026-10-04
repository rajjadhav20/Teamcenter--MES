export function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour12: false });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat().format(value);
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value}%`;
}

export function truncate(text, max = 60) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
