export function daysUntilEvent(today, dateStr) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const eventDate = new Date(y, m - 1, d)
  return Math.round((eventDate - todayStart) / (1000 * 60 * 60 * 24))
}
