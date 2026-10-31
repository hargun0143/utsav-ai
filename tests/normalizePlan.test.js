import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePlan } from '../api/_lib/normalizePlan.js'

const TODAY = new Date(2025, 5, 15)

const VALUE = {
  eventType: 'wedding',
  budget: 500000,
  guests: 200,
  date: '2025-12-20',
  city: 'Jaipur',
  vibe: 'Royal',
}

function makePlan(overrides = {}) {
  return {
    title: 'Royal Wedding in Jaipur',
    summary: 'A grand wedding celebration. Budget is well suited for the guest count.',
    budget: {
      categories: [
        { name: 'Venue', amount: 150000, note: 'Palace' },
        { name: 'Catering', amount: 120000, note: 'Traditional' },
        { name: 'Decor', amount: 80000, note: 'Flowers' },
        { name: 'Photography', amount: 50000, note: 'Video' },
        { name: 'Music', amount: 40000, note: 'Band' },
        { name: 'Misc', amount: 60000, note: 'Other' },
      ],
    },
    timeline: [
      { daysBefore: 180, task: 'Book venue' },
      { daysBefore: 120, task: 'Book caterer' },
      { daysBefore: 90, task: 'Send invitations' },
      { daysBefore: 60, task: 'Book photographer' },
      { daysBefore: 30, task: 'Confirm decorations' },
      { daysBefore: 7, task: 'Final walkthrough' },
    ],
    vendors: [
      { type: 'Venue', confirm: 'Availability and deposit' },
      { type: 'Caterer', confirm: 'Menu and headcount' },
      { type: 'Decorator', confirm: 'Theme and setup time' },
      { type: 'Photographer', confirm: 'Hours and deliverables' },
    ],
    ideas: [
      { title: 'Mehendi night', description: 'Traditional mehendi ceremony with live music.' },
      { title: 'Sangeet', description: 'Dance performances by family and friends.' },
      { title: 'Royal entry', description: 'Groom on horseback with a brass band.' },
    ],
    ...overrides,
  }
}

