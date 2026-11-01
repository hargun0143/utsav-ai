// Normalizes and validates raw plan JSON from the Gemini API.
import { daysUntilEvent } from '../../shared/dates.js'

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

function formatDate(eventDateStr, daysBefore) {
  const [y, m, d] = eventDateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - daysBefore)
  const fy = dt.getFullYear()
  const fm = String(dt.getMonth() + 1).padStart(2, '0')
  const fd = String(dt.getDate()).padStart(2, '0')
  return `${fy}-${fm}-${fd}`
}

/**
 * Parses raw LLM text into a JSON object after stripping markdown code fences.
 * @param {string} rawText - Raw text response from the LLM.
 * @returns {object} Parsed JSON object.
 */
function parsePlanJson(rawText) {
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

  return parsed
}

/**
 * Normalizes budget categories, scales amounts to the target budget, and computes percentages.
 * @param {object} parsed - Parsed response object.
 * @param {number} targetBudget - Target total budget to scale amounts to.
 * @returns {Array<{ name: string, amount: number, percent: number, note: string }>} Scaled budget categories.
 */
function normalizeCategories(parsed, targetBudget) {
  if (!parsed.budget || !Array.isArray(parsed.budget.categories)) {
    throw new InvalidPlanError('budget.categories is required')
  }
  const rawCategories = requireArray(parsed.budget.categories, 'budget.categories', 4, 8)

  const categories = rawCategories.map((c) => ({
    name: clip(requireString(c.name, 'category name'), MAX_SHORT),
    amount: requirePositiveNumber(c.amount, 'category amount'),
    note: clip(c.note != null ? String(c.note) : '', MAX_SHORT),
  }))

  const rawTotal = categories.reduce((sum, c) => sum + c.amount, 0)
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

  return categories
}

/**
 * Normalizes timeline items, clamps daysBefore, formats dates, and sorts earliest first.
 * @param {Array<object>} rawTimeline - Raw timeline items array.
 * @param {string} eventDate - Event date string in YYYY-MM-DD format.
 * @param {number} maxDays - Maximum days before event (days until event).
 * @returns {Array<{ task: string, daysBefore: number, date: string }>} Sorted timeline items.
 */
function normalizeTimeline(rawTimeline, eventDate, maxDays) {
  const items = requireArray(rawTimeline, 'timeline', 4, 14)

  const timeline = items.map((t) => {
    const task = clip(requireString(t.task, 'timeline task'), MAX_SHORT)
    let db = Math.round(Number(t.daysBefore))
    if (!Number.isFinite(db)) {
      throw new InvalidPlanError('daysBefore must be a number')
    }
    db = Math.max(0, Math.min(db, maxDays))
    return { task, daysBefore: db, date: formatDate(eventDate, db) }
  })

  timeline.sort((a, b) => {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return 0
  })

  return timeline
}

/**
 * Normalizes and clips vendor checklist and creative idea items.
 * @param {Array<object>} rawVendors - Raw vendors array.
 * @param {Array<object>} rawIdeas - Raw ideas array.
 * @returns {{ vendors: Array<{ type: string, confirm: string }>, ideas: Array<{ title: string, description: string }> }} Normalized vendors and ideas.
 */
function normalizeVendorsAndIdeas(rawVendors, rawIdeas) {
  const vendorsList = requireArray(rawVendors, 'vendors', 3, 12)
  const ideasList = requireArray(rawIdeas, 'ideas', 3, 8)

  const vendors = vendorsList.map((v) => ({
    type: clip(requireString(v.type, 'vendor type'), MAX_SHORT),
    confirm: clip(requireString(v.confirm, 'vendor confirm'), MAX_LONG),
  }))

  const ideas = ideasList.map((idea) => ({
    title: clip(requireString(idea.title, 'idea title'), MAX_SHORT),
    description: clip(requireString(idea.description, 'idea description'), MAX_LONG),
  }))

  return { vendors, ideas }
}

/**
 * Builds the event plan metadata object.
 * @param {object} value - Validated user input details.
 * @param {number} maxDays - Days until the event.
 * @returns {object} Metadata object.
 */
function buildMeta(value, maxDays) {
  return {
    eventType: value.eventType,
    guests: value.guests,
    city: value.city,
    date: value.date,
    daysUntilEvent: maxDays,
    costPerGuest: Math.round(value.budget / value.guests),
  }
}

/**
 * Validates, clips, scales, and formats raw plan output into a consistent event plan structure.
 * @param {string} rawText - Raw JSON response from the LLM.
 * @param {object} value - Validated user input details.
 * @param {Date} [today=new Date()] - Reference date for date calculations.
 * @returns {object} The normalized event plan.
 */
export function normalizePlan(rawText, value, today = new Date()) {
  const parsed = parsePlanJson(rawText)
  const title = clip(requireString(parsed.title, 'title'), MAX_SHORT)
  const summary = clip(requireString(parsed.summary, 'summary'), MAX_LONG)
  const categories = normalizeCategories(parsed, value.budget)
  const maxDays = daysUntilEvent(today, value.date)
  const timeline = normalizeTimeline(parsed.timeline, value.date, maxDays)
  const { vendors, ideas } = normalizeVendorsAndIdeas(parsed.vendors, parsed.ideas)
  const meta = buildMeta(value, maxDays)

  return { title, summary, meta, budget: { categories }, timeline, vendors, ideas }
}
