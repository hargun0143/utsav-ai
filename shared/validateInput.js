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

export function validateInput(raw, today = new Date()) {
  const errors = {}
  const value = {}

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: { _form: 'Input is required' }, value: {} }
  }

  const eventType = typeof raw.eventType === 'string' ? raw.eventType.trim().toLowerCase() : ''
  if (!EVENT_TYPES.includes(eventType)) {
    errors.eventType = 'Event type must be wedding, birthday or community'
  } else {
    value.eventType = eventType
  }

  const budget = toNumber(raw.budget)
  if (!Number.isFinite(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET) {
    errors.budget = `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}`
  } else {
    value.budget = Math.floor(budget)
  }

  const guests = toNumber(raw.guests)
  if (!Number.isInteger(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
    errors.guests = `Guest count must be a whole number between ${MIN_GUESTS} and ${MAX_GUESTS}`
  } else {
    value.guests = guests
  }

  const dateStr = typeof raw.date === 'string' ? raw.date.trim() : ''
  if (!isValidDateString(dateStr)) {
    errors.date = 'Date must be a valid date in YYYY-MM-DD format'
  } else {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const [y, m, d] = dateStr.split('-').map(Number)
    const eventDate = new Date(y, m - 1, d)
    if (eventDate < todayStart) {
      errors.date = 'Date must be today or in the future'
    } else {
      const maxDate = new Date(todayStart)
      maxDate.setFullYear(maxDate.getFullYear() + MAX_YEARS_AHEAD)
      if (eventDate > maxDate) {
        errors.date = 'Date must be within 5 years from today'
      } else {
        value.date = dateStr
      }
    }
  }

  const cityRaw = typeof raw.city === 'string' ? stripControl(raw.city).trim() : ''
  if (cityRaw.length < 1 || cityRaw.length > MAX_CITY_LEN) {
    errors.city = `City must be between 1 and ${MAX_CITY_LEN} characters`
  } else {
    value.city = cityRaw
  }

  const vibeRaw = raw.vibe != null && typeof raw.vibe === 'string' ? stripControl(raw.vibe).trim() : ''
  if (vibeRaw.length > MAX_VIBE_LEN) {
    errors.vibe = `Vibe must be at most ${MAX_VIBE_LEN} characters`
  } else {
    value.vibe = vibeRaw
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors, value }
}