describe('normalizePlan', () => {
  it('normalizes a valid plan', () => {
    const raw = JSON.stringify(makePlan())
    const plan = normalizePlan(raw, VALUE, TODAY)
    assert.equal(plan.title, 'Royal Wedding in Jaipur')
    assert.equal(plan.meta.eventType, 'wedding')
    assert.equal(plan.meta.guests, 200)
    assert.equal(plan.meta.city, 'Jaipur')
    assert.equal(plan.meta.costPerGuest, 2500)
    assert.equal(plan.budget.categories.length, 6)
    assert.ok(plan.timeline.length >= 4)
    assert.ok(plan.vendors.length >= 4)
    assert.ok(plan.ideas.length >= 3)
  })

  it('scales category amounts to match the budget exactly', () => {
    const raw = JSON.stringify(makePlan({
      budget: {
        categories: [
          { name: 'A', amount: 100, note: '' },
          { name: 'B', amount: 200, note: '' },
          { name: 'C', amount: 300, note: '' },
          { name: 'D', amount: 400, note: '' },
        ],
      },
    }))
    const plan = normalizePlan(raw, VALUE, TODAY)
    const total = plan.budget.categories.reduce((s, c) => s + c.amount, 0)
    assert.equal(total, 500000)
  })

  it('computes percent for each category', () => {
    const raw = JSON.stringify(makePlan())
    const plan = normalizePlan(raw, VALUE, TODAY)
    plan.budget.categories.forEach((c) => {
      assert.equal(typeof c.percent, 'number')
      assert.ok(c.percent >= 0 && c.percent <= 100)
    })
  })

  it('keeps and clips optional note on each budget category, defaulting to empty string', () => {
    const raw = JSON.stringify(makePlan({
      budget: {
        categories: [
          { name: 'Cat1', amount: 100, note: '  Palace and lawn  ' },
          { name: 'Cat2', amount: 100, note: 'N'.repeat(250) },
          { name: 'Cat3', amount: 100 },
          { name: 'Cat4', amount: 100, note: null },
        ],
      },
    }))
    const plan = normalizePlan(raw, VALUE, TODAY)
    assert.equal(plan.budget.categories[0].note, 'Palace and lawn')
    assert.equal(plan.budget.categories[1].note, 'N'.repeat(200))
    assert.equal(plan.budget.categories[2].note, '')
    assert.equal(plan.budget.categories[3].note, '')
  })

  it('strips Markdown code fences from the response', () => {
    const json = JSON.stringify(makePlan())
    const fenced = '```json\n' + json + '\n```'
    const plan = normalizePlan(fenced, VALUE, TODAY)
    assert.equal(plan.title, 'Royal Wedding in Jaipur')
  })

  it('throws InvalidPlanError for invalid JSON', () => {
    assert.throws(
      () => normalizePlan('not json', VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for missing title', () => {
    const plan = makePlan()
    delete plan.title
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for missing summary', () => {
    const plan = makePlan()
    delete plan.summary
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for missing budget categories', () => {
    const plan = makePlan()
    delete plan.budget
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for too few categories', () => {
    const plan = makePlan({
      budget: { categories: [
        { name: 'A', amount: 100, note: '' },
        { name: 'B', amount: 200, note: '' },
        { name: 'C', amount: 300, note: '' },
      ] },
    })
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for missing timeline', () => {
    const plan = makePlan()
    delete plan.timeline
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('throws InvalidPlanError for missing vendors', () => {
    const plan = makePlan()
    delete plan.vendors
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('accepts a plan with exactly 3 vendors', () => {
    const plan = makePlan({
      vendors: [
        { type: 'Catering', confirm: 'Menu and count' },
        { type: 'Venue', confirm: 'Timings and deposit' },
        { type: 'Photography', confirm: 'Hours and deliverables' },
      ],
    })
    const result = normalizePlan(JSON.stringify(plan), VALUE, TODAY)
    assert.equal(result.vendors.length, 3)
  })

  it('throws InvalidPlanError for missing ideas', () => {
    const plan = makePlan()
    delete plan.ideas
    assert.throws(
      () => normalizePlan(JSON.stringify(plan), VALUE, TODAY),
      (err) => err.name === 'InvalidPlanError'
    )
  })

  it('clamps daysBefore between 0 and daysUntilEvent', () => {
    const plan = makePlan({
      timeline: [
        { daysBefore: 999, task: 'Way too early' },
        { daysBefore: -5, task: 'After event' },
        { daysBefore: 30, task: 'Normal task' },
        { daysBefore: 0, task: 'Event day' },
      ],
    })
    const daysUntil = Math.round(
      (new Date(2025, 11, 20) - new Date(2025, 5, 15)) / (1000 * 60 * 60 * 24)
    )
    const result = normalizePlan(JSON.stringify(plan), VALUE, TODAY)
    result.timeline.forEach((t) => {
      assert.ok(t.daysBefore >= 0, `daysBefore ${t.daysBefore} should be >= 0`)
      assert.ok(t.daysBefore <= daysUntil, `daysBefore ${t.daysBefore} should be <= ${daysUntil}`)
    })
  })

  it('sorts timeline earliest date first', () => {
    const raw = JSON.stringify(makePlan())
    const plan = normalizePlan(raw, VALUE, TODAY)
    for (let i = 1; i < plan.timeline.length; i++) {
      assert.ok(plan.timeline[i].date >= plan.timeline[i - 1].date)
    }
  })

  it('adds date fields to timeline items', () => {
    const raw = JSON.stringify(makePlan())
    const plan = normalizePlan(raw, VALUE, TODAY)
    plan.timeline.forEach((t) => {
      assert.match(t.date, /^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('computes daysUntilEvent in meta', () => {
    const raw = JSON.stringify(makePlan())
    const plan = normalizePlan(raw, VALUE, TODAY)
    const expected = Math.round(
      (new Date(2025, 11, 20) - new Date(2025, 5, 15)) / (1000 * 60 * 60 * 24)
    )
    assert.equal(plan.meta.daysUntilEvent, expected)
  })

  it('trims long strings to maximum length', () => {
    const plan = makePlan({
      title: 'T'.repeat(500),
      summary: 'S'.repeat(1000),
    })
    const result = normalizePlan(JSON.stringify(plan), VALUE, TODAY)
    assert.ok(result.title.length <= 200)
    assert.ok(result.summary.length <= 600)
  })
})
