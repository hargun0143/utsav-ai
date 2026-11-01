import { usePlan } from '../hooks/usePlan.js'
import PlannerForm from './PlannerForm.jsx'
import ResultsPanel from './ResultsPanel.jsx'
import PlasmaBackground from './PlasmaBackground.jsx'

/**
 * Main dashboard layout featuring header, planner form, and results panel.
 * @param {object} props - Component props.
 * @param {function(): void} props.onHome - Callback to transition back to the landing view.
 * @param {import('react').RefObject<HTMLHeadingElement>} props.headingRef - Ref passed to heading for reveal focus management.
 * @returns {import('react').JSX.Element}
 */
export default function Dashboard({ onHome, headingRef }) {
  const { status, plan, error, fieldErrors, generate, retry } = usePlan()

  return (
    <div className="dashboard-content">
      <PlasmaBackground />
      <header className="dashboard-header">
        <span className="wordmark">Utsav</span>
        <button type="button" className="btn-home" onClick={onHome}>
          Home
        </button>
      </header>

      <main className="dashboard-main">
        <h1 ref={headingRef} tabIndex={-1} className="dashboard-title">
          Your planner
        </h1>

        <div className="dashboard-grid">
          <aside className="form-column">
            <PlannerForm
              status={status}
              onSubmit={generate}
              serverFieldErrors={fieldErrors}
            />
          </aside>

          <section className="results-column">
            <ResultsPanel
              status={status}
              plan={plan}
              error={error}
              onRetry={retry}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
