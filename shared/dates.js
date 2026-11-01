// Date calculation utilities shared across client and server.
/**
 * Calculates the number of whole days between a reference date and an event date.
 * @param {Date} today - The reference date.
 * @param {string} dateStr - Target date string in YYYY-MM-DD format.
 * @returns {number} Days until the event.
 */
export function daysUntilEvent(today, dateStr) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const eventDate = new Date(y, m - 1, d)
  return Math.round((eventDate - todayStart) / (1000 * 60 * 60 * 24))
}
