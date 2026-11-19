const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const dayAndMonth = { day: 'numeric', month: 'long' };
const todayFormat = new Intl.DateTimeFormat('en-GB', dayAndMonth);
const historyDateFormat = new Intl.DateTimeFormat('en-GB', { ...dayAndMonth, year: 'numeric' });
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 });

export const formatToday = (date) => `${weekdayFormat.format(date)}, ${todayFormat.format(date)}`;
export const formatHistoryDate = (date) => historyDateFormat.format(date);
export const formatNumber = (value) => numberFormat.format(value);

export function describeReps(reps) {
  return `${formatNumber(reps)} ${reps === 1 ? 'rep' : 'reps'}`;
}

export function describeWeight(weight) {
  return `${formatNumber(weight)}\u00a0kg`;
}

export function describeSet(set) {
  return `${describeWeight(set.weight)} · ${describeReps(set.reps)}`;
}
