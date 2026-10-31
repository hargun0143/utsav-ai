import BudgetBreakdown from './BudgetBreakdown.jsx'
import Timeline from './Timeline.jsx'
import '../styles/results.css'
import '../styles/empty.css'

const SAMPLE_CATEGORIES = [
  { name: 'Catering', amount: 225000, percent: 45, note: 'Menu for the main functions' },
  { name: 'Venue', amount: 110000, percent: 22, note: 'Hall, power backup, seating' },
  { name: 'Decor', amount: 70000, percent: 14, note: 'Flowers, lights, stage' },
  { name: 'Photography', amount: 50000, percent: 10, note: 'Candid coverage and an edited film' },
  { name: 'Contingency', amount: 45000, percent: 9, note: 'Buffer for surprises' },
]

const SAMPLE_TIMELINE = [
  { daysBefore: 90, date: '2027-01-20', task: 'Book the venue and the caterer' },
  { daysBefore: 60, date: '2027-02-19', task: 'Order outfits and confirm the photographer' },
  { daysBefore: 30, date: '2027-03-21', task: 'Send invitations and finalise the menu' },
  { daysBefore: 7, date: '2027-04-13', task: 'Confirm arrival times with every vendor' },
  { daysBefore: 0, date: '2027-04-20', task: 'Celebrate' },
]

export default function EmptyState() {
  return (
    <div className="empty-state">
      <h2 className="empty-title">
        Your plan will take shape <em>here.</em>
      </h2>
      <p className="empty-hint">
        Choose the occasion, add a budget and a headcount, then press Generate plan. Gemini drafts
        the budget split, a countdown timeline, a vendor checklist and ideas in a few seconds.
      </p>
      <p className="empty-caption">Sample preview, not your data</p>
      <div className="empty-ghost" aria-hidden="true">
        <div className="plan-details">
          <div className="plan-row">
            <BudgetBreakdown categories={SAMPLE_CATEGORIES} />
            <Timeline items={SAMPLE_TIMELINE} />
          </div>
        </div>
      </div>
    </div>
  )
}