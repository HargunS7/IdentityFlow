// Date / number formatters shared across the app.

export function formatDate(iso, opts) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, opts);
  } catch {
    return String(iso);
  }
}

export function formatRelative(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";

  const sec = Math.round(diff / 1000);
  if (Math.abs(sec) < 45) return "just now";

  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60)
    return min > 0 ? `${min}m ago` : `in ${-min}m`;

  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return hr > 0 ? `${hr}h ago` : `in ${-hr}h`;

  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return day > 0 ? `${day}d ago` : `in ${-day}d`;

  return new Date(iso).toLocaleDateString();
}

export function minutesUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60)));
}
