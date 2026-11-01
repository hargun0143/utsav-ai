import ArchGraphic from './ArchGraphic.jsx'

const tickerItems = [
  { name: 'Weddings', dotClass: 'dot-marigold' },
  { name: 'Birthdays', dotClass: 'dot-pink' },
  { name: 'Mehendi', dotClass: 'dot-teal' },
  { name: 'Sangeet', dotClass: 'dot-marigold' },
  { name: 'Anniversaries', dotClass: 'dot-pink' },
  { name: 'Community fairs', dotClass: 'dot-teal' },
]

/**
 * Landing view featuring hero copy, animated badge ticker, arch graphics, and enter action.
 * @param {object} props - Component props.
 * @param {function({ x: number, y: number }): void} props.onStart - Callback triggered with click coordinates to start reveal transition.
 * @param {import('react').RefObject<HTMLButtonElement>} props.startBtnRef - Ref passed to start button for focus management.
 * @returns {import('react').JSX.Element}
 */
export default function Landing({ onStart, startBtnRef }) {
  const handleStart = (e) => {
    if (!onStart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(rect.left + rect.width / 2)
    const y = Math.round(rect.top + rect.height / 2)
    onStart({ x, y })
  }

  return (
    <div className="landing-page">
      <main className="landing-main">
        <div className="landing-left">
          <div className="wordmark">Utsav</div>
          <h1 className="hero-title">
            <span className="hero-line hero-line-1">Every celebration</span>
            <span className="hero-line hero-line-2">
              deserves a <em className="hero-plan">plan.</em>
            </span>
          </h1>
          <p className="hero-description">
            Tell us the occasion, the budget and the headcount. Get a budget
            split, a countdown timeline and a vendor checklist.
          </p>
          <div>
            <button
              ref={startBtnRef}
              type="button"
              className="btn-start"
              onClick={handleStart}
            >
              Start planning
            </button>
          </div>
        </div>

        <div className="landing-right">
          <ArchGraphic />
        </div>
      </main>

      <footer className="bottom-strip">
        <div className="ticker-track">
          <div className="ticker-group">
            {tickerItems.map((item, index) => (
              <span key={`a-${index}`} className="ticker-item">
                {item.name} <span className={`ticker-dot ${item.dotClass}`} />
              </span>
            ))}
          </div>
          <div className="ticker-group" aria-hidden="true">
            {tickerItems.map((item, index) => (
              <span key={`b-${index}`} className="ticker-item">
                {item.name} <span className={`ticker-dot ${item.dotClass}`} />
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
