// Format API readings for display without changing prediction precision or thresholds.
export function formatApi(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : '—';
}
