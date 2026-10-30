import { useEffect, useRef } from 'react'
import { formatRupees } from '../utils/format.js'

export default function ResultsPanel({ status, plan, error, onRetry }) {
  const headingRef = useRef(null)

  useEffect(() => {
    if (status === 'success' && headingRef.current) {
      headingRef.current.focus()
    }
  }, [status, plan])

  if (status === 'idle') {
    return (
      <div className="panel-card panel-idle">
        <p className="panel-title">Your plan will appear here.</p>
        <p className="panel-hint">Fill in the details and press Generate plan.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="panel-card panel-loading" aria-live="polite">
        <div className="pulse-dots" aria-hidden="true">
          <span className="pulse-dot dot-marigold" />
          <span className="pulse-dot dot-pink" />
          <span className="pulse-dot dot-teal" />
        </div>
        <p className="loading-text">
          Drafting your plan with Gemini. This can take up to 30 seconds.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="panel-card panel-error" role="alert">
        <p className="error-message">{error?.message || 'Something went wrong. Please try again.'}</p>
        {error?.retryable && onRetry && (
          <button type="button" className="btn-retry" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    )
  }

  if (status === 'success' && plan) {
    const meta = plan.meta || {}

    return (
      <div className="panel-success">
        <h2 ref={headingRef} tabIndex={-1} className="plan-title">
          {plan.title}
        </h2>
        <p className="plan-summary">{plan.summary}</p>

        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Budget</span>
            <span className="metric-value">{formatRupees(meta.budget != null ? meta.budget : plan.budget?.categories?.reduce((s, c) => s + c.amount, 0))}</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Guests</span>
            <span className="metric-value">{meta.guests}</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Days left</span>
            <span className="metric-value">{meta.daysUntilEvent}</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Per guest</span>
            <span className="metric-value">{formatRupees(meta.costPerGuest)}</span>
          </div>
        </div>

        <p className="plan-disclaimer">
          Drafted by Gemini. Estimates only, so confirm prices with real vendors.
        </p>
      </div>
    )
  }

  return null
}
