const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/**
 * Formats a numeric value into an Indian Rupee currency string.
 * @param {number|string} n - Number to format.
 * @returns {string} Formatted currency string or empty string if invalid.
 */
export function formatRupees(n) {
  if (n == null || !Number.isFinite(Number(n))) return ''
  return inrFormatter.format(n)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Formats an ISO YYYY-MM-DD date string into a human-readable date.
 * @param {string} iso - ISO date string in YYYY-MM-DD format.
 * @returns {string} Formatted date like '20 Jan 2027'.
 */
export function formatDate(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts.map(Number)
  if (!y || !m || !d) return iso
  const monthName = MONTHS[m - 1] || ''
  return `${d} ${monthName} ${y}`
}
