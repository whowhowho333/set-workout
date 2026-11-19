export function today() {
  const date = new Date();
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
}

export function dateFromKey(key) {
  return new Date(`${key}T12:00:00`);
}
