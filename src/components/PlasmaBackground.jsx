import { useEffect, useRef } from 'react'
import { startPlasma } from '../utils/plasma.js'
import '../styles/plasma.css'

/**
 * Background component managing the full-bleed WebGL fluid plasma canvas.
 * @returns {import('react').JSX.Element}
 */
export default function PlasmaBackground() {
  const canvasRef = useRef(null)

  useEffect(() => startPlasma(canvasRef.current), [])

  return <canvas ref={canvasRef} className="plasma-bg" aria-hidden="true" />
}