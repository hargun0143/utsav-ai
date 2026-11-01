import { useState, useRef } from 'react'
import { validateInput } from '../../shared/validateInput.js'
import { CITIES } from '../data/cities.js'
import EventTypeSelector from './EventTypeSelector.jsx'
import FormField from './FormField.jsx'

function getTodayString() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Interactive form for capturing event specifications and initiating plan generation.
 * @param {object} props - Component props.
 * @param {'idle' | 'loading' | 'success' | 'error'} props.status - Current generation request status.
 * @param {function(object): void} props.onSubmit - Submission callback receiving validated values.
 * @param {Record<string, string>} [props.serverFieldErrors={}] - Field-specific errors returned from the server.
 * @returns {import('react').JSX.Element}
 */
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
      const fieldOrder = Object.keys(fieldRefs)
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

      <FormField
        id="planner-budget"
        label="Budget (₹)"
        type="number"
        min="1000"
        value={formData.budget}
        onChange={(e) => handleChange('budget', e.target.value)}
        error={errors.budget}
        inputRef={budgetRef}
        disabled={isLoading}
      />

      <FormField
        id="planner-guests"
        label="Guests"
        type="number"
        min="1"
        value={formData.guests}
        onChange={(e) => handleChange('guests', e.target.value)}
        error={errors.guests}
        inputRef={guestsRef}
        disabled={isLoading}
      />

      <FormField
        id="planner-date"
        label="Event date"
        type="date"
        min={todayStr}
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        inputRef={dateRef}
        disabled={isLoading}
      />

      <FormField
        id="planner-city"
        label="City"
        type="text"
        list="city-options"
        autoComplete="off"
        maxLength={80}
        value={formData.city}
        onChange={(e) => handleChange('city', e.target.value)}
        error={errors.city}
        inputRef={cityRef}
        disabled={isLoading}
      >
        <datalist id="city-options">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </FormField>

      <FormField
        id="planner-vibe"
        label="Theme or vibe (optional)"
        as="textarea"
        maxLength={200}
        rows={3}
        value={formData.vibe}
        onChange={(e) => handleChange('vibe', e.target.value)}
        error={errors.vibe}
        inputRef={vibeRef}
        disabled={isLoading}
      />

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
