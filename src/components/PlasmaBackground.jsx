import { useEffect, useRef } from 'react'
import { startPlasma } from '../utils/plasma.js'
import '../styles/plasma.css'

export default function PlasmaBackground() {
  const canvasRef = useRef(null)

  useEffect(() => startPlasma(canvasRef.current), [])

  return <canvas ref={canvasRef} className="plasma-bg" aria-hidden="true" />
}