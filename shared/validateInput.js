// Input validation and sanitization rules for event planner requests.
const EVENT_TYPES = ['wedding', 'birthday', 'community']
const MIN_BUDGET = 1000
const MAX_BUDGET = 100_000_000
const MIN_GUESTS = 1
const MAX_GUESTS = 10_000
const MAX_CITY_LEN = 80
const MAX_VIBE_LEN = 200
const MAX_YEARS_AHEAD = 5

function stripControl(s) {
  return s.replace(/\p{Cc}/gu, '')
}

function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function toNumber(v) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return NaN
    return Number(trimmed)
  }
  return NaN
}

/**
 * Validates the event occasion type.
 * @param {unknown} val - Raw event type value.
 * @returns {{ error?: string, value?: string }} Validation error or sanitized value.
 */
function validateEventType(val) {
  const eventType = typeof val === 'string' ? val.trim().toLowerCase() : ''
  if (!EVENT_TYPES.includes(eventType)) {
    return { error: 'Event type must be wedding, birthday or community' }
  }
  return { value: eventType }
}

/**
 * Validates the celebration budget amount.
 * @param {unknown} val - Raw budget value.
 * @returns {{ error?: string, value?: number }} Validation error or sanitized value.
 */
function validateBudget(val) {
  const budget = toNumber(val)
  if (!Number.isFinite(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET) {
    return { error: `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}` }
  }
  return { value: Math.floor(budget) }
}

/**
 * Validates the planned guest count.
 * @param {unknown} val - Raw guest count value.
 * @returns {{ error?: string, value?: number }} Validation error or sanitized value.
 */
function validateGuests(val) {
  const guests = toNumber(val)
  if (!Number.isInteger(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
    return { error: `Guest count must be a whole number between ${MIN_GUESTS} and ${MAX_GUESTS}` }
  }
  return { value: guests }
}

/**
 * Validates the event date format, calendar existence, and lead time window.
 * @param {unknown} val - Raw date string value.
 * @param {Date} today - Reference date.
 * @returns {{ error?: string, value?: string }} Validation error or sanitized value.
 */
function validateDate(val, today) {
  const dateStr = typeof val === 'string' ? val.trim() : ''
  if (!isValidDateString(dateStr)) {
    return { error: 'Date must be a valid date in YYYY-MM-DD format' }
  }
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const eventDate = new Date(y, m - 1, d)
  if (eventDate < todayStart) {
    return { error: 'Date must be today or in the future' }
  }
  const maxDate = new Date(todayStart)
  maxDate.setFullYear(maxDate.getFullYear() + MAX_YEARS_AHEAD)
  if (eventDate > maxDate) {
    return { error: 'Date must be within 5 years from today' }
  }
  return { value: dateStr }
}

/**
 * Validates and sanitizes the destination city name.
 * @param {unknown} val - Raw city string.
 * @returns {{ error?: string, value?: string }} Validation error or sanitized value.
 */
function validateCity(val) {
  const cityRaw = typeof val === 'string' ? stripControl(val).trim() : ''
  if (cityRaw.length < 1 || cityRaw.length > MAX_CITY_LEN) {
    return { error: `City must be between 1 and ${MAX_CITY_LEN} characters` }
  }
  return { value: cityRaw }
}

/**
 * Validates and sanitizes the optional vibe description.
 * @param {unknown} val - Raw vibe string.
 * @returns {{ error?: string, value?: string }} Validation error or sanitized value.
 */
function validateVibe(val) {
  const vibeRaw = val != null && typeof val === 'string' ? stripControl(val).trim() : ''
  if (vibeRaw.length > MAX_VIBE_LEN) {
    return { error: `Vibe must be at most ${MAX_VIBE_LEN} characters` }
  }
  return { value: vibeRaw }
}

/**
 * Validates and sanitizes raw user input for planning an event.
 * @param {object} raw - Unsanitized input from the request body or form.
 * @param {Date} [today=new Date()] - Reference date for validating lead time.
 * @returns {{ valid: boolean, errors: Record<string, string>, value: object }} Validation result.
 */
export function validateInput(raw, today = new Date()) {
  const errors = {}
  const value = {}

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: { _form: 'Input is required' }, value: {} }
  }

  const eventTypeRes = validateEventType(raw.eventType)
  if (eventTypeRes.error) errors.eventType = eventTypeRes.error
  else value.eventType = eventTypeRes.value

  const budgetRes = validateBudget(raw.budget)
  if (budgetRes.error) errors.budget = budgetRes.error
  else value.budget = budgetRes.value

  const guestsRes = validateGuests(raw.guests)
  if (guestsRes.error) errors.guests = guestsRes.error
  else value.guests = guestsRes.value

  const dateRes = validateDate(raw.date, today)
  if (dateRes.error) errors.date = dateRes.error
  else value.date = dateRes.value

  const cityRes = validateCity(raw.city)
  if (cityRes.error) errors.city = cityRes.error
  else value.city = cityRes.value

  const vibeRes = validateVibe(raw.vibe)
  if (vibeRes.error) errors.vibe = vibeRes.error
  else value.vibe = vibeRes.value

  const valid = Object.keys(errors).length === 0
  return { valid, errors, value }
}
