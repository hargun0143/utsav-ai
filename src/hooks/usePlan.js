import { useState, useRef, useCallback } from 'react'

export function usePlan() {
  const [status, setStatus] = useState('idle')
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const lastValueRef = useRef(null)
  const statusRef = useRef('idle')

  const generate = useCallback(async (value) => {
    if (statusRef.current === 'loading') return

    lastValueRef.current = value
    statusRef.current = 'loading'
    setStatus('loading')
    setError(null)
    setFieldErrors({})

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 65000)

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (res.status === 200) {
        const data = await res.json()
        setPlan(data)
        statusRef.current = 'success'
        setStatus('success')
        return
      }

      if (res.status === 400) {
        const data = await res.json()
        setFieldErrors(data.fields || {})
        setError({
          message: data.error || 'Please check the form.',
          retryable: false,
        })
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        setError({
          message: data.error || 'The AI service is busy right now. Please try again in a moment.',
          retryable: true,
        })
        statusRef.current = 'error'
        setStatus('error')
        return
      }

      const data = await res.json().catch(() => ({}))
      setError({
        message: data.error || 'Something went wrong. Please try again.',
        retryable: true,
      })
      statusRef.current = 'error'
      setStatus('error')
    } catch (err) {
      clearTimeout(timer)
      const isAbort = err?.name === 'AbortError'
      setError({
        message: isAbort
          ? 'Planning took longer than expected. Please try again.'
          : 'Something went wrong. Please try again.',
        retryable: true,
      })
      statusRef.current = 'error'
      setStatus('error')
    }
  }, [])

  const retry = useCallback(() => {
    if (lastValueRef.current) {
      generate(lastValueRef.current)
    }
  }, [generate])

  return { status, plan, error, fieldErrors, generate, retry }
}
