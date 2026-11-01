import BudgetBreakdown from './BudgetBreakdown.jsx'
import Timeline from './Timeline.jsx'
import VendorChecklist from './VendorChecklist.jsx'
import IdeasGrid from './IdeasGrid.jsx'
import '../styles/results.css'

/**
 * Detailed view of the generated plan combining budget, timeline, vendors, and ideas.
 * @param {object} props - Component props.
 * @param {object} props.plan - The full generated event plan.
 * @returns {import('react').JSX.Element}
 */
export default function PlanDetails({ plan }) {
  return (
    <div className="plan-details">
      <div className="plan-row">
        <BudgetBreakdown categories={plan.budget.categories} />
        <Timeline items={plan.timeline} />
      </div>
      <VendorChecklist key={plan.title} vendors={plan.vendors} />
      <IdeasGrid ideas={plan.ideas} />
    </div>
  )
}