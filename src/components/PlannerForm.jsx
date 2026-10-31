import { useState, useRef } from 'react'
import { validateInput } from '../../shared/validateInput.js'
import { CITIES } from '../data/cities.js'
import EventTypeSelector from './EventTypeSelector.jsx'

function getTodayString() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PlannerForm({ status, onSubmit, serverFieldErrors = {} }) {
  const [formData, setFormData] = useState({
    eventType: 'wedding',
    budget: '',
    guests: '',
    date: '',
    city: '',
    vibe: '',
  })
  const [clientErrors, setClientErrors] = useState({})

  const budgetRef = useRef(null)
  const guestsRef = useRef(null)
  const dateRef = useRef(null)
  const cityRef = useRef(null)
  const vibeRef = useRef(null)

  const fieldRefs = {
    budget: budgetRef,
    guests: guestsRef,
    date: dateRef,
    city: cityRef,
    vibe: vibeRef,
  }

  const errors = { ...clientErrors, ...serverFieldErrors }
  const todayStr = getTodayString()

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (status === 'loading') return

    const result = validateInput(formData)
    if (!result.valid) {
      setClientErrors(result.errors)
      const fieldOrder = ['budget', 'guests', 'date', 'city', 'vibe']
      for (const field of fieldOrder) {
        if (result.errors[field] && fieldRefs[field]?.current) {
          fieldRefs[field].current.focus()
          break
        }
      }
      return
    }

    setClientErrors({})
    onSubmit(result.value)
  }

  const isLoading = status === 'loading'

  return (
    <form className="planner-form" onSubmit={handleSubmit} noValidate>
      <EventTypeSelector
        value={formData.eventType}
        onChange={(val) => handleChange('eventType', val)}
      />

      <div className="form-group">
        <label htmlFor="planner-budget" className="form-label">
          Budget (₹)
        </label>
        <input
          ref={budgetRef}
          id="planner-budget"
          type="number"
          min="1000"
          value={formData.budget}
          onChange={(e) => handleChange('budget', e.target.value)}
          className={`form-input ${errors.budget ? 'is-invalid' : ''}`}
          aria-invalid={Boolean(errors.budget)}
          aria-describedby={errors.budget ? 'budget-error' : undefined}
          disabled={isLoading}
        />
        {errors.budget && (
          <span id="budget-error" className="form-error" role="alert">
            {errors.budget}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="planner-guests" className="form-label">
          Guests
        </label>
        <input
          ref={guestsRef}
          id="planner-guests"
          type="number"
          min="1"
          value={formData.guests}
          onChange={(e) => handleChange('guests', e.target.value)}
          className={`form-input ${errors.guests ? 'is-invalid' : ''}`}
          aria-invalid={Boolean(errors.guests)}
          aria-describedby={errors.guests ? 'guests-error' : undefined}
          disabled={isLoading}
        />
        {errors.guests && (
          <span id="guests-error" className="form-error" role="alert">
            {errors.guests}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="planner-date" className="form-label">
          Event date
        </label>
        <input
          ref={dateRef}
          id="planner-date"
          type="date"
          min={todayStr}
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={`form-input ${errors.date ? 'is-invalid' : ''}`}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'date-error' : undefined}
          disabled={isLoading}
        />
        {errors.date && (
          <span id="date-error" className="form-error" role="alert">
            {errors.date}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="planner-city" className="form-label">
          City
        </label>
        <input
          ref={cityRef}
          id="planner-city"
          type="text"
          list="city-options"
          autoComplete="off"
          maxLength={80}
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          className={`form-input ${errors.city ? 'is-invalid' : ''}`}
          aria-invalid={Boolean(errors.city)}
          aria-describedby={errors.city ? 'city-error' : undefined}
          disabled={isLoading}
        />
        <datalist id="city-options">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        {errors.city && (
          <span id="city-error" className="form-error" role="alert">
            {errors.city}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="planner-vibe" className="form-label">
          Theme or vibe (optional)
        </label>
        <textarea
          ref={vibeRef}
          id="planner-vibe"
          maxLength={200}
          rows={3}
          value={formData.vibe}
          onChange={(e) => handleChange('vibe', e.target.value)}
          className={`form-textarea ${errors.vibe ? 'is-invalid' : ''}`}
          aria-invalid={Boolean(errors.vibe)}
          aria-describedby={errors.vibe ? 'vibe-error' : undefined}
          disabled={isLoading}
        />
        {errors.vibe && (
          <span id="vibe-error" className="form-error" role="alert">
            {errors.vibe}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="btn-generate"
        disabled={isLoading}
      >
        {isLoading ? 'Planning...' : 'Generate plan'}
      </button>
    </form>
  )
}
