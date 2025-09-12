export const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v);
export const toNum = (v: unknown): number | null => {
  if (isNum(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/[$,%\s]/g, ''));
    return isFinite(n) ? n : null;
  }
  return null;
};
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function fmtCurrencySafe(v: unknown, currency = 'USD') {
  const n = toNum(v);
  if (n === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
export function fmtPercentSafe(numerator: unknown, denominator: unknown) {
  const a = toNum(numerator), b = toNum(denominator);
  if (a === null || b === null || b <= 0) return '—%';
  return `${Math.round(clamp01(a / b) * 100)}%`;
}
export function widthPercent(numerator: unknown, denominator: unknown) {
  const a = toNum(numerator), b = toNum(denominator);
  if (a === null || b === null || b <= 0) return '0%';
  return `${clamp01(a / b) * 100}%`;
}