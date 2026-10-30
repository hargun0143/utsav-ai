class InvalidPlanError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidPlanError'
  }
}

const MAX_SHORT = 200
const MAX_LONG = 600

function clip(s, max) {
  return typeof s === 'string' ? s.trim().slice(0, max) : ''
}

function requireString(val, label) {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new InvalidPlanError(`${label} must be a non-empty string`)
  }
  return val.trim()
}

function requirePositiveNumber(val, label) {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) {
    throw new InvalidPlanError(`${label} must be a positive number`)
  }
  return n
}

function requireArray(val, label, min, max) {
  if (!Array.isArray(val) || val.length < min || val.length > max) {
    throw new InvalidPlanError(`${label} must have ${min} to ${max} items`)
  }
  return val
}

function daysUntilEvent(today, dateStr) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const eventDate = new Date(y, m - 1, d)
  return Math.round((eventDate - todayStart) / (1000 * 60 * 60 * 24))
}

function formatDate(eventDateStr, daysBefore) {
  const [y, m, d] = eventDateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - daysBefore)
  const fy = dt.getFullYear()
  const fm = String(dt.getMonth() + 1).padStart(2, '0')
  const fd = String(dt.getDate()).padStart(2, '0')
  return `${fy}-${fm}-${fd}`
}

export function normalizePlan(rawText, value, today = new Date()) {
  let text = typeof rawText === 'string' ? rawText.trim() : ''

  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new InvalidPlanError('Response is not valid JSON')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidPlanError('Response must be a JSON object')
  }

  const title = clip(requireString(parsed.title, 'title'), MAX_SHORT)
  const summary = clip(requireString(parsed.summary, 'summary'), MAX_LONG)

  if (!parsed.budget || !Array.isArray(parsed.budget.categories)) {
    throw new InvalidPlanError('budget.categories is required')
  }
  const rawCategories = requireArray(parsed.budget.categories, 'budget.categories', 4, 8)
  const rawTimeline = requireArray(parsed.timeline, 'timeline', 4, 14)
  const rawVendors = requireArray(parsed.vendors, 'vendors', 4, 12)
  const rawIdeas = requireArray(parsed.ideas, 'ideas', 3, 8)

  const categories = rawCategories.map((c) => ({
    name: clip(requireString(c.name, 'category name'), MAX_SHORT),
    amount: requirePositiveNumber(c.amount, 'category amount'),
    note: clip(c.note != null ? String(c.note) : '', MAX_SHORT),
  }))

  const rawTotal = categories.reduce((sum, c) => sum + c.amount, 0)
  const targetBudget = value.budget
  let allocated = 0
  let largestIdx = 0

  categories.forEach((c, i) => {
    c.amount = Math.floor((c.amount / rawTotal) * targetBudget)
    allocated += c.amount
    if (c.amount > categories[largestIdx].amount) {
      largestIdx = i
    }
  })

  categories[largestIdx].amount += targetBudget - allocated

  categories.forEach((c) => {
    c.percent = Math.round((c.amount / targetBudget) * 1000) / 10
  })

  const maxDays = daysUntilEvent(today, value.date)

  const timeline = rawTimeline.map((t) => {
    const task = clip(requireString(t.task, 'timeline task'), MAX_SHORT)
    let db = Math.round(Number(t.daysBefore))
    if (!Number.isFinite(db)) {
      throw new InvalidPlanError('daysBefore must be a number')
    }
    db = Math.max(0, Math.min(db, maxDays))
    return { task, daysBefore: db, date: formatDate(value.date, db) }
  })

  timeline.sort((a, b) => {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return 0
  })

  const vendors = rawVendors.map((v) => ({
    type: clip(requireString(v.type, 'vendor type'), MAX_SHORT),
    confirm: clip(requireString(v.confirm, 'vendor confirm'), MAX_LONG),
  }))

  const ideas = rawIdeas.map((idea) => ({
    title: clip(requireString(idea.title, 'idea title'), MAX_SHORT),
    description: clip(requireString(idea.description, 'idea description'), MAX_LONG),
  }))

  const dUntil = daysUntilEvent(today, value.date)
  const meta = {
    eventType: value.eventType,
    guests: value.guests,
    city: value.city,
    date: value.date,
    daysUntilEvent: dUntil,
    costPerGuest: Math.round(targetBudget / value.guests),
  }

  return { title, summary, meta, budget: { categories }, timeline, vendors, ideas }
}
