export default function Dashboard({ onHome, headingRef }) {
  return (
    <div className="dashboard-content">
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
        <p className="dashboard-description">Planner coming next.</p>
      </main>
    </div>
  )
}
