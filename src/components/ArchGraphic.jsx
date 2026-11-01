/**
 * Renders decorative vector SVG arches for the landing page hero section.
 * @returns {import('react').JSX.Element}
 */
export default function ArchGraphic() {
  return (
    <div className="arch-graphic-container">
      <svg
        className="arch-svg"
        viewBox="0 0 340 440"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="innerWarmGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f2a73b" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#e0457b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0d0c0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          className="arch-fill"
          d="M 94 430 L 94 170 A 76 76 0 0 1 246 170 L 246 430 Z"
          fill="url(#innerWarmGlow)"
        />

        <g className="arch-glow-group">
          <path
            className="arch-glow arch-glow-outer"
            pathLength="1000"
            d="M 50 430 L 50 170 A 120 120 0 0 1 290 170 L 290 430"
          />
          <path
            className="arch-glow arch-glow-middle"
            pathLength="1000"
            d="M 72 430 L 72 170 A 98 98 0 0 1 268 170 L 268 430"
          />
          <path
            className="arch-glow arch-glow-inner"
            pathLength="1000"
            d="M 94 430 L 94 170 A 76 76 0 0 1 246 170 L 246 430"
          />
        </g>

        <path
          className="arch-path arch-outer"
          pathLength="1000"
          d="M 50 430 L 50 170 A 120 120 0 0 1 290 170 L 290 430"
        />
        <path
          className="arch-path arch-middle"
          pathLength="1000"
          d="M 72 430 L 72 170 A 98 98 0 0 1 268 170 L 268 430"
        />
        <path
          className="arch-path arch-inner"
          pathLength="1000"
          d="M 94 430 L 94 170 A 76 76 0 0 1 246 170 L 246 430"
        />
      </svg>

      <div className="card-wrapper card-1-wrapper">
        <div className="card-inner card-1-inner">
          <div className="card-label">Budget</div>
          <div className="card-value">₹5,00,000</div>
          <div className="budget-bar">
            <span className="bar-segment bar-marigold" />
            <span className="bar-segment bar-pink" />
            <span className="bar-segment bar-teal" />
          </div>
        </div>
      </div>

      <div className="card-wrapper card-2-wrapper">
        <div className="card-inner card-2-inner">
          <div className="card-venue-row">
            <span className="venue-dot" />
            <div>
              <div className="venue-title">Book venue</div>
              <div className="venue-time">6 months before</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
