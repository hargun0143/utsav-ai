import { useState, useRef, useEffect } from 'react'
import Landing from './components/Landing.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [started, setStarted] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const dashboardRef = useRef(null)
  const revealMarigoldRef = useRef(null)
  const headingRef = useRef(null)
  const startBtnRef = useRef(null)
  const hasInteracted = useRef(false)

  const handleStart = ({ x, y }) => {
    hasInteracted.current = true
    const layers = [revealMarigoldRef.current, dashboardRef.current]
    layers.forEach((el) => {
      if (el) {
        el.style.transition = 'none'
        el.style.setProperty('--x', `${x}px`)
        el.style.setProperty('--y', `${y}px`)
        el.style.clipPath = `circle(0px at ${x}px ${y}px)`
      }
    })
    if (dashboardRef.current) {
      void dashboardRef.current.offsetHeight
    }
    layers.forEach((el) => {
      if (el) {
        el.style.transition = ''
        el.style.clipPath = ''
      }
    })
    setCoords({ x, y })
    setStarted(true)
  }

  const handleHome = () => {
    hasInteracted.current = true
    setStarted(false)
  }

  const handleTransitionEnd = (e) => {
    if (e.target !== dashboardRef.current || e.propertyName !== 'clip-path') return
    if (started) {
      headingRef.current?.focus()
    } else {
      startBtnRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!hasInteracted.current) return
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) {
      if (started) {
        headingRef.current?.focus()
      } else {
        startBtnRef.current?.focus()
      }
    }
  }, [started])

  return (
    <>
      <div
        className="landing-container"
        inert={started ? true : undefined}
        aria-hidden={started}
      >
        <Landing onStart={handleStart} startBtnRef={startBtnRef} />
      </div>

      <div
        ref={revealMarigoldRef}
        className={`reveal-layer reveal-marigold ${started ? 'is-open' : ''}`}
        style={{
          '--x': `${coords.x}px`,
          '--y': `${coords.y}px`,
        }}
        aria-hidden="true"
        inert="true"
      />

      <div
        ref={dashboardRef}
        className={`dashboard-layer ${started ? 'is-open' : ''}`}
        style={{
          '--x': `${coords.x}px`,
          '--y': `${coords.y}px`,
        }}
        inert={!started ? true : undefined}
        aria-hidden={!started}
        onTransitionEnd={handleTransitionEnd}
      >
        <Dashboard onHome={handleHome} headingRef={headingRef} />
      </div>
    </>
  )
}
