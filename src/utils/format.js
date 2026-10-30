const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatRupees(n) {
  if (n == null || !Number.isFinite(Number(n))) return ''
  return inrFormatter.format(n)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts.map(Number)
  if (!y || !m || !d) return iso
  const monthName = MONTHS[m - 1] || ''
  return `${d} ${monthName} ${y}`
}
