export function getStartOfToday() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return startOfToday;
}
