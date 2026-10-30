import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateInput } from '../shared/validateInput.js'

const TODAY = new Date(2025, 5, 15)

const VALID_INPUT = {
  eventType: 'wedding',
  budget: 500000,
  guests: 200,
  date: '2025-12-20',
  city: 'Jaipur',
  vibe: 'Royal and traditional',
}

describe('validateInput', () => {
  it('accepts valid input', () => {
    const result = validateInput(VALID_INPUT, TODAY)
    assert.equal(result.valid, true)
    assert.deepStrictEqual(result.errors, {})
    assert.equal(result.value.eventType, 'wedding')
    assert.equal(result.value.budget, 500000)
    assert.equal(result.value.guests, 200)
    assert.equal(result.value.date, '2025-12-20')
    assert.equal(result.value.city, 'Jaipur')
    assert.equal(result.value.vibe, 'Royal and traditional')
  })

  it('accepts numeric strings for budget and guests', () => {
    const result = validateInput({ ...VALID_INPUT, budget: '500000', guests: '200' }, TODAY)
    assert.equal(result.valid, true)
    assert.equal(result.value.budget, 500000)
    assert.equal(result.value.guests, 200)
  })

  it('defaults vibe to empty string when omitted', () => {
    const { vibe, ...noVibe } = VALID_INPUT
    const result = validateInput(noVibe, TODAY)
    assert.equal(result.valid, true)
    assert.equal(result.value.vibe, '')
  })

  it('rejects invalid event type', () => {
    const result = validateInput({ ...VALID_INPUT, eventType: 'gala' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.eventType)
  })

  it('rejects budget below minimum', () => {
    const result = validateInput({ ...VALID_INPUT, budget: 500 }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.budget)
  })

  it('rejects budget above maximum', () => {
    const result = validateInput({ ...VALID_INPUT, budget: 200_000_000 }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.budget)
  })

  it('rejects non-integer guests', () => {
    const result = validateInput({ ...VALID_INPUT, guests: 10.5 }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.guests)
  })

  it('rejects guests below minimum', () => {
    const result = validateInput({ ...VALID_INPUT, guests: 0 }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.guests)
  })

  it('rejects guests above maximum', () => {
    const result = validateInput({ ...VALID_INPUT, guests: 10001 }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.guests)
  })

  it('rejects invalid date format', () => {
    const result = validateInput({ ...VALID_INPUT, date: '20-12-2025' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.date)
  })

  it('rejects non-existent calendar date', () => {
    const result = validateInput({ ...VALID_INPUT, date: '2025-02-30' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.date)
  })

  it('rejects a past date', () => {
    const result = validateInput({ ...VALID_INPUT, date: '2025-01-01' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.date)
  })

  it('rejects a date more than 5 years ahead', () => {
    const result = validateInput({ ...VALID_INPUT, date: '2031-06-16' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.date)
  })

  it('accepts today as a valid date', () => {
    const result = validateInput({ ...VALID_INPUT, date: '2025-06-15' }, TODAY)
    assert.equal(result.valid, true)
    assert.equal(result.value.date, '2025-06-15')
  })

  it('rejects empty city', () => {
    const result = validateInput({ ...VALID_INPUT, city: '  ' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.city)
  })

  it('rejects city longer than 80 characters', () => {
    const result = validateInput({ ...VALID_INPUT, city: 'A'.repeat(81) }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.city)
  })

  it('rejects vibe longer than 200 characters', () => {
    const result = validateInput({ ...VALID_INPUT, vibe: 'A'.repeat(201) }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.vibe)
  })

  it('strips control characters from city and vibe', () => {
    const result = validateInput({ ...VALID_INPUT, city: 'Jai\x00pur', vibe: 'Tra\x01ditional' }, TODAY)
    assert.equal(result.valid, true)
    assert.equal(result.value.city, 'Jaipur')
    assert.equal(result.value.vibe, 'Traditional')
  })

  it('rejects null input', () => {
    const result = validateInput(null, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors._form)
  })

  it('collects multiple errors at once', () => {
    const result = validateInput({ eventType: 'invalid', budget: -1, guests: 0, date: 'bad', city: '' }, TODAY)
    assert.equal(result.valid, false)
    assert.ok(result.errors.eventType)
    assert.ok(result.errors.budget)
    assert.ok(result.errors.guests)
    assert.ok(result.errors.date)
    assert.ok(result.errors.city)
  })
})
