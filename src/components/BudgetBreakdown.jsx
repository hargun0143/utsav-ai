import { formatRupees } from '../utils/format.js'
import { PALETTE } from '../utils/palette.js'

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

/**
 * Displays an SVG donut chart and itemized breakdown of event budget allocations.
 * @param {object} props - Component props.
 * @param {Array<{ name: string, amount: number, percent: number, note: string }>} props.categories - Budget categories.
 * @returns {import('react').JSX.Element}
 */
export default function BudgetBreakdown({ categories }) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0)

  const segments = categories.map((category, index) => {
    const priorSum = categories.slice(0, index).reduce((sum, c) => sum + c.amount, 0)
    const length = (category.amount / total) * CIRCUMFERENCE
    const offset = -(priorSum / total) * CIRCUMFERENCE
    return {
      color: PALETTE[index % PALETTE.length],
      dash: `${Math.max(length - GAP, 0)} ${CIRCUMFERENCE}`,
      offset,
    }
  })

  return (
    <section className="plan-card" aria-labelledby="budget-heading">
      <h3 id="budget-heading">Where the money goes</h3>
      <div className="budget-body">
        <svg
          className="donut"
          viewBox="0 0 200 200"
          role="img"
          aria-label="Donut chart of the budget split by category"
        >
          <g transform="rotate(-90 100 100)">
            <g className="donut-ring" fill="none" strokeWidth="22">
              {segments.map((segment, index) => (
                <circle
                  key={`${categories[index].name}-${index}`}
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  stroke={segment.color}
                  strokeDasharray={segment.dash}
                  strokeDashoffset={segment.offset}
                />
              ))}
            </g>
          </g>
          <text className="donut-label" x="100" y="94" textAnchor="middle">Total</text>
          <text className="donut-total" x="100" y="118" textAnchor="middle">{formatRupees(total)}</text>
        </svg>
        <ul className="budget-list">
          {categories.map((category, index) => (
            <li key={`${category.name}-${index}`}>
              <span className="swatch" style={{ background: segments[index].color }} aria-hidden="true" />
              <div>
                <div className="budget-row-top">
                  <span>{category.name}</span>
                  <span className="budget-amount">{formatRupees(category.amount)}</span>
                </div>
                <div className="budget-row-sub">
                  {category.percent}%{category.note ? ` · ${category.note}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}